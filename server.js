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

// UPI ID
const UPI_ID = "malayalihere@ybl";

// Health check
app.get('/api/health', async (req, res) => {
    res.json({ 
        success: true, 
        message: 'Malayali Store API is running',
        upiId: UPI_ID,
        timestamp: new Date().toISOString()
    });
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
            .eq('brand_id', parseInt(brandId))
            .eq('status', 'available');
        
        if (error) throw error;
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to check keys' });
    }
});

// 3. Create order with UPI details
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
            .eq('brand_id', parseInt(brandId))
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
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_id: orderId,
                brand_id: parseInt(brandId),
                plan_name: planName,
                amount: parseFloat(amount),
                status: 'pending',
                upi_id: UPI_ID,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (orderError) throw orderError;

        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order: order,
            upiId: UPI_ID
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// 4. Verify payment with UTR number
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { orderId, utrNumber, transactionAmount } = req.body;

        if (!orderId || !utrNumber || !transactionAmount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Order ID, UTR Number, and Amount are required' 
            });
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

        // Check if amount matches
        if (parseFloat(transactionAmount) !== parseFloat(order.amount)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Transaction amount does not match order amount' 
            });
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
        
        // Update order status with UTR
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                utr_number: utrNumber,
                completed_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
            
        if (orderUpdateError) throw orderUpdateError;

        res.json({ 
            success: true, 
            key: key.key_value,
            order: {
                ...order,
                status: 'completed',
                utr_number: utrNumber
            },
            message: 'Payment verified successfully! Key delivered.'
        });
        
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment' });
    }
});

// 5. Admin - Get pending orders for manual verification
app.get('/api/admin/pending-orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                brands (name)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json({ success: true, orders: data || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch pending orders' });
    }
});

// 6. Admin - Manually verify payment
app.post('/api/admin/verify-order', async (req, res) => {
    try {
        const { orderId, utrNumber } = req.body;

        if (!orderId || !utrNumber) {
            return res.status(400).json({ 
                success: false, 
                error: 'Order ID and UTR Number are required' 
            });
        }

        // Get order
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
        
        // Assign key
        const key = keys[0];
        await supabase
            .from('keys')
            .update({
                status: 'sold',
                order_id: orderId,
                sold_at: new Date().toISOString()
            })
            .eq('id', key.id);
        
        // Update order
        await supabase
            .from('orders')
            .update({
                status: 'completed',
                utr_number: utrNumber,
                completed_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        res.json({ 
            success: true, 
            key: key.key_value,
            message: 'Order verified manually'
        });
        
    } catch (error) {
        console.error('Manual verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify order' });
    }
});

// 7. Admin - Get all keys
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
        res.status(500).json({ success: false, error: 'Failed to fetch keys' });
    }
});

// 8. Admin - Add new key
app.post('/api/admin/keys', async (req, res) => {
    try {
        const { brandId, plan, keyValue } = req.body;
        
        if (!brandId || !plan || !keyValue) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('keys')
            .insert({
                brand_id: parseInt(brandId),
                plan: plan,
                key_value: keyValue,
                status: 'available',
                created_at: new Date().toISOString()
            })
            .select();
            
        if (error) throw error;
        res.json({ success: true, key: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add key' });
    }
});

// 9. Admin - Get stats
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
        
        // Revenue
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
            
        if (ordersError) throw ordersError;
        
        const revenue = orders ? orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0) : 0;
        
        // Pending orders
        const { count: pendingOrders, error: pendingError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
            
        if (pendingError) throw pendingError;
        
        res.json({
            success: true,
            stats: {
                totalKeys: totalKeys || 0,
                availableKeys: availableKeys || 0,
                soldKeys: (totalKeys || 0) - (availableKeys || 0),
                revenue: revenue,
                pendingOrders: pendingOrders || 0
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Malayali Store Backend running on port ${PORT}`);
    console.log(`📱 UPI ID: ${UPI_ID}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});
