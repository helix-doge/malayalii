const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Razorpay Live Configuration - YOUR KEYS
const RAZORPAY_KEY_ID = "rzp_live_Rk2oKtZtYbEN4A";
const RAZORPAY_KEY_SECRET = "ZCUBZBgFd1KWB4lzC0ckYKUw";
const UPI_ID = "malayalihere@ybl";

// 1. Create Razorpay Order
app.post('/api/create-razorpay-order', async (req, res) => {
    try {
        const { orderId, amount, brandName, planName } = req.body;

        console.log('💳 Creating Razorpay order:', { orderId, amount, brandName });

        // Convert amount to paise (Razorpay requirement)
        const amountInPaise = Math.round(amount * 100);

        const orderData = {
            amount: amountInPaise,
            currency: "INR",
            receipt: orderId,
            notes: {
                order_id: orderId,
                brand_name: brandName,
                plan_name: planName
            },
            payment_capture: 1 // Auto capture payment
        };

        // Create order in Razorpay
        const authString = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const razorpayOrder = await response.json();

        if (razorpayOrder.error) {
            throw new Error(razorpayOrder.error.description);
        }

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        res.json({
            success: true,
            order_id: razorpayOrder.id,
            amount: amountInPaise,
            currency: razorpayOrder.currency,
            key_id: RAZORPAY_KEY_ID,
            orderId: orderId
        });

    } catch (error) {
        console.error('❌ Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment order: ' + error.message
        });
    }
});

// 2. Verify Razorpay Payment
app.post('/api/verify-razorpay-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        console.log('🔍 Verifying Razorpay payment:', { 
            razorpay_order_id, 
            razorpay_payment_id, 
            orderId 
        });

        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Payment verification failed: Invalid signature'
            });
        }

        // Get payment details from Razorpay
        const authString = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json'
            }
        });

        const paymentDetails = await paymentResponse.json();

        if (paymentDetails.status !== 'captured') {
            return res.status(400).json({
                success: false,
                error: 'Payment not captured: ' + paymentDetails.status
            });
        }

        // Get order details from our database
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

        // Find available key
        const { data: keys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', order.brand_id)
            .eq('plan', order.plan_name)
            .eq('status', 'available')
            .limit(1);

        if (keysError || !keys || keys.length === 0) {
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
            return res.status(500).json({
                success: false,
                error: 'Failed to assign key to order'
            });
        }

        // Update order status
        await supabase
            .from('orders')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                payment_method: paymentDetails.method,
                verified_via: 'razorpay'
            })
            .eq('order_id', orderId);

        console.log('✅ Payment verified and key delivered:', orderId);

        res.json({
            success: true,
            key: key.key_value,
            orderId: orderId,
            paymentId: razorpay_payment_id,
            message: 'Payment successful! Key delivered.'
        });

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment verification failed: ' + error.message
        });
    }
});

// 3. Create Order in Our Database
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, brandId, planName, amount } = req.body;

        console.log('🛒 Creating order:', { orderId, brandId, planName, amount });

        // Validate input
        if (!orderId || !brandId || !planName || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if keys are available
        const { data: availableKeys, error: keysError } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', parseInt(brandId))
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);

        if (keysError || !availableKeys || availableKeys.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No keys available for this selection'
            });
        }

        // Create order in our database
        const orderData = {
            order_id: orderId,
            brand_id: parseInt(brandId),
            plan_name: planName,
            amount: parseFloat(amount),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            console.error('❌ Order creation error:', orderError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create order: ' + orderError.message
            });
        }

        console.log('✅ Order created successfully:', orderId);

        res.json({
            success: true,
            order: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order: ' + error.message
        });
    }
});

// 4. Health Check
app.get('/api/health', async (req, res) => {
    try {
        const { data: brands } = await supabase.from('brands').select('*').limit(1);
        
        res.json({
            success: true,
            message: '🚀 Malayali Store - Razorpay Live System',
            services: {
                razorpay: true,
                database: !!brands,
                upi: UPI_ID
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'API running with issues',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Malayali Store with Razorpay LIVE Integration`);
    console.log(`💳 Razorpay Key: ${RAZORPAY_KEY_ID}`);
    console.log(`📱 UPI ID: ${UPI_ID}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n✅ RAZORPAY LIVE MODE - READY FOR REAL PAYMENTS`);
});
