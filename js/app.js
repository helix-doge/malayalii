let products = [];
let keysStock = [];
let currentProduct = null;
let currentPlan = null;
let shopConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
    await fetchShopConfig();
    await fetchProductsAndStock();
});

async function fetchShopConfig() {
    const { data } = await db.from('shop_config').select('*').single();
    if (data) {
        shopConfig = data;
        const brandNav = document.getElementById('brandTitleNav');
        const footerBrand = document.getElementById('footerBrand');
        if (brandNav) brandNav.innerText = data.brand_name;
        if (footerBrand) footerBrand.innerText = `© 2026 ${data.brand_name}`;
    }
}

async function fetchProductsAndStock() {
    const { data: prodData } = await db.from('products').select('*');
    const { data: keyData } = await db.from('keys').select('*').eq('status', 'Active');
    
    products = prodData || [];
    keysStock = keyData || [];
    renderProductDropdown();
}

function switchView(viewId) {
    ['home', 'contact', 'ai'].forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');
}

function toggleMenu() {
    document.getElementById('navModal').classList.toggle('hidden');
}

function toggleDropdown(id) {
    ['productDropdown', 'planDropdown'].forEach(d => {
        if (d !== id) document.getElementById(d).classList.add('hidden');
    });
    document.getElementById(id).classList.toggle('hidden');
}

function renderProductDropdown() {
    const dropdown = document.getElementById('productDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';
    
    if (products.length === 0) {
        document.getElementById('productBtnText').innerText = 'No Products Found';
        return;
    }

    products.forEach(p => {
        dropdown.innerHTML += `
            <div onclick='selectProduct(${JSON.stringify(p)})' class="px-3.5 py-2.5 rounded-xl hover:bg-yellow-500/20 cursor-pointer text-sm font-bold flex items-center justify-between">
                <span>${p.name}</span>
                <span class="text-xs text-yellow-400 font-black">₹${p.price_1d || p.price_5h}+</span>
            </div>
        `;
    });
    selectProduct(products[0]);
}

function selectProduct(p) {
    currentProduct = p;
    document.getElementById('productBtnText').innerText = p.name;
    document.getElementById('productSubHint').innerText = p.hint || '';
    document.getElementById('productDropdown').classList.add('hidden');
    renderPlanDropdownForProduct(p);
    updateStockCountDisplay();
}

function renderPlanDropdownForProduct(p) {
    const planDropdown = document.getElementById('planDropdown');
    planDropdown.innerHTML = '';

    const durationMap = [
        { key: '5h', name: '5 Hour ⏱️', enabled: p.enable_5h, price: p.price_5h },
        { key: '1d', name: '1 Day 💛', enabled: p.enable_1d, price: p.price_1d },
        { key: '7d', name: '7 Day 💎', enabled: p.enable_7d, price: p.price_7d },
        { key: '30d', name: '30 Day / Month 🔥', enabled: p.enable_30d, price: p.price_30d }
    ];

    durationMap.forEach(dur => {
        if (dur.enabled) {
            planDropdown.innerHTML += `
                <div onclick="selectPlan('${dur.name}', '${dur.key}', ${dur.price})" class="px-3.5 py-2.5 rounded-xl hover:bg-yellow-500/20 cursor-pointer text-sm font-bold flex items-center justify-between">
                    <span>${dur.name}</span>
                    <span class="text-yellow-400 font-black">₹${dur.price}</span>
                </div>
            `;
        }
    });
}

function selectPlan(name, type, price) {
    currentPlan = { name, type, price };
    document.getElementById('planBtnText').innerText = name;
    document.getElementById('planDropdown').classList.add('hidden');
    document.getElementById('totalPrice').innerText = `₹ ${price}`;
}

function updateStockCountDisplay() {
    const activeCount = keysStock.filter(k => k.product_name === currentProduct.name).length;
    document.getElementById('stockCount').innerText = `${activeCount} Keys Ready`;
}

function startSecureCheckout() {
    if (!currentPlan) {
        alert('Please select a plan duration first!');
        return;
    }
    alert(`Checkout Initialized for ${currentProduct.name} (${currentPlan.name}) - Amount: ₹${currentPlan.price}`);
}
