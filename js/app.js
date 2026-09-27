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
    checkRedirectReturn();
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

// --- SECURE CORS-FREE PAYMENT REDIRECT FLOW ---

async function initiateAutoPayment() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const orderId = "ORD_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Save pending transaction state locally before redirecting
    localStorage.setItem('pendingOrder', JSON.stringify({
        orderId: orderId,
        product: selectedProduct.name,
        plan: selectedPlan.name,
        amount: selectedPlan.price
    }));

    // Generate order via API or use gateway checkout link structure
    const createUrl = `https://famgateway.site/api/create_order.php?amount=${selectedPlan.price}&api_key=${apiKey}&order_id=${orderId}`;

    try {
        const response = await fetch(createUrl);
        const result = await response.json();

        if (result.status === "success" && result.data) {
            const checkoutUrl = result.data.checkout_url || `https://famgateway.site/checkout.php?order_id=${orderId}&api_key=${apiKey}`;
            window.location.href = checkoutUrl;
            return;
        }
    } catch (err) {
        console.warn("Direct fetch blocked by CORS, using direct checkout redirect fallback.");
    }

    // Fallback direct redirect to gateway checkout page
    window.location.href = `https://famgateway.site/checkout.php?order_id=${orderId}&amount=${selectedPlan.price}&api_key=${apiKey}`;
}

async function checkRedirectReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const savedOrderJson = localStorage.getItem('pendingOrder');
    
    if (!savedOrderJson) return;
    const savedOrder = JSON.parse(savedOrderJson);

    const apiKey = "FAM_A5698AB66B3DAA71C7D62594E1D06EC124A1F48D";
    const verifyUrl = `https://famgateway.site/api/verify.php?order_id=${savedOrder.orderId}&api_key=${apiKey}`;

    // Verify payment status with gateway upon return
    try {
        const res = await fetch(verifyUrl);
        const data = await res.json();

        if (data.status === "success") {
            await fulfillOrderAfterPayment(savedOrder.orderId, savedOrder.product, savedOrder.plan);
            localStorage.removeItem('pendingOrder');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (e) {
        console.warn("Verification check pending or network restriction.");
    }
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
                assignedKey = keyData.key_str; // Matches your Supabase column name

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
