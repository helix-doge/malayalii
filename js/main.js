// Backend API URL - UPDATE THIS WITH YOUR RENDER URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// UPI ID for payments
const upiId = "Malayalihere@ybl";

// Global variables
let currentBrand = null;
let currentPlan = null;
let currentPrice = 0;
let paymentInterval = null;
let currentOrderId = null;

// DOM Elements
const elements = {
    brandSelect: document.getElementById('brand-select'),
    planSelect: document.getElementById('plan-select'),
    purchaseBtn: document.getElementById('purchase-btn'),
    paymentModal: document.getElementById('payment-modal'),
    keyModal: document.getElementById('key-modal'),
    availableKeysSpan: document.getElementById('available-keys'),
    statusMessage: document.getElementById('status-message')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Malayali Store...');
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
        // Load fallback brands
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
    // Brand selection
    elements.brandSelect.addEventListener('change', handleBrandChange);
    
    // Plan selection
    elements.planSelect.addEventListener('change', handlePlanChange);
    
    // Purchase button
    elements.purchaseBtn.addEventListener('click', handlePurchase);
    
    // Cancel payment
    document.getElementById('cancel-payment').addEventListener('click', closeAllModals);
    
    // Close modals
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('close-modal').addEventListener('click', closeAllModals);
    
    // Copy buttons
    document.getElementById('copy-key').addEventListener('click', copyKey);
    document.getElementById('copy-upi').addEventListener('click', copyUpi);
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Enter key in custom code
    document.getElementById('custom-code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !elements.purchaseBtn.disabled) {
            elements.purchaseBtn.click();
        }
    });
    
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

async function handlePurchase() {
    if (currentBrand && currentPlan) {
        await checkAndOpenPayment();
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
            `<i class="fas fa-bolt"></i> INITIATE_PURCHASE - ₹${currentPrice}`;
    } else {
        elements.purchaseBtn.disabled = true;
        elements.purchaseBtn.querySelector('.btn-text').innerHTML = 
            '<i class="fas fa-bolt"></i> INITIATE_PURCHASE - ₹0';
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

// Check keys and open payment modal
async function checkAndOpenPayment() {
    try {
        showNotification('CHECKING_KEY_AVAILABILITY...', 'info');
        
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

// Open payment modal
async function openPaymentModal() {
    currentOrderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: currentOrderId,
                brandId: currentBrand.id,
                planName: currentPlan.name,
                amount: currentPrice
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showNotification(data.error || 'FAILED_TO_CREATE_ORDER', 'error');
            return;
        }
        
        // Update UI
        updatePaymentUI();
        generateQRCode();
        elements.statusMessage.innerHTML = '<i class="fas fa-sync fa-spin"></i> AWAITING_PAYMENT';
        elements.statusMessage.style.color = '';
        updatePaymentSteps(0);
        
        // Show modal and start payment checking
        elements.paymentModal.style.display = 'block';
        startPaymentChecking();
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('NETWORK_ERROR: CANNOT_CREATE_ORDER', 'error');
    }
}

// Update payment UI elements
function updatePaymentUI() {
    document.getElementById('summary-brand').textContent = currentBrand.name.toUpperCase();
    document.getElementById('summary-plan').textContent = currentPlan.name.toUpperCase();
    document.getElementById('summary-price').textContent = `₹${currentPrice}`;
    document.getElementById('payment-amount').textContent = currentPrice;
    document.getElementById('order-id').textContent = currentOrderId;
    document.getElementById('upi-display').textContent = upiId;
}

// Generate QR code
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=MalayaliStore&am=${currentPrice}&cu=INR&tn=Order ${currentOrderId} - ${currentBrand.name} ${currentPlan.name}`;
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
    
    const qrImage = document.createElement('img');
    qrImage.src = qrUrl;
    qrImage.alt = 'UPI Payment QR Code';
    qrImage.style.width = '200px';
    qrImage.style.height = '200px';
    
    qrImage.onload = () => console.log('✅ QR code loaded');
    qrImage.onerror = () => {
        qrContainer.innerHTML = '<div style="color: var(--terminal-red); padding: 20px;">QR_CODE_GENERATION_FAILED</div>';
    };
    
    qrContainer.appendChild(qrImage);
}

// Start payment checking interval
function startPaymentChecking() {
    if (paymentInterval) {
        clearInterval(paymentInterval);
    }
    
    updatePaymentSteps(1);
    paymentInterval = setInterval(checkPaymentStatus, 3000);
}

// Check payment status
async function checkPaymentStatus() {
    try {
        elements.statusMessage.innerHTML = '<i class="fas fa-sync fa-spin"></i> CHECKING_PAYMENT...';
        
        // Simulate payment detection (10 seconds)
        const elapsedTime = Date.now() - parseInt(currentOrderId.replace('ORD', ''));
        const isPaid = elapsedTime > 10000;
        
        if (isPaid) {
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
                // Payment successful
                elements.statusMessage.innerHTML = '<i class="fas fa-check"></i> PAYMENT_RECEIVED';
                elements.statusMessage.style.color = 'var(--terminal-green)';
                updatePaymentSteps(2);
                
                if (paymentInterval) {
                    clearInterval(paymentInterval);
                    paymentInterval = null;
                }
                
                // Show key to user
                setTimeout(() => showKey(data.key), 1000);
            } else {
                elements.statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + (data.error || 'PAYMENT_FAILED');
                elements.statusMessage.style.color = 'var(--terminal-red)';
            }
        } else {
            // Show countdown
            const secondsLeft = Math.ceil((10000 - elapsedTime) / 1000);
            if (secondsLeft > 0) {
                elements.statusMessage.innerHTML = `<i class="fas fa-clock"></i> AWAITING_PAYMENT (${secondsLeft}s)`;
            } else {
                elements.statusMessage.innerHTML = '<i class="fas fa-clock"></i> AWAITING_PAYMENT';
            }
        }
        
    } catch (error) {
        console.error('Payment check failed:', error);
        elements.statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> NETWORK_ERROR';
    }
}

// Show key to user
function showKey(key) {
    document.getElementById('generated-key').textContent = key;
    document.getElementById('verified-order-id').textContent = currentOrderId;
    document.getElementById('purchase-time').textContent = new Date().toLocaleString();
    
    elements.paymentModal.style.display = 'none';
    elements.keyModal.style.display = 'block';
    
    updateAvailableKeys();
    
    // Auto-copy key
    setTimeout(() => {
        copyToClipboard(key);
    }, 500);
}

// Update payment steps
function updatePaymentSteps(stepIndex) {
    const steps = document.querySelectorAll('.payment-steps .step');
    steps.forEach((step, index) => {
        step.classList.toggle('active', index <= stepIndex);
    });
}

// Copy functions
function copyKey() {
    const keyText = document.getElementById('generated-key').textContent;
    if (keyText && keyText !== 'DECRYPTING_KEY...') {
        copyToClipboard(keyText);
        showNotification('KEY_COPIED_TO_CLIPBOARD', 'success');
    }
}

function copyUpi() {
    copyToClipboard(upiId);
    showNotification('UPI_ID_COPIED', 'success');
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
    
    if (paymentInterval) {
        clearInterval(paymentInterval);
        paymentInterval = null;
    }
    
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

console.log('🎉 Malayali Store frontend loaded successfully');
