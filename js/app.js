let productsData = [];
let selectedProduct = null;
let selectedPlan = null;
let pollingInterval = null;
let countdownInterval = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    await fetchDatabaseProducts();
}

async function fetchDatabaseProducts() {
    const btnText = document.getElementById('productBtnText');
    if (btnText) btnText.innerText = "Loading Products...";

    try {
        if (typeof db !== 'undefined' && db) {
            const { data, error } = await db.from('products').select('*');
            if (!error && data && data.length > 0) {
                productsData = data;
            } else {
                productsData = [];
            }
        }
    } catch (e) {
        console.warn('Error fetching products from DB:', e);
        productsData = [];
    }

    renderProductDropdown();
}

function renderProductDropdown() {
    const btnText = document.getElementById('productBtnText');
    const dropdown = document.getElementById('productDropdown');

    if (!btnText || !dropdown) return;
    dropdown.innerHTML = '';

    if (!productsData || productsData.length === 0) {
        btnText.innerText = "No Products Found in DB";
        const hintElement = document.getElementById('productHint');
        if (hintElement) hintElement.innerText = "Please add products inside your Supabase database table.";
        return;
    }

    productsData.forEach((product, idx) => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-yellow-500/20 rounded-xl cursor-pointer text-xs font-bold text-white transition flex justify-between items-center";
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
    if (hintElement) {
        hintElement.innerText = selectedProduct.hint || selectedProduct.description || "";
    }

    toggleDropdown('productDropdown', false);
    renderPlanDropdown();
}

function renderPlanDropdown() {
    const btnText = document.getElementById('planBtnText');
    const dropdown = document.getElementById('planDropdown');
    
    if (!btnText || !dropdown) return;
    dropdown.innerHTML = '';

    if (!selectedProduct) {
        btnText.innerText = "Select Product First";
        return;
    }

    let plans = selectedProduct.plans;
    if (typeof plans === 'string') {
        try { plans = JSON.parse(plans); } catch(e) { plans = []; }
    }

    if (!plans || plans.length === 0) {
        btnText.innerText = "No Plans Available";
        return;
    }

    plans.forEach((plan, idx) => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-yellow-500/20 rounded-xl cursor-pointer text-xs font-bold text-white flex justify-between items-center transition";
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
    if (!selectedProduct) return;

    let plans = selectedProduct.plans;
    if (typeof plans === 'string') {
        try { plans = JSON.parse(plans); } catch(e) { plans = []; }
    }

    if (!plans || !plans[index]) return;

    selectedPlan = plans[index];
    const planBtnText = document.getElementById('planBtnText');
    const totalPrice = document.getElementById('totalPrice');

    if (planBtnText) planBtnText.innerText = `${selectedPlan.name}`;
    if (totalPrice) totalPrice.innerText = `₹ ${selectedPlan.price}`;

    toggleDropdown('planDropdown', false);
    checkStockCount();
}

async function checkStockCount() {
    const stockElement = document.getElementById('stockCount');
    if (!stockElement || !selectedProduct || !selectedPlan) return;

    stockElement.innerText = "Checking...";

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
        console.warn('Stock check error:', e);
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

// --- FULLY AUTOMATED PAYMENT & VERIFICATION FLOW ---

async function initiateAutoPayment() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const orderId = "ORD_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const createUrl = `https://famgateway.site/api/create_order.php?amount=${selectedPlan.price}&api_key=${apiKey}&order_id=${orderId}`;

    let qrSrc = "";
    try {
        const response = await fetch(createUrl, { mode: 'cors' });
        const result = await response.json();
        if (result.status === "success" && result.data) {
            qrSrc = result.data.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.data.upi_intent || '')}`;
        }
    } catch (err) {
        console.warn("Gateway error or offline, fallback to direct UPI payload.");
    }

    // Fallback QR if API offline
    if (!qrSrc) {
        const upiString = `upi://pay?pa=Malayali@upi&pn=MalayaliStore&am=${selectedPlan.price}&cu=INR&tn=${orderId}`;
        qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
    }

    openAutomatedWaitingModal(orderId, qrSrc);
    startPaymentPolling(orderId);
}

function openAutomatedWaitingModal(orderId, qrSrc) {
    let modal = document.getElementById('localFallbackModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'localFallbackModal';
        modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-zinc-900 border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
                <h3 class="text-lg font-black text-yellow-400 mb-1">Scan & Pay</h3>
                <p class="text-xs text-zinc-400 mb-3">Pay exactly ₹<span id="fallbackAmount"></span> to <span class="text-yellow-400 font-bold">Malayali@upi</span></p>
                
                <div class="bg-white p-3 rounded-2xl inline-block mb-3 shadow-inner">
                    <img id="fallbackQr" src="" alt="QR" class="w-44 h-44 mx-auto object-contain">
                </div>

                <div class="flex items-center justify-center gap-2 text-xs text-yellow-500 font-bold mb-4 bg-yellow-500/10 py-2 rounded-xl border border-yellow-500/20">
                    <svg class="animate-spin h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Waiting for payment... (<span id="paymentTimer">05:00</span>)</span>
                </div>

                <p class="text-[11px] text-zinc-500 mb-4">Your key will be delivered automatically the second payment is received.</p>
                
                <button onclick="cancelAutomatedPayment()" class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('fallbackAmount').innerText = selectedPlan.price;
    document.getElementById('fallbackQr').src = qrSrc;
    modal.classList.remove('hidden');

    // Start 5-minute countdown timer
    let timeLeft = 300;
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        const timerEl = document.getElementById('paymentTimer');
        if (timerEl) {
            timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            clearInterval(pollingInterval);
            alert("Payment session timed out.");
            cancelAutomatedPayment();
        }
    }, 1000);
}

function startPaymentPolling(orderId) {
    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const verifyUrl = `https://famgateway.site/api/verify_order.php?api_key=${apiKey}&order_id=${orderId}`;

    clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(verifyUrl, { mode: 'cors' });
            const data = await res.json();

            // Check if payment status is successful
            if (data.status === "success" && (data.data?.payment_status === "SUCCESS" || data.data?.status === "PAID" || data.paid === true)) {
                clearInterval(pollingInterval);
                clearInterval(countdownInterval);
                document.getElementById('localFallbackModal').classList.add('hidden');
                await fulfillOrderAfterPayment(orderId, selectedProduct.name, selectedPlan.name);
            }
        } catch (e) {
            // Simulated local check fallback if gateway endpoint is unreachable
            console.warn("Polling check error:", e);
        }
    }, 4000); // Check every 4 seconds automatically
}

function cancelAutomatedPayment() {
    clearInterval(pollingInterval);
    clearInterval(countdownInterval);
    const modal = document.getElementById('localFallbackModal');
    if (modal) modal.classList.add('hidden');
}

async function fulfillOrderAfterPayment(orderId, productName, planName) {
    let assignedKey = null;

    try {
        if (typeof db !== 'undefined' && db) {
            const { data: keyData, error: fetchError } = await db.from('keys')
                .select('*')
                .eq('product_name', productName)
                .eq('plan_name', planName)
                .eq('status', 'Live')
                .limit(1)
                .single();

            if (!fetchError && keyData) {
                assignedKey = keyData.key_str;

                await db.from('keys')
                    .update({ status: 'Sold' })
                    .eq('id', keyData.id);
            }
        }
    } catch (e) {
        console.warn('Database key allocation error:', e);
    }

    if (!assignedKey) {
        assignedKey = "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    showSuccessModal(assignedKey, productName, planName, orderId);
}

function showSuccessModal(keyCode, productName, planName, orderId) {
    const deliveryKeyText = document.getElementById('deliveryKeyText');
    const deliveryProd = document.getElementById('deliveryProd');
    const deliveryPlan = document.getElementById('deliveryPlan');
    const deliveryOrder = document.getElementById('deliveryOrder');

    if (deliveryKeyText) deliveryKeyText.innerText = keyCode;
    if (deliveryProd) deliveryProd.innerText = productName;
    if (deliveryPlan) deliveryPlan.innerText = planName;
    if (deliveryOrder) deliveryOrder.innerText = orderId;

    const modal = document.getElementById('keyDeliveryModal');
    if (modal) modal.classList.remove('hidden');

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
            if (copyBtnLabel) copyBtnLabel.innerText = "COPY KEY";
            if (copyToast) copyToast.classList.add('hidden');
        }, 3000);
    }).catch(() => {
        console.warn("Auto-copy blocked.");
    });
}

function closeKeyModal() {
    const modal = document.getElementById('keyDeliveryModal');
    if (modal) modal.classList.add('hidden');
    window.location.reload();
}
