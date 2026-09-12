document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    addPlanRow(); 
    await loadAdminData();
});

let apps = [];

// --- VIEW SWITCHING ---
function switchAdminView(view) {
    if(view === 'keys') {
        document.getElementById('admin-menu-view').classList.add('hidden');
        document.getElementById('admin-keys-view').classList.remove('hidden');
    } else {
        document.getElementById('admin-keys-view').classList.add('hidden');
        document.getElementById('admin-menu-view').classList.remove('hidden');
    }
}

function mockAction(name) {
    alert(`Opening interface for: ${name}\n\n(This section is currently under development)`);
}

// --- APP & PLAN CREATION ---
function addPlanRow() {
    const container = document.getElementById('plansContainer');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 plan-row';
    div.innerHTML = `
        <input type="text" placeholder="Plan Name (e.g. 5 Hour)" class="w-2/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <input type="number" placeholder="Price (₹)" class="w-1/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 px-2 transition"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
}

async function saveApp() {
    const name = document.getElementById('appName').value.trim();
    const hint = document.getElementById('appHint').value.trim();
    
    if(!name) return alert('App Name is required!');

    let plans = [];
    document.querySelectorAll('.plan-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const pName = inputs[0].value.trim();
        const pPrice = parseInt(inputs[1].value);
        if(pName && pPrice) plans.push({ name: pName, price: pPrice });
    });

    if(plans.length === 0) return alert('Add at least one valid plan with a price!');

    // Disable button to prevent double-click
    const btn = event.target;
    btn.innerText = "SAVING...";
    btn.disabled = true;

    await db.from('products').insert([{ name, hint, plans }]);
    alert('App & Plans Saved Successfully!');
    
    // Reset Form
    document.getElementById('appName').value = '';
    document.getElementById('appHint').value = '';
    document.getElementById('plansContainer').innerHTML = '';
    addPlanRow();
    btn.innerText = "SAVE APPLICATION";
    btn.disabled = false;

    // Refresh dropdowns instantly without page reload
    await loadAdminData();
}

// --- DATA LOADING & KEY ASSIGNMENT ---
async function loadAdminData() {
    const { data: prods } = await db.from('products').select('*');
    apps = prods || [];
    
    const appSelect = document.getElementById('keyAppSelect');
    const filterApp = document.getElementById('filterApp');
    
    // Save current selection if re-loading
    const currentAppSelect = appSelect.value;
    
    appSelect.innerHTML = '<option value="">Select App...</option>';
    filterApp.innerHTML = '<option value="All">All Apps</option>';
    
    apps.forEach(app => {
        appSelect.innerHTML += `<option value="${app.name}">${app.name}</option>`;
        filterApp.innerHTML += `<option value="${app.name}">${app.name}</option>`;
    });

    if (currentAppSelect && apps.find(a => a.name === currentAppSelect)) {
        appSelect.value = currentAppSelect;
    }
    
    updateKeyPlanDropdown();
    loadInventory();
}

function updateKeyPlanDropdown() {
    const appName = document.getElementById('keyAppSelect').value;
    const planSelect = document.getElementById('keyPlanSelect');
    planSelect.innerHTML = '';
    
    const app = apps.find(a => a.name === appName);
    if(app && app.plans) {
        app.plans.forEach(p => {
            planSelect.innerHTML += `<option value="${p.name}">${p.name} (₹${p.price})</option>`;
        });
    }
}

async function saveKeys() {
    const keysText = document.getElementById('keyStrings').value.trim();
    const appName = document.getElementById('keyAppSelect').value;
    const planName = document.getElementById('keyPlanSelect').value;

    if(!keysText || !appName || !planName) return alert('Select App, Plan, and enter at least one key.');

    const keysArray = keysText.split('\n').map(k => k.trim()).filter(k => k);
    
    const inserts = keysArray.map(k => ({
        key_str: k,
        product_name: appName,
        plan_name: planName,
        status: 'Live'
    }));

    const btn = event.target;
    btn.innerText = "SAVING...";
    btn.disabled = true;

    await db.from('keys').insert(inserts);
    alert(`${inserts.length} Key(s) Added Successfully!`);
    
    document.getElementById('keyStrings').value = '';
    btn.innerText = "SAVE KEYS";
    btn.disabled = false;
    
    loadInventory();
}

// --- INVENTORY MANAGEMENT ---
async function loadInventory() {
    const appFilter = document.getElementById('filterApp').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('inventoryList');
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Loading Keys...</td></tr>';

    let query = db.from('keys').select('*').order('id', { ascending: false });
    if(appFilter !== 'All') query = query.eq('product_name', appFilter);
    if(statusFilter !== 'All') query = query.eq('status', statusFilter);

    const { data: keys } = await query;
    tbody.innerHTML = '';

    if (!keys || keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500 font-bold">No keys found.</td></tr>';
        return;
    }

    keys.forEach(k => {
        const badgeColor = k.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
        
        tbody.innerHTML += `
            <tr class="hover:bg-yellow-500/5 transition border-b border-yellow-500/10 last:border-0">
                <td class="px-4 py-3 font-mono text-yellow-400 font-bold">${k.key_str}</td>
                <td class="px-4 py-3 text-gray-300">
                    <div class="font-bold">${k.product_name}</div>
                    <div class="text-[10px] text-gray-500">${k.plan_name}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 border rounded-md text-[10px] font-bold ${badgeColor}">${k.status}</span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                    <button onclick="toggleStatus(${k.id}, '${k.status}')" class="px-3 py-1.5 bg-[#1a1a1a] border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 text-yellow-500 transition" title="Toggle Status"><i class="fa-solid fa-rotate"></i></button>
                    <button onclick="deleteKey(${k.id})" class="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 text-red-400 transition" title="Delete Key"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Live' ? 'Sold' : 'Live';
    await db.from('keys').update({ status: newStatus }).eq('id', id);
    loadInventory();
}

async function deleteKey(id) {
    if(!confirm("Are you sure you want to delete this key permanently?")) return;
    await db.from('keys').delete().eq('id', id);
    loadInventory();
}document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    addPlanRow(); // Add one empty plan row to start
    await loadAdminData();
});

let apps = [];

// --- APP & PLAN CREATION ---
function addPlanRow() {
    const container = document.getElementById('plansContainer');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 plan-row';
    div.innerHTML = `
        <input type="text" placeholder="Plan Name (e.g. 5 Hour)" class="w-2/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <input type="number" placeholder="Price (₹)" class="w-1/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 px-2"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
}

async function saveApp() {
    const name = document.getElementById('appName').value.trim();
    const hint = document.getElementById('appHint').value.trim();
    
    if(!name) return alert('App Name is required!');

    let plans = [];
    document.querySelectorAll('.plan-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const pName = inputs[0].value.trim();
        const pPrice = parseInt(inputs[1].value);
        if(pName && pPrice) plans.push({ name: pName, price: pPrice });
    });

    if(plans.length === 0) return alert('Add at least one valid plan with a price!');

    await db.from('products').insert([{ name, hint, plans }]);
    alert('App & Plans Saved!');
    location.reload();
}

// --- DATA LOADING & KEY ASSIGNMENT ---
async function loadAdminData() {
    const { data: prods } = await db.from('products').select('*');
    apps = prods || [];
    
    const appSelect = document.getElementById('keyAppSelect');
    const filterApp = document.getElementById('filterApp');
    appSelect.innerHTML = '<option value="">Select App...</option>';
    
    apps.forEach(app => {
        appSelect.innerHTML += `<option value="${app.name}">${app.name}</option>`;
        if(![...filterApp.options].some(o => o.value === app.name)) {
            filterApp.innerHTML += `<option value="${app.name}">${app.name}</option>`;
        }
    });

    loadInventory();
}

function updateKeyPlanDropdown() {
    const appName = document.getElementById('keyAppSelect').value;
    const planSelect = document.getElementById('keyPlanSelect');
    planSelect.innerHTML = '';
    
    const app = apps.find(a => a.name === appName);
    if(app && app.plans) {
        app.plans.forEach(p => {
            planSelect.innerHTML += `<option value="${p.name}">${p.name} (₹${p.price})</option>`;
        });
    }
}

async function saveKeys() {
    const keysText = document.getElementById('keyStrings').value.trim();
    const appName = document.getElementById('keyAppSelect').value;
    const planName = document.getElementById('keyPlanSelect').value;

    if(!keysText || !appName || !planName) return alert('Fill all fields to save keys.');

    const keysArray = keysText.split('\n').map(k => k.trim()).filter(k => k);
    
    const inserts = keysArray.map(k => ({
        key_str: k,
        product_name: appName,
        plan_name: planName,
        status: 'Live'
    }));

    await db.from('keys').insert(inserts);
    alert(`${inserts.length} Key(s) Added Successfully!`);
    document.getElementById('keyStrings').value = '';
    loadInventory();
}

// --- INVENTORY MANAGEMENT ---
async function loadInventory() {
    const appFilter = document.getElementById('filterApp').value;
    const statusFilter = document.getElementById('filterStatus').value;

    let query = db.from('keys').select('*').order('id', { ascending: false });
    if(appFilter !== 'All') query = query.eq('product_name', appFilter);
    if(statusFilter !== 'All') query = query.eq('status', statusFilter);

    const { data: keys } = await query;
    const tbody = document.getElementById('inventoryList');
    tbody.innerHTML = '';

    (keys || []).forEach(k => {
        const badgeColor = k.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
        
        tbody.innerHTML += `
            <tr class="hover:bg-yellow-500/5 transition">
                <td class="px-4 py-3 font-mono text-yellow-400 font-bold">${k.key_str}</td>
                <td class="px-4 py-3 text-gray-300">
                    <div class="font-bold">${k.product_name}</div>
                    <div class="text-[10px] text-gray-500">${k.plan_name}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 border rounded-md text-[10px] font-bold ${badgeColor}">${k.status}</span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                    <button onclick="toggleStatus(${k.id}, '${k.status}')" class="px-3 py-1.5 bg-[#1a1a1a] border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 text-yellow-500 transition"><i class="fa-solid fa-rotate"></i> Status</button>
                    <button onclick="deleteKey(${k.id})" class="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 text-red-400 transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Live' ? 'Sold' : 'Live';
    await db.from('keys').update({ status: newStatus }).eq('id', id);
    loadInventory();
}

async function deleteKey(id) {
    if(!confirm("Delete this key permanently?")) return;
    await db.from('keys').delete().eq('id', id);
    loadInventory();
}document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    await loadAdminData();
});

async function loadAdminData() {
    const { data: prods } = await db.from('products').select('*');
    const { data: keys } = await db.from('keys').select('*');

    const selectEl = document.getElementById('keyProdSelect');
    if (selectEl) {
        selectEl.innerHTML = '';
        (prods || []).forEach(p => {
            selectEl.innerHTML += `<option value="${p.name}">${p.name}</option>`;
        });
    }

    const keyList = document.getElementById('keyList');
    if (keyList) {
        keyList.innerHTML = '';
        (keys || []).forEach(k => {
            keyList.innerHTML += `
                <div class="flex items-center justify-between bg-black/80 p-3 rounded-xl border border-yellow-500/20 text-xs">
                    <div>
                        <div class="font-black text-yellow-400">${k.key_str}</div>
                        <div class="text-[10px] text-slate-400">${k.product_name} • ${k.duration}</div>
                    </div>
                    <button onclick="deleteKey(${k.id})" class="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg font-bold">Delete</button>
                </div>
            `;
        });
    }
}

async function createNewProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const hint = document.getElementById('newProdHint').value.trim();
    const price_5h = parseInt(document.getElementById('price5h').value) || 149;
    const price_1d = parseInt(document.getElementById('price1d').value) || 250;
    const price_7d = parseInt(document.getElementById('price7d').value) || 999;
    const price_30d = parseInt(document.getElementById('price30d').value) || 1999;

    if (!name) return alert('Enter product title!');

    await db.from('products').insert([{ name, hint, price_5h, price_1d, price_7d, price_30d }]);
    alert('Product created successfully!');
    location.reload();
}

async function addKeyToDatabase() {
    const key_str = document.getElementById('newKeyStr').value.trim();
    const product_name = document.getElementById('keyProdSelect').value;
    const duration = document.getElementById('keyDurSelect').value;

    if (!key_str) return alert('Enter key string!');

    await db.from('keys').insert([{ key_str, product_name, duration, status: 'Active' }]);
    alert('Key added successfully!');
    loadAdminData();
}

async function deleteKey(id) {
    await db.from('keys').delete().eq('id', id);
    loadAdminData();
}
