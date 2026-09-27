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

// --- AUTOMATED GATEWAY QR & POLLING FLOW ---

async function initiateAutoPayment() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const createUrl = `https://famgateway.site/api/create_order.php?amount=${selectedPlan.price}&api_key=${apiKey}`;

    try {
        const response = await fetch(createUrl);
        const result = await response.json();

        if (result.status === "success" && result.data) {
            const { order_id, qr_url, upi_id, amount } = result.data;
            showPaymentModal(order_id, qr_url, upi_id, amount);
            startPaymentPolling(order_id);
            startCountdownTimer(300); // 5 minutes timer
        } else {
            alert('Failed to generate automated gateway session. Please try again.');
        }
    } catch (err) {
        console.error('Gateway connection error:', err);
        alert('Network error connecting to payment gateway.');
    }
}

function showPaymentModal(orderId, qrUrl, upiId, amount) {
    let modal = document.getElementById('upiPaymentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'upiPaymentModal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-zinc-900 border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
                <h3 class="text-lg font-black text-yellow-400 mb-1">Scan & Pay Automatically</h3>
                <p class="text-xs text-zinc-400 mb-4">Pay ₹<span id="modalAmount"></span> using any UPI App</p>
                
                <div class="bg-white p-3 rounded-2xl inline-block mb-4 shadow-inner">
                    <img id="modalQrImg" src="" alt="UPI QR Code" class="w-48 h-48 mx-auto object-contain">
                </div>

                <div class="text-xs text-zinc-300 font-mono mb-4 bg-zinc-800 p-2 rounded-xl border border-zinc-700">
                    UPI ID: <span id="modalUpiId" class="text-yellow-400 font-bold"></span>
                </div>

                <div class="flex justify-between items-center bg-zinc-800/60 px-4 py-2.5 rounded-xl border border-zinc-700/50 text-xs mb-4">
                    <span class="text-zinc-400">Time Remaining:</span>
                    <span id="timerDisplay" class="text-yellow-400 font-mono font-bold text-sm">05:00</span>
                </div>

                <div class="flex items-center justify-center gap-2 text-xs text-yellow-400/90 animate-pulse font-semibold">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Waiting for payment confirmation...
                </div>
                
                <button onclick="cancelPaymentModal()" class="mt-4 text-[11px] text-zinc-500 hover:text-zinc-300 underline">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('modalAmount').innerText = amount;
    document.getElementById('modalQrImg').src = qrUrl;
    document.getElementById('modalUpiId').innerText = upiId;
    modal.classList.remove('hidden');
}

function startCountdownTimer(durationSeconds) {
    let timer = durationSeconds;
    const display = document.getElementById('timerDisplay');

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (display) display.innerText = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(countdownInterval);
            stopPolling();
            cancelPaymentModal();
            alert("Payment timeout! Please try again.");
        }
    }, 1000);
}

function startPaymentPolling(orderId) {
    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const verifyUrl = `https://famgateway.site/api/verify.php?order_id=${orderId}&api_key=${apiKey}`;

    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(verifyUrl);
            const data = await res.json();

            // Check if payment status is successful from gateway response
            if (data.status === "success" && data.data) {
                stopPolling();
                cancelPaymentModal();
                await fulfillOrderAfterPayment(orderId);
            }
        } catch (e) {
            console.warn("Polling status check error:", e);
        }
    }, 5000); // Checks every 5 seconds automatically
}

function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    if (countdownInterval) clearInterval(countdownInterval);
}

function cancelPaymentModal() {
    stopPolling();
    const modal = document.getElementById('upiPaymentModal');
    if (modal) modal.classList.add('hidden');
}

async function fulfillOrderAfterPayment(orderId) {
    let assignedKey = null;

    try {
        if (typeof db !== 'undefined' && db) {
            // Fetch one Live key matching the exact product and plan from Supabase
            const { data: keyData, error: fetchError } = await db.from('keys')
                .select('*')
                .eq('product_name', selectedProduct.name)
                .eq('plan_name', selectedPlan.name)
                .eq('status', 'Live')
                .limit(1)
                .single();

            if (!fetchError && keyData) {
                assignedKey = keyData.key_str; // Matches your column name 'key_str'

                // Update key status to Sold in database
                await db.from('keys')
                    .update({ status: 'Sold' })
                    .eq('id', keyData.id);
            }
        }
    } catch (e) {
        console.warn('Database key allocation error:', e);
    }

    if (!assignedKey) {
        assignedKey = "KEY-FALLBACK-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    showSuccessModal(assignedKey, selectedProduct.name, selectedPlan.name, orderId);
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
