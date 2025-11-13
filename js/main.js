// UPI ID for GPay payments (Replace with your UPI ID)
const upiId = "Malayalihere@ybl"; // CHANGE THIS TO YOUR UPI ID

// Webhook.site URL for payment verification (Replace with your webhook URL)
const WEBHOOK_URL = "https://webhook.site/0770dd6b-4bc2-481e-848a-1c775e20daa6"; // CHANGE THIS

// Sample data - Your apps
let brandsData = [
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
];

// Keys data
let keysData = [];

// Current selection
let currentBrand = null;
let currentPlan = null;
let currentPrice = 0;
let paymentInterval = null;
let currentOrderId = null;

// DOM Elements
const brandSelect = document.getElementById('brand-select');
const planSelect = document.getElementById('plan-select');
const customCodeInput = document.getElementById('custom-code');
const purchaseBtn = document.getElementById('purchase-btn');
const paymentModal = document.getElementById('payment-modal');
const keyModal = document.getElementById('key-modal');
const closeButtons = document.querySelectorAll('.close');
const cancelPaymentBtn = document.getElementById('cancel-payment');
const closeModalBtn = document.getElementById('close-modal');
const copyKeyBtn = document.getElementById('copy-key');
const copyUpiBtn = document.getElementById('copy-upi');
const availableKeysSpan = document.getElementById('available-keys');
const statusMessage = document.getElementById('status-message');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadBrands();
    setupEventListeners();
    loadDataFromLocalStorage();
    updateAvailableKeys();
});

// Load brands to dropdown
function loadBrands() {
    brandSelect.innerHTML = '<option value="">>> CHOOSE_APPLICATION</option>';
    
    brandsData.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name.toUpperCase();
        brandSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Brand selection
    brandSelect.addEventListener('change', function() {
        const brandId = parseInt(this.value);
        currentBrand = brandsData.find(brand => brand.id === brandId);
        loadPlans(currentBrand);
        updatePurchaseButton();
        updateAvailableKeys();
    });
    
    // Plan selection
    planSelect.addEventListener('change', function() {
        if (this.value && currentBrand) {
            currentPlan = currentBrand.plans.find(plan => plan.name === this.value);
            currentPrice = currentPlan ? currentPlan.price : 0;
            updatePurchaseButton();
        }
    });
    
    // Purchase button
    purchaseBtn.addEventListener('click', function() {
        if (currentBrand && currentPlan) {
            // Check if keys are available
            const availableKeys = keysData.filter(key => 
                key.brandId === currentBrand.id && 
                key.plan === currentPlan.name && 
                key.status === 'available'
            );
            
            if (availableKeys.length > 0) {
                openPaymentModal();
            } else {
                showNotification('NO_KEYS_AVAILABLE_FOR_THIS_SELECTION', 'error');
            }
        }
    });
    
    // Cancel payment
    cancelPaymentBtn.addEventListener('click', function() {
        closeAllModals();
    });
    
    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    closeModalBtn.addEventListener('click', closeAllModals);
    
    // Copy key
    copyKeyBtn.addEventListener('click', function() {
        const keyElement = document.getElementById('generated-key');
        const keyText = keyElement.textContent;
        
        navigator.clipboard.writeText(keyText).then(() => {
            showNotification('KEY_COPIED_TO_CLIPBOARD', 'success');
        });
    });
    
    // Copy UPI
    copyUpiBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(upiId).then(() => {
            showNotification('UPI_ID_COPIED', 'success');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Load plans for selected brand
function loadPlans(brand) {
    planSelect.innerHTML = '<option value="">>> SELECT_DURATION</option>';
    
    if (brand && brand.plans) {
        brand.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.name;
            option.textContent = `${plan.name} - ₹${plan.price}`;
            planSelect.appendChild(option);
        });
        planSelect.disabled = false;
    } else {
        planSelect.disabled = true;
    }
    
    // Reset current selection
    currentPlan = null;
    currentPrice = 0;
}

// Update purchase button
function updatePurchaseButton() {
    if (currentBrand && currentPlan) {
        purchaseBtn.disabled = false;
        purchaseBtn.querySelector('.btn-text').innerHTML = `<i class="fas fa-bolt"></i> INITIATE_PURCHASE - ₹${currentPrice}`;
    } else {
        purchaseBtn.disabled = true;
        purchaseBtn.querySelector('.btn-text').innerHTML = '<i class="fas fa-bolt"></i> INITIATE_PURCHASE - ₹0';
    }
}

// Update available keys display
function updateAvailableKeys() {
    if (!currentBrand) {
        availableKeysSpan.textContent = 'SELECT_APPLICATION_TO_VIEW_KEYS';
        return;
    }
    
    const availableCount = keysData.filter(key => 
        key.brandId === currentBrand.id && 
        key.status === 'available'
    ).length;
    
    availableKeysSpan.textContent = `KEYS_AVAILABLE: ${availableCount}`;
    availableKeysSpan.style.color = availableCount > 0 ? 'var(--terminal-green)' : 'var(--terminal-red)';
}

// Open payment modal
function openPaymentModal() {
    // Generate unique order ID
    currentOrderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Update order summary
    document.getElementById('summary-brand').textContent = currentBrand.name.toUpperCase();
    document.getElementById('summary-plan').textContent = currentPlan.name.toUpperCase();
    document.getElementById('summary-price').textContent = `₹${currentPrice}`;
    document.getElementById('payment-amount').textContent = currentPrice;
    document.getElementById('upi-display').textContent = upiId;
    document.getElementById('order-id').textContent = currentOrderId;
    
    // Generate QR code with order ID
    generateQRCode();
    
    // Reset status
    statusMessage.innerHTML = '<i class="fas fa-sync fa-spin"></i> AWAITING_PAYMENT';
    statusMessage.style.color = '';
    
    // Reset payment steps
    updatePaymentSteps(0);
    
    // Show modal
    paymentModal.style.display = 'block';
    
    // Start automatic payment checking
    startPaymentChecking();
}

// Update payment steps
function updatePaymentSteps(stepIndex) {
    const steps = document.querySelectorAll('.payment-steps .step');
    steps.forEach((step, index) => {
        if (index <= stepIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Generate QR code for UPI payment with order ID
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    
    // Clear previous QR code
    qrContainer.innerHTML = '';
    
    // Create UPI payment URL with order ID in note
    const upiUrl = `upi://pay?pa=${upiId}&pn=MalayaliStore&am=${currentPrice}&cu=INR&tn=Order ${currentOrderId} - ${currentBrand.name} ${currentPlan.name}`;
    
    // Generate QR code using Google Charts API
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
    
    const qrImage = document.createElement('img');
    qrImage.src = qrUrl;
    qrImage.alt = 'UPI Payment QR Code';
    qrImage.style.width = '200px';
    qrImage.style.height = '200px';
    
    qrContainer.appendChild(qrImage);
}

// Start automatic payment checking
function startPaymentChecking() {
    // Clear any existing interval
    if (paymentInterval) {
        clearInterval(paymentInterval);
    }
    
    // Update to step 1
    updatePaymentSteps(1);
    
    // Check payment every 5 seconds
    paymentInterval = setInterval(() => {
        checkPaymentStatus();
    }, 5000);
}

// Check payment status via webhook
async function checkPaymentStatus() {
    try {
        statusMessage.innerHTML = '<i class="fas fa-sync fa-spin"></i> CHECKING_PAYMENT_STATUS...';
        
        // For Webhook.site, we'll simulate payment detection
        // In real implementation, you would check the response from your webhook
        const isPaid = await simulatePaymentDetection();
        
        if (isPaid) {
            // Payment detected!
            statusMessage.innerHTML = '<i class="fas fa-check"></i> PAYMENT_RECEIVED';
            statusMessage.style.color = 'var(--terminal-green)';
            
            // Update to step 2
            updatePaymentSteps(2);
            
            // Clear interval
            if (paymentInterval) {
                clearInterval(paymentInterval);
                paymentInterval = null;
            }
            
            // Process the order
            setTimeout(() => {
                processOrder();
            }, 2000);
        } else {
            // Still waiting
            statusMessage.innerHTML = '<i class="fas fa-clock"></i> AWAITING_PAYMENT';
        }
        
    } catch (error) {
        console.error('Payment check failed:', error);
        statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> CHECKING_PAYMENT...';
    }
}

// Simulate payment detection (Remove this in production)
async function simulatePaymentDetection() {
    // This simulates automatic payment detection
    // In production, you would:
    // 1. Integrate with payment gateway API
    // 2. Use webhook notifications
    // 3. Check bank/UPI transaction status
    
    // For demo, simulate payment after 15-25 seconds
    const elapsedTime = Date.now() - parseInt(currentOrderId.replace('ORD', ''));
    return elapsedTime > 15000 && Math.random() > 0.4; // 60% success after 15 seconds
}

// Process the order and provide key
function processOrder() {
    // Find an available key for the selected brand and plan
    const availableKey = keysData.find(key => 
        key.brandId === currentBrand.id && 
        key.plan === currentPlan.name && 
        key.status === 'available'
    );
    
    if (availableKey) {
        // Mark key as sold
        availableKey.status = 'sold';
        availableKey.soldAt = new Date().toISOString();
        availableKey.orderId = currentOrderId;
        
        // Save to localStorage
        saveDataToLocalStorage();
        
        // Show key to user
        showKey(availableKey.key);
        
        // Update available keys display
        updateAvailableKeys();
    } else {
        showNotification('ERROR: NO_KEY_AVAILABLE', 'error');
        closeAllModals();
    }
}

// Show key to user
function showKey(key) {
    document.getElementById('generated-key').textContent = key;
    document.getElementById('verified-order-id').textContent = currentOrderId;
    document.getElementById('purchase-time').textContent = new Date().toLocaleString();
    
    // Close payment modal and open key modal
    paymentModal.style.display = 'none';
    keyModal.style.display = 'block';
}

// Close all modals
function closeAllModals() {
    paymentModal.style.display = 'none';
    keyModal.style.display = 'none';
    
    // Clear payment interval
    if (paymentInterval) {
        clearInterval(paymentInterval);
        paymentInterval = null;
    }
    
    // Reset selections
    currentBrand = null;
    currentPlan = null;
    currentPrice = 0;
    currentOrderId = null;
    
    // Reset form
    brandSelect.selectedIndex = 0;
    planSelect.selectedIndex = 0;
    planSelect.disabled = true;
    customCodeInput.value = '';
    updatePurchaseButton();
    updateAvailableKeys();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;
    
    // Add styles
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
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS for notifications
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

// Save data to localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('brandsData', JSON.stringify(brandsData));
    localStorage.setItem('keysData', JSON.stringify(keysData));
}

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedBrands = localStorage.getItem('brandsData');
    const savedKeys = localStorage.getItem('keysData');
    
    if (savedBrands) {
        const parsedBrands = JSON.parse(savedBrands);
        if (parsedBrands && parsedBrands.length > 0) {
            brandsData = parsedBrands;
            loadBrands();
        }
    }
    
    if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        if (parsedKeys && parsedKeys.length > 0) {
            keysData = parsedKeys;
        }
    }
}
