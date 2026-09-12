let products = [];
let keysStock = [];
let currentProduct = null;
let currentPlan = null;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchStoreData();
});

async function fetchStoreData() {
    const { data: prodData } = await db.from('products').select('*');
    const { data: keyData } = await db.from('keys').select('*').eq('status', 'Live');
    
    products = prodData || [];
    keysStock = keyData || [];
    
    renderAppDropdown();
}

function switchView(view) {
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-ai').classList.add('hidden');
    document.getElementById(`view-${view}`).classList.remove('hidden');
}

function toggleDropdown(id) {
    const el = document.getElementById(id);
    if(el.classList.contains('hidden')) {
        document.querySelectorAll('.custom-dropdown-menu').forEach(d => d.classList.add('hidden'));
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function renderAppDropdown() {
    const drop = document.getElementById('productDropdown');
    drop.innerHTML = '';
    
    if (products.length === 0) {
        document.getElementById('productBtnText').innerText = 'No Apps Available';
        return;
    }

    products.forEach(p => {
        drop.innerHTML += `
            <div onclick='selectApp(${JSON.stringify(p)})' class="p-3 hover:bg-yellow-500/20 rounded-lg cursor-pointer flex justify-between items-center font-bold text-sm text-white">
                <span>${p.name}</span>
            </div>
        `;
    });
    selectApp(products[0]);
}

function selectApp(p) {
    currentProduct = p;
    document.getElementById('productBtnText').innerText = p.name;
    document.getElementById('productHint').innerText = p.hint || '';
    document.getElementById('productDropdown').classList.add('hidden');
    
    document.getElementById('planBtnText').innerText = "Select Duration";
    currentPlan = null;
    document.getElementById('totalPrice').innerText = `₹ 0`;
    
    renderPlanDropdown(p.plans || []);
    updateStock();
}

function renderPlanDropdown(plans) {
    const drop = document.getElementById('planDropdown');
    drop.innerHTML = '';
    
    if (plans.length === 0) {
        drop.innerHTML = `<div class="p-3 text-xs text-gray-400">No plans configured</div>`;
        return;
    }

    plans.forEach(plan => {
        drop.innerHTML += `
            <div onclick='selectPlan(${JSON.stringify(plan)})' class="p-3 hover:bg-yellow-500/20 rounded-lg cursor-pointer flex justify-between items-center font-bold text-sm text-white">
                <span>${plan.name}</span>
                <span class="text-yellow-400">₹${plan.price}</span>
            </div>
        `;
    });
}

function selectPlan(plan) {
    currentPlan = plan;
    document.getElementById('planBtnText').innerText = plan.name;
    document.getElementById('totalPrice').innerText = `₹ ${plan.price}`;
    document.getElementById('planDropdown').classList.add('hidden');
    updateStock();
}

function updateStock() {
    if(!currentProduct || !currentPlan) {
        document.getElementById('stockCount').innerText = '0 Keys Ready';
        return;
    }
    const count = keysStock.filter(k => k.product_name === currentProduct.name && k.plan_name === currentPlan.name).length;
    document.getElementById('stockCount').innerText = `${count} Keys Ready`;
}

function payNow() {
    if (!currentPlan) return alert("Select a duration plan first!");
    alert(`Redirecting to FamPay for ₹${currentPlan.price}`);
}

// --- LUNA AI CHATBOT ---
function sendAI() {
    const inputEl = document.getElementById('aiInput');
    const msg = inputEl.value.trim();
    if(!msg) return;
    
    const chatBox = document.getElementById('chatBox');
    
    // User message
    chatBox.innerHTML += `
        <div class="flex gap-2 justify-end">
            <div class="bg-yellow-500 text-black p-3 rounded-2xl rounded-tr-none font-medium">
                ${msg}
            </div>
        </div>
    `;
    inputEl.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // AI Response Simulation
    setTimeout(() => {
        let reply = "I'm sorry, I didn't understand that. You can ask me about 'setup', 'keys', 'prices', or 'contact'.";
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes("setup") || lowerMsg.includes("loader")) {
            reply = "You can download the official loader and setup files from our Telegram channel @MALAYALI7. Make sure to delete any old versions first!";
        } else if (lowerMsg.includes("key") || lowerMsg.includes("buy")) {
            reply = "You can buy keys directly on the homepage! Just select your app (iOS/Android/PC), choose your duration, and pay securely via UPI.";
        } else if (lowerMsg.includes("price") || lowerMsg.includes("cost")) {
            reply = "Prices vary depending on the App and Duration (like 5 hours, 1 day, etc). Check the main page dropdowns for live pricing!";
        } else if (lowerMsg.includes("contact") || lowerMsg.includes("admin")) {
            reply = "If you have payment issues or need direct support, message the owner on Telegram at @MALAYALI7.";
        }

        chatBox.innerHTML += `
            <div class="flex gap-2 mt-4">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=80" class="w-6 h-6 rounded-full border border-yellow-500">
                <div class="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none border border-yellow-500/20 text-gray-200">
                    ${reply}
                </div>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 800);
}let products = [];
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
