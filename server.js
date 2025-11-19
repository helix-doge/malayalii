const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 🎉 SIMPLE HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '🎉 Big Computer is AWAKE and HAPPY!',
        timestamp: new Date().toISOString()
    });
});

// 🗝️ SIMPLE ADD KEY - ALWAYS WORKS!
app.post('/api/admin/keys', (req, res) => {
    console.log('🔑 Someone wants to add a key!', req.body);
    
    // Just say YES to everything!
    res.json({ 
        success: true, 
        message: '✅ Key added successfully!',
        key: {
            id: Math.random().toString(36).substr(2, 9),
            key_value: req.body.keyValue || 'TEST-KEY-123',
            brand_id: req.body.brandId || 1,
            plan: req.body.plan || '1 Month',
            status: 'available'
        }
    });
});

// 📦 SIMPLE CREATE ORDER - ALWAYS WORKS!
app.post('/api/create-order', (req, res) => {
    console.log('📦 Someone wants to buy!', req.body);
    
    res.json({ 
        success: true, 
        message: '🎉 Order created successfully!',
        order: {
            order_id: req.body.orderId || 'TEST-ORDER-123',
            brand_id: req.body.brandId || 1,
            plan_name: req.body.planName || '1 Month',
            amount: req.body.amount || 299
        }
    });
});

// 🔑 SIMPLE GET KEYS
app.get('/api/admin/keys', (req, res) => {
    res.json({
        success: true,
        keys: [
            {
                id: 1,
                key_value: 'VISION-1M-TEST123',
                brand_id: 1,
                plan: '1 Month',
                status: 'available',
                brands: { name: 'Vision' }
            },
            {
                id: 2, 
                key_value: 'BAT-1M-TEST456',
                brand_id: 2,
                plan: '1 Month', 
                status: 'available',
                brands: { name: 'Bat' }
            }
        ]
    });
});

// 📊 SIMPLE STATS
app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalKeys: 10,
            availableKeys: 8,
            soldKeys: 2,
            revenue: 1598
        }
    });
});

// 🏪 SIMPLE BRANDS
app.get('/api/brands', (req, res) => {
    res.json({
        success: true,
        brands: [
            {
                id: 1,
                name: "Vision",
                description: "Advanced visual processing suite",
                plans: [
                    { name: "1 Month", price: 299 },
                    { name: "3 Months", price: 799 },
                    { name: "1 Year", price: 2599 }
                ]
            },
            {
                id: 2,
                name: "Bat", 
                description: "Network security and penetration toolkit",
                plans: [
                    { name: "1 Month", price: 399 },
                    { name: "3 Months", price: 999 },
                    { name: "1 Year", price: 3299 }
                ]
            }
        ]
    });
});

// 🔍 SIMPLE CHECK KEYS
app.get('/api/keys/available/:brandId', (req, res) => {
    res.json({
        success: true,
        count: 5
    });
});

// 🚀 Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎉 SUPER SIMPLE Store Backend running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
