const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// Big Computer Settings
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple Health Check
app.get('/api/health', async (req, res) => {
    res.json({ success: true, message: 'I am awake! 😊' });
});

// Simple Create Order - SUPER EASY VERSION
app.post('/api/create-order', async (req, res) => {
    try {
        console.log('📦 Someone wants to buy something!', req.body);
        
        const { orderId, brandId, planName, amount } = req.body;
        
        // Just say YES to everything!
        res.json({ 
            success: true, 
            message: 'Order created! 🎉',
            orderId: orderId,
            test: 'This is working!'
        });
        
    } catch (error) {
        console.log('❌ Oops, error:', error);
        res.json({ 
            success: false, 
            error: 'Simple error: ' + error.message 
        });
    }
});

// Start the Big Computer
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Big Computer is awake on port ${PORT}`);
});
