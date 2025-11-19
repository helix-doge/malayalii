const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// UPI ID
const UPI_ID = "malayalihere@ybl";

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body || '');
    next();
});

// Helper function for consistent error responses
const handleError = (res, error, customMessage = 'Operation failed') => {
    console.error('❌ Error:', error);
    res.status(500).json({ 
        success: false, 
        error: customMessage,
        details: error.message 
    });
};

// Test database connection and table structure
const testDatabaseConnection = async () => {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test brands table
        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .select('*')
            .limit(1);
        
        if (brandsError) throw new Error(`Brands table error: ${brandsError.message}`);
        
        // Test keys table
        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .limit(1);
        
        if (keysError) throw new Error(`Keys table error: ${keysError.message}`);
        
        // Test orders table
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);
        
        if (ordersError) throw new Error(`Orders table error: ${ordersError.message}`);
        
        console.log('✅ All database tables are accessible');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
};

// 1. Health check with comprehensive database testing
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testDatabaseConnection();
        
        if (!dbConnected) {
            return res.status(500).json({
                success: false,
                message: 'API is running but database connection failed',
                database: 'Disconnected ❌',
                upiId: UPI_ID,
                timestamp: new Date().toISOString()
            });
        }

        // Get some stats
        const { count: brandsCount } = await supabase
            .from('brands')
            .select('*', { count: 'exact', head: true });

        const { count: keysCount } = await supabase
            .from('keys')
            .select('*', { count: 'exact', head: true });

        res.json({ 
            success: true, 
            message: '🚀 Malayali Store API is RUNNING!',
            database: 'Connected ✅',
            upiId: UPI_ID,
            stats: {
                brands: brandsCount || 0,
                keys: keysCount || 0
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '🚀 Malayali Store API is RUNNING!',
            database: 'Connection Error ❌',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 2. Initialize database with default data
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('🔄 Initializing database...');

        // Check if we already have data
        const { data: existingBrands, error: checkError } = await supabase
            .from('brands')
            .select('*');
            
        if (checkError) {
            console.error('❌ Error checking existing data:', checkError);
            throw checkError;
        }
        
        if (existingBrands && existingBrands.length > 0) {
            console.log('✅ Database already has data, skipping initialization');
            return res.json({ 
                success: true, 
                message: '✅ Database already initialized',
                brands: existingBrands 
            });
        }
        
        console.log('🔄 Setting up default data...');
        
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
        
        // Add sample keys
        const sampleKeys = [
            { brand_id: 1, plan: "1 Month", key_value: "VISION-1M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 1, plan: "1 Month", key_value: "VISION-1M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 1, plan: "3 Months", key_value: "VISION-3M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 1, plan: "1 Year", key_value: "VISION-1Y-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 2, plan: "1 Month", key_value: "BAT-1M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 2, plan: "1 Month", key_value: "BAT-1M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 2, plan: "3 Months", key_value: "BAT-3M-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" },
            { brand_id: 2, plan: "1 Year", key_value: "BAT-1Y-" + Math.random().toString(36).substr(2, 9).toUpperCase(), status: "available" }
        ];

        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .insert(sampleKeys)
            .select();
            
        if (keysError) {
            console.error('❌ Keys insert error:', keysError);
            // Continue even if keys fail
        } else {
            console.log('✅ Sample keys added');
        }
        
        res.json({ 
            success: true, 
            message: '🎉 Database initialized successfully!',
            brands: brands,
            keysAdded: keys ? keys.length : 0
        });
        
    } catch (error) {
        handleError(res, error, 'Failed to initialize database');
    }
});

// 3. Get all brands
app.get('/api/brands', async (req, res) => {
    try {
        console.log('📦 Fetching brands...');
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('❌ Brands fetch error:', error);
            return res.json({ success: true, brands: [] });
        }
        
        console.log(`✅ Found ${data?.length || 0} brands`);
        res.json({ success: true, brands: data || [] });
    } catch (error) {
        console.error('❌ Brands error:', error);
        res.json({ success: true, brands: [] });
    }
});

// 4. Check available keys count
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

// 5. Create order
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;
        
        console.log('🛒 Creating order:', { orderId, brandId, planName, amount });

        // Validate input
        if (!orderId || !brandId || !planName || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: orderId, brandId, planName, amount' 
            });
        }

        // Convert to proper types
        const brandIdInt = parseInt(brandId);
        const amountFloat = parseFloat(amount);

        if (isNaN(brandIdInt)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid brand ID format' 
            });
        }

        if (isNaN(amountFloat) || amountFloat <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid amount format' 
            });
        }

        // Check if brand exists
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandIdInt)
            .single();
            
        if (brandError || !brand) {
            return res.status(400).json({ 
                success: false, 
                error: 'Brand not found' 
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
            return res.status(500).json({ 
                success: false, 
                error: 'Error checking key availability' 
            });
        }
            
        if (!availableKeys || availableKeys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No keys available for this selection' 
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
            
            if (orderError.code === '23505') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Order ID already exists' 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create order in database',
                details: orderError.message 
            });
        }

        console.log(`✅ Order created successfully: ${orderId}`);
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order: order,
            upiId: UPI_ID
        });

    } catch (error) {
        handleError(res, error, 'Failed to create order');
    }
});

// 6. Verify payment
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
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false, 
                error: 'Order already completed' 
            });
        }

        // Check if amount matches
        const paidAmount = parseFloat(transactionAmount);
        const orderAmount = parseFloat(order.amount);
        
        if (paidAmount !== orderAmount) {
            return res.status(400).json({ 
                success: false, 
                error: `Transaction amount (₹${paidAmount}) does not match order amount (₹${orderAmount})` 
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
            return res.status(500).json({ 
                success: false, 
                error: 'Error finding available key' 
            });
        }
            
        if (!keys || keys.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No keys available for this order' 
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
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to assign key to order' 
            });
        }
        
        // Update order status
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                utr_number: utrNumber
            })
            .eq('order_id', orderId);
            
        if (orderUpdateError) {
            console.error('❌ Order update error:', orderUpdateError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update order status' 
            });
        }

        console.log(`✅ Payment verified successfully: ${orderId}`);
        
        res.json({ 
            success: true, 
            key: key.key_value,
            orderId: orderId,
            message: 'Payment verified successfully! Key delivered.'
        });
        
    } catch (error) {
        handleError(res, error, 'Payment verification failed');
    }
});

// ADMIN ENDPOINTS

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

// 8. Admin - Add new key
app.post('/api/admin/keys', async (req, res) => {
    try {
        const { brandId, plan, keyValue } = req.body;
        
        console.log('➕ Adding key:', { brandId, plan, keyValue });

        if (!brandId || !plan || !keyValue) {
            return res.status(400).json({ 
                success: false, 
                error: 'Brand ID, Plan, and Key Value are required' 
            });
        }

        // Check if brand exists
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('id')
            .eq('id', parseInt(brandId))
            .single();
            
        if (brandError || !brand) {
            return res.status(400).json({ 
                success: false, 
                error: 'Brand not found' 
            });
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
            
        if (error) {
            console.error('❌ Add key error:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Key already exists' 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to add key to database' 
            });
        }
        
        console.log('✅ Key added successfully');
        res.json({ 
            success: true, 
            key: data[0],
            message: 'Key added successfully'
        });
    } catch (error) {
        handleError(res, error, 'Failed to add key');
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
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to delete key' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Key deleted successfully' 
        });
    } catch (error) {
        handleError(res, error, 'Failed to delete key');
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
        
        // Total orders and revenue
        const { data: orders } = await supabase
            .from('orders')
            .select('amount, status');
        
        const completedOrders = orders ? orders.filter(order => order.status === 'completed') : [];
        const revenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        
        res.json({
            success: true,
            stats: {
                totalKeys: totalKeys || 0,
                availableKeys: availableKeys || 0,
                soldKeys: (totalKeys || 0) - (availableKeys || 0),
                totalOrders: orders ? orders.length : 0,
                completedOrders: completedOrders.length,
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
                totalOrders: 0,
                completedOrders: 0,
                revenue: 0
            }
        });
    }
});

// 11. Admin - Add new brand
app.post('/api/admin/brands', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        console.log('🏪 Adding brand:', { name, description });

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Brand name is required' 
            });
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
            
        if (error) {
            console.error('❌ Add brand error:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Brand name already exists' 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to add brand to database' 
            });
        }
        
        console.log('✅ Brand added successfully');
        res.json({ 
            success: true, 
            brand: data[0],
            message: 'Brand added successfully'
        });
    } catch (error) {
        handleError(res, error, 'Failed to add brand');
    }
});

// 12. Admin - Add plan to brand
app.post('/api/admin/brands/:brandId/plans', async (req, res) => {
    try {
        const { brandId } = req.params;
        const { name, price } = req.body;
        
        console.log('📅 Adding plan:', { brandId, name, price });

        if (!name || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Plan name and price are required' 
            });
        }

        // Get current brand
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', parseInt(brandId))
            .single();
            
        if (brandError || !brand) {
            return res.status(404).json({ 
                success: false, 
                error: 'Brand not found' 
            });
        }
        
        // Update plans array
        const updatedPlans = [...(brand.plans || []), { 
            name: name, 
            price: parseFloat(price) 
        }];
        
        const { error: updateError } = await supabase
            .from('brands')
            .update({ 
                plans: updatedPlans
            })
            .eq('id', parseInt(brandId));
            
        if (updateError) {
            console.error('❌ Add plan error:', updateError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to add plan to brand' 
            });
        }
        
        console.log('✅ Plan added successfully');
        res.json({ 
            success: true, 
            message: 'Plan added successfully',
            plans: updatedPlans
        });
    } catch (error) {
        handleError(res, error, 'Failed to add plan');
    }
});

// 13. Debug endpoint to check database structure
app.get('/api/debug/tables', async (req, res) => {
    try {
        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .select('*');
            
        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .select('*');
            
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*');
        
        res.json({
            success: true,
            tables: {
                brands: brandsError ? { error: brandsError.message } : { count: brands?.length || 0, sample: brands?.[0] },
                keys: keysError ? { error: keysError.message } : { count: keys?.length || 0, sample: keys?.[0] },
                orders: ordersError ? { error: ordersError.message } : { count: orders?.length || 0, sample: orders?.[0] }
            }
        });
    } catch (error) {
        handleError(res, error, 'Debug check failed');
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /api/health',
            'POST /api/init-db', 
            'GET /api/brands',
            'GET /api/keys/available/:brandId',
            'POST /api/create-order',
            'POST /api/verify-payment',
            'GET /api/admin/keys',
            'POST /api/admin/keys',
            'GET /api/admin/stats'
        ]
    });
});

const PORT = process.env.PORT || 3000;

// Test connection on startup
testDatabaseConnection().then(success => {
    if (success) {
        console.log('✅ Database connection established on startup');
    } else {
        console.log('⚠️ Database connection failed on startup, but server will continue');
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Malayali Store Backend running on port ${PORT}`);
    console.log(`📱 UPI ID: ${UPI_ID}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔄 Init DB: http://localhost:${PORT}/api/init-db`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/tables`);
    console.log(`\n⚠️ Make sure your Supabase environment variables are set correctly!`);
});
