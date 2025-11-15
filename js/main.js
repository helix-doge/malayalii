// Backend API URL (Replace with your Render URL)
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

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
    updateAvailableKeys();
});

// Load brands from backend
async function loadBrands() {
    try {
        brandSelect.innerHTML = '<option value="">>> CHOOSE_APPLICATION</option>';
        
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const data = await response.json();
        
        if (data.success) {
            data.brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.name.toUpperCase();
                brandSelect.appendChild(option);
            });
        } else {
            showNotification('FAILED_TO_LOAD_APPLICATIONS', 'error');
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        showNotification('NETWORK_ERROR: CANNOT_LOAD_APPLICATIONS', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Brand selection
    brandSelect.addEventListener('change', async function() {
        const brandId = parseInt(this.value);
        if (brandId) {
            await loadBrandDetails(brandId);
            updatePurchaseButton();
            updateAvailableKeys();
        } else {
            currentBrand = null;
            loadPlans(null);
            updatePurchaseButton();
            updateAvailableKeys();
        }
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
    purchaseBtn.addEventListener('click', async function() {
        if (currentBrand && currentPlan) {
            // Check if keys are available
            try {
                const response = await fetch(`${API_BASE_URL}/api/keys/available/${currentBrand.id}`);
                const data = await response.json();
                
                if (data.success && data.count > 0) {
                    openPaymentModal();
                } else {
                    showNotification('NO_KEYS_AVAILABLE_FOR_THIS_SELECTION', 'error');
                }
            } catch (error) {
                console.error('Error checking keys:', error);
                showNotification('ERROR_CHECKING_KEY_AVAILABILITY', 'error');
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
        const upiDisplay = document.getElementById('upi-display');
        const upiText = upiDisplay.textContent;
        
        navigator.clipboard.writeText(upiText).then(() => {
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

// Load brand details including plans
async function loadBrandDetails(brandId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const data = await response.json();
        
        if (data.success) {
            currentBrand = data.brands.find(brand => brand.id === brandId);
            loadPlans(currentBrand);
        }
    } catch (error) {
        console.error('Error loading brand details:', error);
        showNotification('ERROR_LOADING_APPLICATION_DETAILS', 'error');
    }
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
async function updateAvailableKeys() {
    if (!currentBrand) {
        availableKeysSpan.textContent = 'SELECT_APPLICATION_TO_VIEW_KEYS';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/keys/available/${currentBrand.id}`);
        const data = await response.json();
        
        if (data.success) {
            availableKeysSpan.textContent = `KEYS_AVAILABLE: ${data.count}`;
            availableKeysSpan.style.color = data.count > 0 ? 'var(--terminal-green)' : 'var(--terminal-red)';
        }
    } catch (error) {
        console.error('Error updating available keys:', error);
        availableKeysSpan.textContent = 'ERROR_CHECKING_KEYS';
        availableKeysSpan.style.color = 'var(--terminal-red)';
    }
}

// Open payment modal
async function openPaymentModal() {
    // Generate unique order ID
    currentOrderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    try {
        // Create order in backend
        const response = await fetch(`${API_BASE_URL}/api/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: currentOrderId,
                brandId: currentBrand.id,
                planName: currentPlan.name,
                amount: currentPrice,
                customerEmail: 'customer@malayali.store'
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showNotification(data.error || 'FAILED_TO_CREATE_ORDER', 'error');
            return;
        }
        
        // Update order summary
        document.getElementById('summary-brand').textContent = currentBrand.name.toUpperCase();
        document.getElementById('summary-plan').textContent = currentPlan.name.toUpperCase();
        document.getElementById('summary-price').textContent = `₹${currentPrice}`;
        document.getElementById('payment-amount').textContent = currentPrice;
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
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('NETWORK_ERROR: CANNOT_CREATE_ORDER', 'error');
    }
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
    const upiId = "Malayalihere@ybl"; // Your UPI ID
    const upiUrl = `upi://pay?pa=${upiId}&pn=MalayaliStore&am=${currentPrice}&cu=INR&tn=Order ${currentOrderId} - ${currentBrand.name} ${currentPlan.name}`;
    
    // Generate QR code using Google Charts API
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
    
    const qrImage = document.createElement('img');
    qrImage.src = qrUrl;
    qrImage.alt = 'UPI Payment QR Code';
    qrImage.style.width = '200px';
    qrImage.style.height = '200px';
    
    qrContainer.appendChild(qrImage);
    
    // Update UPI display
    document.getElementById('upi-display').textContent = upiId;
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

// Check payment status and process order
async function checkPaymentStatus() {
    try {
        statusMessage.innerHTML = '<i class="fas fa-sync fa-spin"></i> CHECKING_PAYMENT_STATUS...';
        
        // For demo purposes, we'll simulate payment after 15 seconds
        // In production, you would integrate with actual payment gateway
        const elapsedTime = Date.now() - parseInt(currentOrderId.replace('ORD', ''));
        const isPaid = elapsedTime > 15000 && Math.random() > 0.4; // 60% success after 15 seconds
        
        if (isPaid) {
            // Process the payment and get key
            const response = await fetch(`${API_BASE_URL}/api/process-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: currentOrderId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
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
                
                // Show the key to user
                setTimeout(() => {
                    showKey(data.key);
                }, 2000);
            } else {
                statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + data.error;
                statusMessage.style.color = 'var(--terminal-red)';
            }
        } else {
            // Still waiting
            statusMessage.innerHTML = '<i class="fas fa-clock"></i> AWAITING_PAYMENT';
        }
        
    } catch (error) {
        console.error('Payment check failed:', error);
        statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> CHECKING_PAYMENT...';
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
    
    // Update available keys display
    updateAvailableKeys();
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
