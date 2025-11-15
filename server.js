const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// Supabase Database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Store temporary orders in memory (fallback)
let tempOrders = new Map();

// 1. Get available brands
app.get('/api/brands', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('id');
        
        if (error) throw error;
        res.json({ success: true, brands: data });
    } catch (error) {
        console.error('Brands error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch brands' });
    }
});

// 2. Check available keys count
app.get('/api/keys/available/:brandId', async (req, res) => {
    try {
        const { brandId } = req.params;
        
        const { data, error } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'available');
        
        if (error) throw error;
        res.json({ success: true, count: data.length });
    } catch (error) {
        console.error('Keys count error:', error);
        res.status(500).json({ success: false, error: 'Failed to check keys' });
    }
});

// 3. Create order
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount, customerEmail } = req.body;
        
        // First, check if keys are available
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandId)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) throw keysError;
            
        if (availableKeys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }

        // Create order in database
        const { error: orderError } = await supabase
            .from('orders')
            .insert({
                order_id: orderId,
                brand_id: brandId,
                plan_name: planName,
                amount: amount,
                customer_email: customerEmail,
                status: 'pending'
            });
            
        if (orderError) throw orderError;

        // Store temporarily as backup
        tempOrders.set(orderId, {
            brandId,
            planName,
            amount,
            customerEmail,
            status: 'PENDING'
        });

        res.json({ 
            success: true, 
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// 4. Process payment and get key
app.post('/api/process-payment', async (req, res) => {
    try {
        const { orderId } = req.body;

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
        if (orderError) throw orderError;
        
        // Find available key
        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', order.brand_id)
            .eq('plan', order.plan_name)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) throw keysError;
            
        if (keys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }
        
        // Assign key to order and mark as sold
        const key = keys[0];
        const { error: updateError } = await supabase
            .from('keys')
            .update({
                status: 'sold',
                order_id: orderId,
                sold_at: new Date().toISOString()
            })
            .eq('id', key.id);
            
        if (updateError) throw updateError;
        
        // Update order status
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
            
        if (orderUpdateError) throw orderUpdateError;
        
        res.json({ 
            success: true, 
            key: key.key_value,
            order: order
        });
        
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ success: false, error: 'Failed to process payment' });
    }
});

// 5. Admin - Get all keys
app.get('/api/admin/keys', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('keys')
            .select(`
                *,
                brands (name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json({ success: true, keys: data });
    } catch (error) {
        console.error('Admin keys error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch keys' });
    }
});

// 6. Admin - Add new key
app.post('/api/admin/keys', async (req, res) => {
    try {
        const { brandId, plan, keyValue } = req.body;
        
        const { data, error } = await supabase
            .from('keys')
            .insert({
                brand_id: brandId,
                plan: plan,
                key_value: keyValue,
                status: 'available'
            })
            .select();
            
        if (error) throw error;
        res.json({ success: true, key: data[0] });
    } catch (error) {
        console.error('Add key error:', error);
        res.status(500).json({ success: false, error: 'Failed to add key' });
    }
});

// 7. Admin - Get stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Total keys
        const { data: totalKeys, error: totalError } = await supabase
            .from('keys')
            .select('*', { count: 'exact' });
            
        if (totalError) throw totalError;
        
        // Available keys
        const { data: availableKeys, error: availableError } = await supabase
            .from('keys')
            .select('*', { count: 'exact' })
            .eq('status', 'available');
            
        if (availableError) throw availableError;
        
        // Revenue from completed orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
            
        if (ordersError) throw ordersError;
        
        const revenue = orders.reduce((sum, order) => sum + order.amount, 0);
        
        res.json({
            success: true,
            stats: {
                totalKeys: totalKeys.length,
                availableKeys: availableKeys.length,
                soldKeys: totalKeys.length - availableKeys.length,
                revenue: revenue
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
