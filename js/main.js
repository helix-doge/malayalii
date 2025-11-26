// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Razorpay Live Key - YOUR KEY
const RAZORPAY_KEY_ID = "rzp_live_Rk2oKtZtYbEN4A";

// Global variables
let currentBrand = null;
let currentPlan = null;
let currentPrice = 0;
let currentOrderId = null;

// DOM Elements
const elements = {
    brandSelect: document.getElementById('brand-select'),
    planSelect: document.getElementById('plan-select'),
    purchaseBtn: document.getElementById('purchase-btn'),
    paymentModal: document.getElementById('payment-modal'),
    keyModal: document.getElementById('key-modal'),
    availableKeysSpan: document.getElementById('available-keys')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Malayali Store with Razorpay...');
    initializeApp();
});

async function initializeApp() {
    try {
        await loadBrands();
        setupEventListeners();
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showNotification('SYSTEM_INITIALIZATION_FAILED', 'error');
    }
}

// Load brands from backend
async function loadBrands() {
    try {
        elements.brandSelect.innerHTML = '<option value="">>> CHOOSE_APPLICATION</option>';
        
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success && data.brands) {
            data.brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.name.toUpperCase();
                elements.brandSelect.appendChild(option);
            });
            console.log(`✅ Loaded ${data.brands.length} brands`);
        } else {
            throw new Error(data.error || 'Failed to load brands');
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        showNotification('NETWORK_ERROR: CANNOT_LOAD_APPLICATIONS', 'error');
        loadFallbackBrands();
    }
}

// Fallback brands data
function loadFallbackBrands() {
    const fallbackBrands = [
        { id: 1, name: "Vision", plans: [
            { name: "1 Month", price: 299 }, { name: "3 Months", price: 799 }, { name: "1 Year", price: 2599 }
        ]},
        { id: 2, name: "Bat", plans: [
            { name: "1 Month", price: 399 }, { name: "3 Months", price: 999 }, { name: "1 Year", price: 3299 }
        ]}
    ];
    
    fallbackBrands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name.toUpperCase();
        elements.brandSelect.appendChild(option);
    });
    console.log('⚠️ Using fallback brands data');
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Brand selection
    elements.brandSelect.addEventListener('change', handleBrandChange);
    
    // Plan selection
    elements.planSelect.addEventListener('change', handlePlanChange);
    
    // Purchase button - NOW USING RAZORPAY
    elements.purchaseBtn.addEventListener('click', handlePurchase);
    
    // Close modals
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('close-modal').addEventListener('click', closeAllModals);
    
    // Copy key button
    document.getElementById('copy-key').addEventListener('click', copyKey);
    
    console.log('✅ Event listeners setup complete');
}

// Event handlers
async function handleBrandChange() {
    const brandId = parseInt(this.value);
    if (brandId) {
        await loadBrandDetails(brandId);
    } else {
        currentBrand = null;
        loadPlans(null);
        updatePurchaseButton();
        updateAvailableKeys();
    }
}

function handlePlanChange() {
    if (this.value && currentBrand) {
        currentPlan = currentBrand.plans.find(plan => plan.name === this.value);
        currentPrice = currentPlan ? currentPlan.price : 0;
        updatePurchaseButton();
    }
}

// NEW: Handle purchase with Razorpay
async function handlePurchase() {
    if (currentBrand && currentPlan) {
        await initiateRazorpayPayment();
    } else {
        showNotification('PLEASE_SELECT_APPLICATION_AND_DURATION', 'error');
    }
}

// Load brand details
async function loadBrandDetails(brandId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const data = await response.json();
        
        if (data.success) {
            currentBrand = data.brands.find(brand => brand.id === brandId);
            if (currentBrand) {
                loadPlans(currentBrand);
                await updateAvailableKeys();
            }
        }
    } catch (error) {
        console.error('Error loading brand details:', error);
        showNotification('ERROR_LOADING_APPLICATION_DETAILS', 'error');
    }
}

// Load plans for selected brand
function loadPlans(brand) {
    elements.planSelect.innerHTML = '<option value="">>> SELECT_DURATION</option>';
    
    if (brand && brand.plans) {
        brand.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.name;
            option.textContent = `${plan.name} - ₹${plan.price}`;
            elements.planSelect.appendChild(option);
        });
        elements.planSelect.disabled = false;
    } else {
        elements.planSelect.disabled = true;
    }
    
    currentPlan = null;
    currentPrice = 0;
    updatePurchaseButton();
}

// Update purchase button state
function updatePurchaseButton() {
    if (currentBrand && currentPlan) {
        elements.purchaseBtn.disabled = false;
        elements.purchaseBtn.querySelector('.btn-text').innerHTML = 
            `<i class="fas fa-bolt"></i> PAY_NOW - ₹${currentPrice}`;
    } else {
        elements.purchaseBtn.disabled = true;
        elements.purchaseBtn.querySelector('.btn-text').innerHTML = 
            '<i class="fas fa-bolt"></i> PAY_NOW - ₹0';
    }
}

// Update available keys display
async function updateAvailableKeys() {
    if (!currentBrand) {
        elements.availableKeysSpan.textContent = 'SELECT_APPLICATION_TO_VIEW_KEYS';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/keys/available/${currentBrand.id}`);
        const data = await response.json();
        
        if (data.success) {
            elements.availableKeysSpan.textContent = `KEYS_AVAILABLE: ${data.count}`;
            elements.availableKeysSpan.style.color = data.count > 0 ? 'var(--terminal-green)' : 'var(--terminal-red)';
        }
    } catch (error) {
        console.error('Error updating available keys:', error);
        elements.availableKeysSpan.textContent = 'KEYS_AVAILABLE: CHECKING...';
        elements.availableKeysSpan.style.color = 'var(--terminal-yellow)';
    }
}

// NEW: Initiate Razorpay Payment
async function initiateRazorpayPayment() {
    try {
        showNotification('INITIATING_PAYMENT...', 'info');
        
        // Generate unique order ID
        currentOrderId = 'MAL' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        // 1. Create order in our database
        const orderResponse = await fetch(`${API_BASE_URL}/api/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: currentOrderId,
                brandId: parseInt(currentBrand.id),
                planName: currentPlan.name,
                amount: parseFloat(currentPrice)
            })
        });
        
        const orderData = await orderResponse.json();
        
        if (!orderResponse.ok || !orderData.success) {
            throw new Error(orderData.error || 'Failed to create order');
        }
        
        // 2. Create Razorpay order
        const razorpayResponse = await fetch(`${API_BASE_URL}/api/create-razorpay-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: currentOrderId,
                amount: currentPrice,
                brandName: currentBrand.name,
                planName: currentPlan.name
            })
        });
        
        const razorpayData = await razorpayResponse.json();
        
        if (!razorpayResponse.ok || !razorpayData.success) {
            throw new Error(razorpayData.error || 'Failed to create payment order');
        }
        
        // 3. Open Razorpay checkout
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: razorpayData.amount,
            currency: razorpayData.currency,
            name: "Malayali Key Store",
            description: `${currentBrand.name} - ${currentPlan.name}`,
            image: "https://your-logo-url.com/logo.png", // Add your logo
            order_id: razorpayData.order_id,
            handler: async function(response) {
                // Payment successful
                await handlePaymentSuccess(response);
            },
            prefill: {
                name: "Customer",
                email: "customer@example.com",
                contact: "9999999999"
            },
            notes: {
                order_id: currentOrderId,
                brand: currentBrand.name,
                plan: currentPlan.name
            },
            theme: {
                color: "#00ff00"
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        // Handle payment failure
        rzp.on('payment.failed', function(response) {
            console.error('❌ Payment failed:', response.error);
            showNotification('PAYMENT_FAILED: ' + (response.error.description || 'Unknown error'), 'error');
        });
        
    } catch (error) {
        console.error('❌ Payment initiation error:', error);
        showNotification('PAYMENT_INITIATION_FAILED: ' + error.message, 'error');
    }
}

// NEW: Handle successful payment
async function handlePaymentSuccess(response) {
    try {
        showNotification('VERIFYING_PAYMENT...', 'info');
        
        // Verify payment with backend
        const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-razorpay-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: currentOrderId
            })
        });
        
        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed');
        }
        
        // Show success and deliver key
        showKey(verifyData.key);
        showNotification('PAYMENT_SUCCESSFUL!', 'success');
        
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        showNotification('PAYMENT_VERIFICATION_FAILED: ' + error.message, 'error');
    }
}

// Show key to user
function showKey(key) {
    document.getElementById('generated-key').textContent = key;
    document.getElementById('verified-order-id').textContent = currentOrderId;
    document.getElementById('purchase-time').textContent = new Date().toLocaleString();
    
    // Show key modal
    elements.keyModal.style.display = 'block';
    
    // Update available keys count
    updateAvailableKeys();
    
    // Auto-copy key to clipboard
    setTimeout(() => {
        copyToClipboard(key);
        showNotification('KEY_AUTO_COPIED_TO_CLIPBOARD', 'success');
    }, 1000);
}

// Copy key function
function copyKey() {
    const keyText = document.getElementById('generated-key').textContent;
    if (keyText && keyText !== 'DECRYPTING_KEY...') {
        copyToClipboard(keyText);
        showNotification('KEY_COPIED_TO_CLIPBOARD', 'success');
    }
}

// Utility function to copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Close all modals
function closeAllModals() {
    elements.paymentModal.style.display = 'none';
    elements.keyModal.style.display = 'none';
    
    currentPrice = 0;
    currentOrderId = null;
    updateAvailableKeys();
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0,255,0,0.1)' : type === 'error' ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,255,0.1)'};
        border: 1px solid ${type === 'success' ? 'var(--terminal-green)' : type === 'error' ? 'var(--terminal-red)' : 'var(--terminal-cyan)'};
        color: var(--terminal-text);
        padding: 15px 20px;
        font-family: 'Share Tech Mono', monospace;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Make functions globally available
window.closeAllModals = closeAllModals;
window.showNotification = showNotification;

console.log('🎉 Malayali Store with Razorpay LIVE loaded successfully');
