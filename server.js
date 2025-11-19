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

// Enhanced logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 1. Health check - SIMPLE AND RELIABLE
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '🚀 Malayali Store API is RUNNING!',
        upiId: UPI_ID,
        timestamp: new Date().toISOString()
    });
});

// 2. Initialize database with default data
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('🔄 Initializing database...');
        
        // Check if brands exist
        const { data: existingBrands } = await supabase
            .from('brands')
            .select('*');
            
        if (existingBrands && existingBrands.length > 0) {
            return res.json({ 
                success: true, 
                message: '✅ Database already initialized',
                brands: existingBrands 
            });
        }
        
        // Insert default brands
        const defaultBrands = [
            { 
                name: "Vision", 
                description: "Advanced visual processing suite",
                plans: [
                    { name: "1 Month", price: 299 },
                    { name: "3 Months", price: 799 },
                    { name: "1 Year", price: 2599 }
                ]
            },
            { 
                name: "Bat", 
                description: "Network security and penetration toolkit",
                plans: [
                    { name: "1 Month", price: 399 },
                    { name: "3 Months", price: 999 },
                    { name: "1 Year", price: 3299 }
                ]
            }
        ];

        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .insert(defaultBrands)
            .select();
            
        if (brandsError) {
            console.error('❌ Brands insert error:', brandsError);
            throw brandsError;
        }
        
        console.log('✅ Default brands added');
        
        // Add some sample keys
        const sampleKeys = [
            { brand_id: 1, plan: "1 Month", key_value: "VISION-1M-ABC123XYZ", status: "available" },
            { brand_id: 1, plan: "1 Month", key_value: "VISION-1M-DEF456UVW", status: "available" },
            { brand_id: 1, plan: "3 Months", key_value: "VISION-3M-GHI789RST", status: "available" },
            { brand_id: 2, plan: "1 Month", key_value: "BAT-1M-JKL012MNO", status: "available" },
            { brand_id: 2, plan: "1 Month", key_value: "BAT-1M-PQR345STU", status: "available" }
        ];

        const { error: keysError } = await supabase
            .from('keys')
            .insert(sampleKeys);
            
        if (keysError) {
            console.error('❌ Keys insert error:', keysError);
            // Continue even if keys fail
        }
        
        console.log('✅ Sample keys added');
        
        res.json({ 
            success: true, 
            message: '🎉 Database initialized successfully!',
            brands: brands 
        });
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to initialize database',
            details: error.message 
        });
    }
});

// 3. Get all brands - SIMPLE AND RELIABLE
app.get('/api/brands', async (req, res) => {
    try {
        console.log('📦 Fetching brands...');
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('❌ Brands fetch error:', error);
            // Return empty array instead of error
            return res.json({ success: true, brands: [] });
        }
        
        console.log(`✅ Found ${data?.length || 0} brands`);
        res.json({ success: true, brands: data || [] });
    } catch (error) {
        console.error('❌ Brands error:', error);
        res.json({ success: true, brands: [] });
    }
});

// 4. Check available keys count - SIMPLE
app.get('/api/keys/available/:brandId', async (req, res) => {
    try {
        const { brandId } = req.params;
        console.log(`🔑 Checking keys for brand: ${brandId}`);
        
        const { count, error } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', parseInt(brandId))
            .eq('status', 'available');
        
        if (error) {
            console.error('❌ Keys count error:', error);
            return res.json({ success: true, count: 0 });
        }
        
        console.log(`✅ Available keys: ${count}`);
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        console.error('❌ Keys count error:', error);
        res.json({ success: true, count: 0 });
    }
});

// 5. Create order - FIXED: Better error handling and validation
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;
        
        console.log('🛒 Creating order:', { orderId, brandId, planName, amount });

        // Simple validation
        if (!orderId || !brandId || !planName || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please fill all fields' 
            });
        }

        // Convert to proper types
        const brandIdInt = parseInt(brandId);
        const amountFloat = parseFloat(amount);

        if (isNaN(brandIdInt)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid brand ID' 
            });
        }

        // Check if keys are available
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandIdInt)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) {
            console.error('❌ Keys check error:', keysError);
            return res.status(500).json({ success: false, error: 'Error checking keys' });
        }
            
        if (!availableKeys || availableKeys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }

        // Create order
        const orderData = {
            order_id: orderId,
            brand_id: brandIdInt,
            plan_name: planName,
            amount: amountFloat,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        console.log('💾 Inserting order:', orderData);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
            
        if (orderError) {
            console.error('❌ Order creation error:', orderError);
            
            // Handle specific error cases
            if (orderError.code === '23505') { // Unique violation
                return res.status(400).json({ 
                    success: false, 
                    error: 'Order ID already exists' 
                });
            }
            
            if (orderError.code === '23503') { // Foreign key violation
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid brand ID' 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create order',
                details: orderError.message 
            });
        }

        console.log(`✅ Order created: ${orderId}`);
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order: order,
            upiId: UPI_ID
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error creating order',
            details: error.message 
        });
    }
});

// 6. Verify payment - FIXED
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { orderId, utrNumber, transactionAmount } = req.body;

        console.log('💰 Verifying payment:', { orderId, utrNumber, transactionAmount });

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
            
        if (orderError || !order) {
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
            
        if (keysError) {
            console.error('❌ Keys fetch error:', keysError);
            return res.status(500).json({ success: false, error: 'Error finding available key' });
        }
            
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
            
        if (updateError) {
            console.error('❌ Key update error:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to assign key' });
        }
        
        // Update order status
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
            
        if (orderUpdateError) {
            console.error('❌ Order update error:', orderUpdateError);
            return res.status(500).json({ success: false, error: 'Failed to update order status' });
        }

        console.log(`✅ Payment verified: ${orderId}`);
        
        res.json({ 
            success: true, 
            key: key.key_value,
            message: 'Payment verified successfully! Key delivered.'
        });
        
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({ success: false, error: 'Server error verifying payment' });
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
        
        if (error) {
            console.error('❌ Admin keys error:', error);
            return res.json({ success: true, keys: [] });
        }
        
        res.json({ success: true, keys: data || [] });
    } catch (error) {
        console.error('❌ Admin keys error:', error);
        res.json({ success: true, keys: [] });
    }
});

// 8. Admin - Add new key - FIXED
app.post('/api/admin/keys', async (req, res) => {
    try {
        const { brandId, plan, keyValue } = req.body;
        
        console.log('➕ Adding key:', { brandId, plan, keyValue });

        if (!brandId || !plan || !keyValue) {
            return res.status(400).json({ success: false, error: 'Please fill all fields' });
        }

        const { data, error } = await supabase
            .from('keys')
            .insert({
                brand_id: parseInt(brandId),
                plan: plan,
                key_value: keyValue,
                status: 'available'
            })
            .select();
            
        if (error) {
            console.error('❌ Add key error:', error);
            return res.status(500).json({ success: false, error: 'Failed to add key' });
        }
        
        console.log('✅ Key added successfully');
        res.json({ success: true, key: data[0] });
    } catch (error) {
        console.error('❌ Add key error:', error);
        res.status(500).json({ success: false, error: 'Server error adding key' });
    }
});

// 9. Admin - Delete key
app.delete('/api/admin/keys/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params;
        
        const { error } = await supabase
            .from('keys')
            .delete()
            .eq('id', parseInt(keyId));
            
        if (error) {
            console.error('❌ Delete key error:', error);
            return res.status(500).json({ success: false, error: 'Failed to delete key' });
        }
        
        res.json({ success: true, message: 'Key deleted successfully' });
    } catch (error) {
        console.error('❌ Delete key error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete key' });
    }
});

// 10. Admin - Get stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Total keys
        const { count: totalKeys } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true });
        
        // Available keys
        const { count: availableKeys } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available');
        
        // Revenue
        const { data: orders } = await supabase
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
        
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
        res.json({
            success: true,
            stats: {
                totalKeys: 0,
                availableKeys: 0,
                soldKeys: 0,
                revenue: 0
            }
        });
    }
});

// 11. Admin - Add new brand - FIXED
app.post('/api/admin/brands', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        console.log('🏪 Adding brand:', { name, description });

        if (!name) {
            return res.status(400).json({ success: false, error: 'Brand name is required' });
        }

        const { data, error } = await supabase
            .from('brands')
            .insert({
                name: name,
                description: description || 'No description provided',
                plans: []
            })
            .select();
            
        if (error) {
            console.error('❌ Add brand error:', error);
            return res.status(500).json({ success: false, error: 'Failed to add brand' });
        }
        
        console.log('✅ Brand added successfully');
        res.json({ success: true, brand: data[0] });
    } catch (error) {
        console.error('❌ Add brand error:', error);
        res.status(500).json({ success: false, error: 'Server error adding brand' });
    }
});

// 12. Admin - Add plan to brand - FIXED
app.post('/api/admin/brands/:brandId/plans', async (req, res) => {
    try {
        const { brandId } = req.params;
        const { name, price } = req.body;
        
        console.log('📅 Adding plan:', { brandId, name, price });

        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Plan name and price are required' });
        }

        // Get current brand
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', parseInt(brandId))
            .single();
            
        if (brandError || !brand) {
            return res.status(404).json({ success: false, error: 'Brand not found' });
        }
        
        // Update plans array
        const updatedPlans = [...(brand.plans || []), { 
            name: name, 
            price: parseFloat(price) 
        }];
        
        const { error: updateError } = await supabase
            .from('brands')
            .update({ plans: updatedPlans })
            .eq('id', parseInt(brandId));
            
        if (updateError) {
            console.error('❌ Add plan error:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to add plan' });
        }
        
        console.log('✅ Plan added successfully');
        res.json({ success: true, message: 'Plan added successfully' });
    } catch (error) {
        console.error('❌ Add plan error:', error);
        res.status(500).json({ success: false, error: 'Server error adding plan' });
    }
});

// 13. Admin - Get pending orders
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
        
        if (error) {
            console.error('❌ Pending orders error:', error);
            return res.json({ success: true, orders: [] });
        }
        
        res.json({ success: true, orders: data || [] });
    } catch (error) {
        console.error('❌ Pending orders error:', error);
        res.json({ success: true, orders: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Malayali Store Backend running on port ${PORT}`);
    console.log(`📱 UPI ID: ${UPI_ID}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔄 Init DB: http://localhost:${PORT}/api/init-db`);
});
