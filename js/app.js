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
const MERCHANT_UPI = "Malayali@upi"; // Replace with your merchant UPI ID

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
        // Fallback silently
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

/* FAMPAY MODAL & PAYMENT LOGIC */
function payNow() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    const orderId = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const amount = parseFloat(selectedPlan.price).toFixed(2);
    
    document.getElementById('modalOrderId').innerText = `ORDER ID: ${orderId}`;
    document.getElementById('modalProdName').innerText = selectedProduct.name;
    document.getElementById('modalPlanName').innerText = `${selectedPlan.name} 💛`;
    document.getElementById('modalAmount').innerText = `₹ ${amount}`;
    document.getElementById('modalUpiId').innerText = `UPI ID: ${MERCHANT_UPI}`;

    const upiUrl = `upi://pay?pa=${MERCHANT_UPI}&pn=Malayali%20Shop&am=${amount}&cu=INR&tn=${orderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    
    document.getElementById('qrCodeImg').src = qrUrl;
    document.getElementById('payDirectBtn').href = upiUrl;

    document.getElementById('paymentModal').classList.remove('hidden');
    startCountdown(300);
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);
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
            timerDisplay.innerText = "00 : 00";
            alert("Payment session expired. Please generate a new order.");
            closePaymentModal();
        }
    }, 1000);
}

function verifyPayment() {
    alert("Checking transaction status on FamPay Gateway... No pending UTR match found yet.");
}
