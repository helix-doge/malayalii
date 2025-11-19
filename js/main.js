// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// UPI ID
const UPI_ID = "malayalihere@ybl";

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
    verificationModal: document.getElementById('verification-modal'),
    availableKeysSpan: document.getElementById('available-keys')
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
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        showNotification('NETWORK_ERROR: CANNOT_LOAD_APPLICATIONS', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    elements.brandSelect.addEventListener('change', handleBrandChange);
    elements.planSelect.addEventListener('change', handlePlanChange);
    elements.purchaseBtn.addEventListener('click', handlePurchase);
    
    // Payment verification
    document.getElementById('verify-payment-btn').addEventListener('click', verifyPayment);
    document.getElementById('cancel-verification').addEventListener('click', closeVerificationModal);
    
    // Close modals
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('close-modal').addEventListener('click', closeAllModals);
    
    // Copy buttons
    document.getElementById('copy-key').addEventListener('click', copyKey);
    document.getElementById('copy-upi').addEventListener('click', copyUpi);
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

// Update purchase button
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

// Update available keys
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
        const orderData = {
            orderId: currentOrderId,
            brandId: parseInt(currentBrand.id),
            planName: currentPlan.name,
            amount: parseFloat(currentPrice)
        };

        const response = await fetch(`${API_BASE_URL}/api/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showNotification(data.error || 'FAILED_TO_CREATE_ORDER', 'error');
            return;
        }
        
        // Update UI
        updatePaymentUI();
        generateQRCode();
        
        // Show payment modal
        elements.paymentModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('NETWORK_ERROR: CANNOT_CREATE_ORDER', 'error');
    }
}

// Update payment UI
function updatePaymentUI() {
    document.getElementById('summary-brand').textContent = currentBrand.name.toUpperCase();
    document.getElementById('summary-plan').textContent = currentPlan.name.toUpperCase();
    document.getElementById('summary-price').textContent = `₹${currentPrice}`;
    document.getElementById('payment-amount').textContent = currentPrice;
    document.getElementById('order-id').textContent = currentOrderId;
    document.getElementById('upi-display').textContent = UPI_ID;
}

// Generate QR code - FIXED VERSION
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=MalayaliStore&am=${currentPrice}&cu=INR&tn=Order ${currentOrderId}`;
    
    // Use QR Server API (more reliable)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    
    const qrImage = document.createElement('img');
    qrImage.src = qrUrl;
    qrImage.alt = 'UPI Payment QR Code';
    qrImage.style.width = '200px';
    qrImage.style.height = '200px';
    qrImage.style.border = '2px solid var(--terminal-cyan)';
    
    qrImage.onload = () => console.log('✅ QR code loaded successfully');
    qrImage.onerror = () => {
        console.error('❌ QR code failed to load');
        qrContainer.innerHTML = `
            <div style="color: var(--terminal-red); padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <div>QR_CODE_GENERATION_FAILED</div>
                <div style="font-size: 0.8rem; margin-top: 10px;">Please use UPI ID manually</div>
            </div>
        `;
    };
    
    qrContainer.appendChild(qrImage);
}

// Open verification modal
function openVerificationModal() {
    document.getElementById('verification-order-id').textContent = currentOrderId;
    document.getElementById('verification-amount').textContent = currentPrice;
    document.getElementById('utr-number').value = '';
    
    elements.paymentModal.style.display = 'none';
    document.getElementById('verification-modal').style.display = 'block';
}

// Close verification modal
function closeVerificationModal() {
    document.getElementById('verification-modal').style.display = 'none';
}

// Verify payment with UTR number
async function verifyPayment() {
    const utrNumber = document.getElementById('utr-number').value.trim();
    const transactionAmount = document.getElementById('transaction-amount').value.trim();
    
    if (!utrNumber) {
        showNotification('PLEASE_ENTER_UTR_NUMBER', 'error');
        return;
    }
    
    if (!transactionAmount) {
        showNotification('PLEASE_ENTER_TRANSACTION_AMOUNT', 'error');
        return;
    }
    
    try {
        showNotification('VERIFYING_PAYMENT...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: currentOrderId,
                utrNumber: utrNumber,
                transactionAmount: parseFloat(transactionAmount)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showKey(data.key);
            showNotification('PAYMENT_VERIFIED_SUCCESSFULLY', 'success');
        } else {
            showNotification(data.error || 'PAYMENT_VERIFICATION_FAILED', 'error');
        }
        
    } catch (error) {
        console.error('Payment verification error:', error);
        showNotification('NETWORK_ERROR: CANNOT_VERIFY_PAYMENT', 'error');
    }
}

// Show key to user
function showKey(key) {
    document.getElementById('generated-key').textContent = key;
    document.getElementById('verified-order-id').textContent = currentOrderId;
    document.getElementById('purchase-time').textContent = new Date().toLocaleString();
    
    document.getElementById('verification-modal').style.display = 'none';
    elements.keyModal.style.display = 'block';
    
    updateAvailableKeys();
}

// Copy functions
function copyKey() {
    const keyText = document.getElementById('generated-key').textContent;
    copyToClipboard(keyText);
    showNotification('KEY_COPIED_TO_CLIPBOARD', 'success');
}

function copyUpi() {
    copyToClipboard(UPI_ID);
    showNotification('UPI_ID_COPIED', 'success');
}

// Utility function to copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
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
    document.getElementById('verification-modal').style.display = 'none';
    
    currentPrice = 0;
    currentOrderId = null;
    updateAvailableKeys();
}

// Show notification
function showNotification(message, type = 'info') {
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

console.log('🎉 Malayali Store frontend loaded successfully');
