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

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
    next();
});

// Test database connection
app.get('/api/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('brands').select('id').limit(1);
        if (error) {
            console.error('Health check - Database error:', error);
            throw error;
        }
        res.json({ 
            success: true, 
            message: 'Database connected', 
            timestamp: new Date().toISOString(),
            brandsCount: data?.length || 0
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed',
            details: error.message 
        });
    }
});

// 1. Get all brands
app.get('/api/brands', async (req, res) => {
    try {
        console.log('Fetching brands...');
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('Brands fetch error:', error);
            throw error;
        }
        
        console.log(`Found ${data?.length || 0} brands`);
        res.json({ success: true, brands: data || [] });
    } catch (error) {
        console.error('Brands error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch brands',
            details: error.message 
        });
    }
});

// 2. Check available keys count
app.get('/api/keys/available/:brandId', async (req, res) => {
    try {
        const { brandId } = req.params;
        console.log(`Checking available keys for brand: ${brandId}`);
        
        // Convert to integer and validate
        const brandIdInt = parseInt(brandId);
        if (isNaN(brandIdInt)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid brand ID' 
            });
        }

        const { count, error } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', brandIdInt)
            .eq('status', 'available');
        
        if (error) {
            console.error('Keys count error:', error);
            throw error;
        }
        
        console.log(`Available keys for brand ${brandId}: ${count}`);
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        console.error('Keys count error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check keys',
            details: error.message 
        });
    }
});

// 3. Create order - FIXED VERSION
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;
        
        console.log('Creating order with data:', { orderId, brandId, planName, amount });

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
        console.log(`Checking keys for brand ${brandIdInt}, plan ${planName}`);
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandIdInt)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
        if (keysError) {
            console.error('Keys check error:', keysError);
            throw keysError;
        }
            
        if (!availableKeys || availableKeys.length === 0) {
            console.log(`No keys available for brand ${brandIdInt}, plan ${planName}`);
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }

        console.log(`Keys available, creating order: ${orderId}`);

        // Create order with explicit data types
        const orderData = {
            order_id: orderId,
            brand_id: brandIdInt,
            plan_name: planName,
            amount: amountFloat,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        console.log('Order data to insert:', orderData);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
            
        if (orderError) {
            console.error('Order creation error:', orderError);
            
            // Check if it's a duplicate order ID error
            if (orderError.code === '23505') { // Unique violation
                return res.status(400).json({ 
                    success: false, 
                    error: 'Order ID already exists' 
                });
            }
            
            throw orderError;
        }

        console.log(`Order created successfully: ${orderId}`);
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        console.error('Order creation error:', error);
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

        console.log(`Processing payment for order: ${orderId}`);

        if (!orderId) {
            return res.status(400).json({ success: false, error: 'Order ID required' });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
        if (orderError) {
            console.error('Order fetch error:', orderError);
            throw orderError;
        }
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        console.log(`Found order:`, order);

        // Check if order is already completed
        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false, 
                error: 'Order already processed' 
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
            console.error('Keys fetch error:', keysError);
            throw keysError;
        }
            
        if (!keys || keys.length === 0) {
            console.log(`No keys available for brand ${order.brand_id}, plan ${order.plan_name}`);
            return res.status(400).json({ 
                success: false, 
                error: 'NO_KEYS_AVAILABLE' 
            });
        }
        
        // Assign key to order
        const key = keys[0];
        console.log(`Assigning key: ${key.key_value} to order: ${orderId}`);
        
        const { error: updateError } = await supabase
            .from('keys')
            .update({
                status: 'sold',
                order_id: orderId,
                sold_at: new Date().toISOString()
            })
            .eq('id', key.id);
            
        if (updateError) {
            console.error('Key update error:', updateError);
            throw updateError;
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
            console.error('Order update error:', orderUpdateError);
            throw orderUpdateError;
        }

        console.log(`Payment processed successfully for order: ${orderId}`);
        
        res.json({ 
            success: true, 
            key: key.key_value,
            order: {
                ...order,
                status: 'completed',
                completed_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process payment',
            details: error.message 
        });
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
            .eq('id', parseInt(keyId));
            
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
                plans: [],
                created_at: new Date().toISOString()
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
            .eq('id', parseInt(brandId))
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
            .eq('id', parseInt(brandId));
            
        if (updateError) throw updateError;
        
        res.json({ success: true, message: 'Plan added successfully' });
    } catch (error) {
        console.error('Add plan error:', error);
        res.status(500).json({ success: false, error: 'Failed to add plan' });
    }
});

// Database initialization endpoint (run this once)
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('Initializing database...');
        
        // Check if brands exist
        const { data: existingBrands } = await supabase
            .from('brands')
            .select('*');
            
        if (existingBrands && existingBrands.length > 0) {
            return res.json({ 
                success: true, 
                message: 'Database already initialized',
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
                ],
                created_at: new Date().toISOString()
            },
            { 
                name: "Bat", 
                description: "Network security and penetration toolkit",
                plans: [
                    { name: "1 Month", price: 399 },
                    { name: "3 Months", price: 999 },
                    { name: "1 Year", price: 3299 }
                ],
                created_at: new Date().toISOString()
            }
        ];

        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .insert(defaultBrands)
            .select();
            
        if (brandsError) throw brandsError;
        
        console.log('Database initialized successfully');
        res.json({ 
            success: true, 
            message: 'Database initialized successfully',
            brands: brands 
        });
        
    } catch (error) {
        console.error('Database initialization error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to initialize database',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🛠️  Database init: http://localhost:${PORT}/api/init-db`);
});
