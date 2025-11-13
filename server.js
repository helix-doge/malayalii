const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// Cashfree credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production' 
    ? "https://api.cashfree.com" 
    : "https://sandbox.cashfree.com";

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

// 3. Create Cashfree order
app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, amount, brandName, planName, customerEmail } = req.body;
        
        // First, check if keys are available
        const brandResponse = await supabase
            .from('brands')
            .select('id')
            .eq('name', brandName)
            .single();
            
        if (brandResponse.error) throw brandResponse.error;
        
        const { data: availableKeys } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brandResponse.data.id)
            .eq('plan', planName)
            .eq('status', 'available')
            .limit(1);
            
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
                brand_name: brandName,
                plan_name: planName,
                amount: amount,
                customer_email: customerEmail,
                status: 'pending'
            });
            
        if (orderError) throw orderError;

        // Create Cashfree order
        const orderData = {
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: customerEmail || 'customer@malayali.store',
                customer_name: "Customer",
                customer_email: customerEmail || 'customer@malayali.store',
                customer_phone: "9999999999"
            },
            order_note: `${brandName} - ${planName}`
        };

        const cashfreeResponse = await axios.post(
            `${CASHFREE_BASE_URL}/pg/orders`,
            orderData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY,
                    'x-api-version': '2022-09-01'
                }
            }
        );

        // Store temporarily as backup
        tempOrders.set(orderId, {
            brandName,
            planName,
            amount,
            customerEmail,
            status: 'PENDING'
        });

        res.json({ 
            success: true, 
            payment_link: cashfreeResponse.data.payment_link 
        });

    } catch (error) {
        console.error('Order creation error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// 4. Check payment status
app.post('/api/check-payment', async (req, res) => {
    try {
        const { orderId } = req.body;

        // Check with Cashfree
        const cashfreeResponse = await axios.get(
            `${CASHFREE_BASE_URL}/pg/orders/${orderId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY,
                    'x-api-version': '2022-09-01'
                }
            }
        );

        const paymentStatus = cashfreeResponse.data.order_status;
        
        // Update database if paid
        if (paymentStatus === 'PAID') {
            await updateOrderStatus(orderId, 'paid', cashfreeResponse.data);
        }

        res.json({ success: true, status: paymentStatus });

    } catch (error) {
        console.error('Payment check error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to check payment' });
    }
});

// 5. Webhook for payment confirmation
app.post('/api/webhook', async (req, res) => {
    try {
        const { data } = req.body;
        const orderId = data.order.order_id;
        const paymentStatus = data.order.order_status;
        
        if (paymentStatus === 'PAID') {
            await updateOrderStatus(orderId, 'paid', data);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ received: false });
    }
});

// 6. Get key after successful payment
app.post('/api/get-key', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
            
        if (orderError) throw orderError;
        
        if (order.status !== 'paid') {
            return res.status(400).json({ 
                success: false, 
                error: 'PAYMENT_NOT_VERIFIED' 
            });
        }
        
        // Get brand ID
        const { data: brand } = await supabase
            .from('brands')
            .select('id')
            .eq('name', order.brand_name)
            .single();
            
        // Find available key
        const { data: keys } = await supabase
            .from('keys')
            .select('*')
            .eq('brand_id', brand.id)
            .eq('plan', order.plan_name)
            .eq('status', 'available')
            .limit(1);
            
        if (keys.length === 0) {
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
        
        res.json({ 
            success: true, 
            key: key.key_value,
            order: order
        });
        
    } catch (error) {
        console.error('Get key error:', error);
        res.status(500).json({ success: false, error: 'Failed to get key' });
    }
});

// Helper function to update order status
async function updateOrderStatus(orderId, status, paymentData) {
    try {
        const updateData = {
            status: status,
            cashfree_payment_id: paymentData.payment_id || null
        };
        
        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('order_id', orderId);
            
        if (error) throw error;
        
        // Also update temp storage
        if (tempOrders.has(orderId)) {
            tempOrders.get(orderId).status = status;
        }
        
    } catch (error) {
        console.error('Update order error:', error);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
