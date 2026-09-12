let productsData = [
    {
        id: 1,
        name: "Malayali VIP Android",
        hint: "Official Malayali VIP Loader & Setup Included",
        plans: [
            { name: "1 Day", price: 100 },
            { name: "7 Days", price: 400 },
            { name: "30 Days", price: 900 }
        ]
    },
    {
        id: 2,
        name: "Malayali VIP iOS",
        hint: "iOS Hack Update Link in Setup",
        plans: [
            { name: "1 Day", price: 150 },
            { name: "7 Days", price: 500 },
            { name: "30 Days", price: 1200 }
        ]
    }
];

let selectedProduct = null;
let selectedPlan = null;
let timerInterval = null;
let autoVerifyInterval = null;
let currentOrderId = null;
const MERCHANT_UPI = "Malayali@upi"; // Replace with your target UPI ID

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    renderProductDropdown();
    fetchDatabaseProducts();
}

function renderProductDropdown() {
    const btnText = document.getElementById('productBtnText');
    const dropdown = document.getElementById('productDropdown');

    if (!btnText || !dropdown) return;
    dropdown.innerHTML = '';

    productsData.forEach((product, idx) => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-yellow-500/20 rounded-lg cursor-pointer text-xs font-bold text-white transition flex justify-between items-center";
        item.innerText = product.name;
        item.onclick = (e) => {
            e.stopPropagation();
            selectProduct(idx);
        };
        dropdown.appendChild(item);
    });

    selectProduct(0);
}

function selectProduct(index) {
    if (!productsData[index]) return;
    
    selectedProduct = productsData[index];
    const btnText = document.getElementById('productBtnText');
    const hintElement = document.getElementById('productHint');

    if (btnText) btnText.innerText = selectedProduct.name;
    if (hintElement && selectedProduct.hint) hintElement.innerText = selectedProduct.hint;

    toggleDropdown('productDropdown', false);
    renderPlanDropdown();
}

function renderPlanDropdown() {
    const btnText = document.getElementById('planBtnText');
    const dropdown = document.getElementById('planDropdown');
    
    if (!btnText || !dropdown) return;
    dropdown.innerHTML = '';

    if (!selectedProduct || !selectedProduct.plans || selectedProduct.plans.length === 0) {
        btnText.innerText = "No Plans Available";
        return;
    }

    selectedProduct.plans.forEach((plan, idx) => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-yellow-500/20 rounded-lg cursor-pointer text-xs font-bold text-white flex justify-between items-center transition";
        item.innerHTML = `<span>${plan.name}</span><span class="text-yellow-400">₹${plan.price}</span>`;
        item.onclick = (e) => {
            e.stopPropagation();
            selectPlan(idx);
        };
        dropdown.appendChild(item);
    });

    selectPlan(0);
}

function selectPlan(index) {
    if (!selectedProduct || !selectedProduct.plans[index]) return;

    selectedPlan = selectedProduct.plans[index];
    const planBtnText = document.getElementById('planBtnText');
    const totalPrice = document.getElementById('totalPrice');

    if (planBtnText) planBtnText.innerText = `${selectedPlan.name} - ₹${selectedPlan.price}`;
    if (totalPrice) totalPrice.innerText = `₹ ${selectedPlan.price}`;

    toggleDropdown('planDropdown', false);
    checkStockCount();
}

async function fetchDatabaseProducts() {
    try {
        if (typeof db !== 'undefined' && db) {
            const { data, error } = await db.from('products').select('*');
            if (!error && data && data.length > 0) {
                productsData = data;
                renderProductDropdown();
            }
        }
    } catch (e) {
        console.warn('DB live sync skipped:', e);
    }
}

async function checkStockCount() {
    const stockElement = document.getElementById('stockCount');
    if (!stockElement || !selectedProduct || !selectedPlan) return;

    try {
        if (typeof db !== 'undefined' && db) {
            const { count, error } = await db.from('keys')
                .select('*', { count: 'exact', head: true })
                .eq('product_name', selectedProduct.name)
                .eq('plan_name', selectedPlan.name)
                .eq('status', 'Live');

            if (!error && count !== null) {
                stockElement.innerText = `${count} Keys Ready`;
                return;
            }
        }
    } catch (e) {
        // Fallback
    }
    stockElement.innerText = "Available";
}

function toggleDropdown(id, forceState) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    ['productDropdown', 'planDropdown'].forEach(dId => {
        if (dId !== id) {
            const other = document.getElementById(dId);
            if (other) other.classList.add('hidden');
        }
    });

    if (typeof forceState === 'boolean') {
        if (forceState) dropdown.classList.remove('hidden');
        else dropdown.classList.add('hidden');
    } else {
        dropdown.classList.toggle('hidden');
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#productDropdown') && !e.target.closest('#planDropdown') && !e.target.closest('button')) {
        toggleDropdown('productDropdown', false);
        toggleDropdown('planDropdown', false);
    }
});

/* CHECKOUT & AUTO-VERIFICATION SYSTEM */
function payNow() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    currentOrderId = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const amount = parseFloat(selectedPlan.price).toFixed(2);
    
    document.getElementById('modalOrderId').innerText = `ORDER ID: ${currentOrderId}`;
    document.getElementById('modalProdName').innerText = selectedProduct.name;
    document.getElementById('modalPlanName').innerText = `${selectedPlan.name} 💛`;
    document.getElementById('modalAmount').innerText = `₹ ${amount}`;
    document.getElementById('modalUpiId').innerText = `UPI ID: ${MERCHANT_UPI}`;

    const upiUrl = `upi://pay?pa=${MERCHANT_UPI}&pn=Malayali%20Shop&am=${amount}&cu=INR&tn=${currentOrderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    
    document.getElementById('qrCodeImg').src = qrUrl;
    document.getElementById('payDirectBtn').href = upiUrl;

    document.getElementById('paymentModal').classList.remove('hidden');
    
    startCountdown(300);
    startAutoVerification(currentOrderId);
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);
    if (autoVerifyInterval) clearInterval(autoVerifyInterval);
}

function startCountdown(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    let remaining = seconds;

    const timerDisplay = document.getElementById('countdownTimer');
    
    timerInterval = setInterval(() => {
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timerDisplay.innerText = `${mins} : ${secs}`;

        if (--remaining < 0) {
            clearInterval(timerInterval);
            if (autoVerifyInterval) clearInterval(autoVerifyInterval);
            timerDisplay.innerText = "00 : 00";
            alert("Payment session expired. Please generate a new order.");
            closePaymentModal();
        }
    }, 1000);
}

// Polling auto-verifier
function startAutoVerification(orderId) {
    if (autoVerifyInterval) clearInterval(autoVerifyInterval);

    autoVerifyInterval = setInterval(async () => {
        await checkOrderAndDeliver(orderId, false);
    }, 3000); // Check database every 3 seconds
}

async function verifyPaymentManually() {
    if (!currentOrderId) return;
    const verified = await checkOrderAndDeliver(currentOrderId, true);
    if (!verified) {
        alert("Payment verification in progress... No matching completed transaction found yet.");
    }
}

async function checkOrderAndDeliver(orderId, isManualCheck = false) {
    try {
        if (typeof db !== 'undefined' && db) {
            // Check order table status
            const { data, error } = await db.from('orders')
                .select('*')
                .eq('order_id', orderId)
                .eq('status', 'SUCCESS')
                .single();

            if (!error && data && data.key_code) {
                fulfillOrder(data.key_code, orderId);
                return true;
            }
        }
    } catch (err) {
        // Log error silently during polling
    }

    return false;
}

// Deliver Key & Show Screen
function fulfillOrder(keyCode, orderId) {
    closePaymentModal();

    document.getElementById('deliveryKeyText').innerText = keyCode;
    document.getElementById('deliveryProd').innerText = selectedProduct ? selectedProduct.name : "VIP Product";
    document.getElementById('deliveryPlan').innerText = selectedPlan ? selectedPlan.name : "VIP Plan";
    document.getElementById('deliveryOrder').innerText = orderId;

    document.getElementById('keyDeliveryModal').classList.remove('hidden');

    // Auto Copy Key to Clipboard
    copyKeyToClipboard();
}

function copyKeyToClipboard() {
    const keyText = document.getElementById('deliveryKeyText').innerText;
    if (!keyText || keyText === '--') return;

    navigator.clipboard.writeText(keyText).then(() => {
        const copyBtnLabel = document.getElementById('copyBtnLabel');
        const copyToast = document.getElementById('copyToast');

        if (copyBtnLabel) copyBtnLabel.innerText = "COPIED!";
        if (copyToast) copyToast.classList.remove('hidden');

        setTimeout(() => {
            if (copyBtnLabel) copyBtnLabel.innerText = "COPY";
            if (copyToast) copyToast.classList.add('hidden');
        }, 3000);
    }).catch(() => {
        console.warn("Auto-copy blocked by browser permissions.");
    });
}

function closeKeyModal() {
    document.getElementById('keyDeliveryModal').classList.add('hidden');
}
