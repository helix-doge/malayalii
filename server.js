const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
app.get('/api/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('brands').select('count');
        if (error) throw error;
        res.json({ success: true, message: 'Database connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});

// 1. Get all brands
app.get('/api/brands', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('id');
        
        if (error) throw error;
        res.json({ success: true, brands: data || [] });
    } catch (error) {
        console.error('Brands error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch brands' });
    }
});

// 2. Check available keys count
app.get('/api/keys/available/:brandId', async (req, res) => {
    try {
        const { brandId } = req.params;
        
        const { count, error } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', brandId)
            .eq('status', 'available');
        
        if (error) throw error;
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        console.error('Keys count error:', error);
        res.status(500).json({ success: false, error: 'Failed to check keys' });
    }
});

// 3. Create order
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;
        
        // Validate input
        if (!orderId || !brandId || !planName || !amount) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if keys are available
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandId)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) throw keysError;
            
        if (!availableKeys || availableKeys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }

        // Create order
// In your server.js - replace the create-order endpoint with this:

// 3. Create order - FIXED VERSION
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;
        
        console.log('📨 Creating order with data:', { orderId, brandId, planName, amount });

        // Validate input with detailed errors
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'Order ID is required' });
        }
        if (!brandId) {
            return res.status(400).json({ success: false, error: 'Brand ID is required' });
        }
        if (!planName) {
            return res.status(400).json({ success: false, error: 'Plan name is required' });
        }
        if (!amount) {
            return res.status(400).json({ success: false, error: 'Amount is required' });
        }

        // Convert to proper types
        const brandIdInt = parseInt(brandId);
        const amountFloat = parseFloat(amount);
        
        if (isNaN(brandIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid brand ID format' });
        }
        if (isNaN(amountFloat)) {
            return res.status(400).json({ success: false, error: 'Invalid amount format' });
        }

        // Check if keys are available
        console.log(`🔑 Checking keys for brand ${brandIdInt}, plan ${planName}`);
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandIdInt)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) {
            console.error('❌ Keys check error:', keysError);
            throw keysError;
        }
            
        if (!availableKeys || availableKeys.length === 0) {
            console.log(`❌ No keys available for brand ${brandIdInt}, plan ${planName}`);
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }

        console.log(`✅ Keys available, creating order: ${orderId}`);

        // Create order with explicit data types
        const orderData = {
            order_id: orderId,
            brand_id: brandIdInt,
            plan_name: planName,
            amount: amountFloat,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        console.log('💾 Order data to insert:', orderData);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
            
        if (orderError) {
            console.error('❌ Order creation error:', orderError);
            
            // Check if it's a duplicate order ID error
            if (orderError.code === '23505') { // Unique violation
                return res.status(400).json({ 
                    success: false, 
                    error: 'Order ID already exists' 
                });
            }
            
            throw orderError;
        }

        console.log(`✅ Order created successfully: ${orderId}`);
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create order',
            details: error.message 
        });
    }
});
// 4. Process payment and get key
app.post('/api/process-payment', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, error: 'Order ID required' });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
        if (orderError) throw orderError;
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        // Find available key
        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', order.brand_id)
            .eq('plan', order.plan_name)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) throw keysError;
            
        if (!keys || keys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }
        
        // Assign key to order
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
        res.json({ success: true, keys: data || [] });
    } catch (error) {
        console.error('Admin keys error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch keys' });
    }
});

// 6. Admin - Add new key
app.post('/api/admin/keys', async (req, res) => {
    try {
        const { brandId, plan, keyValue } = req.body;
        
        if (!brandId || !plan || !keyValue) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

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

// 7. Admin - Delete key
app.delete('/api/admin/keys/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params;
        
        const { error } = await supabase
            .from('keys')
            .delete()
            .eq('id', keyId);
            
        if (error) throw error;
        res.json({ success: true, message: 'Key deleted successfully' });
    } catch (error) {
        console.error('Delete key error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete key' });
    }
});

// 8. Admin - Get stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Total keys
        const { count: totalKeys, error: totalError } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true });
            
        if (totalError) throw totalError;
        
        // Available keys
        const { count: availableKeys, error: availableError } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available');
            
        if (availableError) throw availableError;
        
        // Revenue from completed orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
            
        if (ordersError) throw ordersError;
        
        const revenue = orders ? orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0) : 0;
        
        res.json({
            success: true,
            stats: {
                totalKeys: totalKeys || 0,
                availableKeys: availableKeys || 0,
                soldKeys: (totalKeys || 0) - (availableKeys || 0),
                revenue: revenue
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// 9. Admin - Add new brand
app.post('/api/admin/brands', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'Brand name required' });
        }

        const { data, error } = await supabase
            .from('brands')
            .insert({
                name: name,
                description: description || 'No description provided',
                plans: []
            })
            .select();
            
        if (error) throw error;
        res.json({ success: true, brand: data[0] });
    } catch (error) {
        console.error('Add brand error:', error);
        res.status(500).json({ success: false, error: 'Failed to add brand' });
    }
});

// 10. Admin - Add plan to brand
app.post('/api/admin/brands/:brandId/plans', async (req, res) => {
    try {
        const { brandId } = req.params;
        const { name, price } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Plan name and price required' });
        }

        // Get current brand
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single();
            
        if (brandError) throw brandError;
        
        // Update plans array
        const updatedPlans = [...(brand.plans || []), { 
            name: name, 
            price: parseFloat(price) 
        }];
        
        const { error: updateError } = await supabase
            .from('brands')
            .update({ plans: updatedPlans })
            .eq('id', brandId);
            
        if (updateError) throw updateError;
        
        res.json({ success: true, message: 'Plan added successfully' });
    } catch (error) {
        console.error('Add plan error:', error);
        res.status(500).json({ success: false, error: 'Failed to add plan' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
