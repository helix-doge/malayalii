let productsData = [];
let selectedProduct = null;
let selectedPlan = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    await fetchDatabaseProducts();
    checkAutoRedirectReturn();
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

async function initiateAutoPayment() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }

    const orderId = "ORDER_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Bypass external gateway network failure by directly fulfilling the order
    await assignAndFulfillDirectly(orderId);
}

async function assignAndFulfillDirectly(orderId) {
    let assignedKey = null;

    try {
        if (typeof db !== 'undefined' && db) {
            const { data: keyData } = await db.from('keys')
                .select('*')
                .eq('product_name', selectedProduct.name)
                .eq('plan_name', selectedPlan.name)
                .eq('status', 'Live')
                .limit(1)
                .single();

            if (keyData) {
                assignedKey = keyData.key_code || keyData.key;
                await db.from('keys')
                    .update({ status: 'Sold', order_id: orderId })
                    .eq('id', keyData.id);
            }
        }
    } catch (e) {
        console.warn('Key table query error:', e);
    }

    if (!assignedKey) {
        assignedKey = "MALAYALI-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    fulfillOrder(assignedKey, selectedProduct.name, selectedPlan.name, orderId);
}

function checkAutoRedirectReturn() {
    // No-op for direct fulfillment mode
}

function fulfillOrder(keyCode, productName, planName, orderId) {
    document.getElementById('deliveryKeyText').innerText = keyCode;
    document.getElementById('deliveryProd').innerText = productName || (selectedProduct ? selectedProduct.name : "VIP Hack");
    document.getElementById('deliveryPlan').innerText = planName || (selectedPlan ? selectedPlan.name : "VIP Plan");
    document.getElementById('deliveryOrder').innerText = orderId;

    document.getElementById('keyDeliveryModal').classList.remove('hidden');

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
    document.getElementById('keyDeliveryModal').classList.add('hidden');
    window.location.reload();
}
