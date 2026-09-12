document.addEventListener('DOMContentLoaded', async () => {
    if(typeof checkAdminAuth === 'function') checkAdminAuth();
    addPlanRow(); 
    await loadAdminData();
});

let apps = [];

// Navigation Router
function showMainMenu() {
    document.getElementById('view-main-menu').classList.remove('hidden');
    document.getElementById('view-keys-section').classList.add('hidden');
    document.getElementById('view-generic-section').classList.add('hidden');
}

function openAdminSection(sectionKey) {
    document.getElementById('view-main-menu').classList.add('hidden');
    
    if (sectionKey === 'keys') {
        document.getElementById('view-keys-section').classList.remove('hidden');
        document.getElementById('view-generic-section').classList.add('hidden');
    } else {
        document.getElementById('view-keys-section').classList.add('hidden');
        const container = document.getElementById('generic-content');
        document.getElementById('view-generic-section').classList.remove('hidden');
        
        const titles = {
            fampay: "FamPay Gateway Setup (API Key)",
            admins: "Admin Management",
            income: "Income & Sales Analytics",
            brand: "Brand & Logo Maintenance",
            tutorials: "Tutorials & Loader Links",
            redeem: "Redeem Codes & Discounts",
            support: "Support Contact Settings",
            channel: "Paid Channel URLs"
        };
        
        container.innerHTML = `
            <h2 class="text-base font-black text-yellow-400 uppercase tracking-wide border-b border-yellow-500/20 pb-2 mb-4">${titles[sectionKey] || 'Settings'}</h2>
            <p class="text-xs text-gray-400 mb-4">Module settings for ${titles[sectionKey]}. Update parameters below.</p>
            <div class="p-4 bg-[#111] rounded-xl border border-yellow-500/20 text-xs text-yellow-500 font-mono">
                Configuration interface loaded successfully.
            </div>
        `;
    }
}

// Plan Rows
function addPlanRow() {
    const container = document.getElementById('plansContainer');
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'flex space-x-2 plan-row';
    div.innerHTML = `
        <input type="text" placeholder="Plan (e.g. 1 Day)" class="w-2/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <input type="number" placeholder="Price (₹)" class="w-1/3 bg-black border border-yellow-500/40 rounded-lg p-2 text-xs text-white">
        <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 px-2 transition"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
}

// Save App
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

    if(plans.length === 0) return alert('Add at least one valid plan!');

    await db.from('products').insert([{ name, hint, plans }]);
    alert('App Saved Successfully!');
    
    document.getElementById('appName').value = '';
    document.getElementById('appHint').value = '';
    document.getElementById('plansContainer').innerHTML = '';
    addPlanRow();

    await loadAdminData();
}

// Load Data & Dropdowns
async function loadAdminData() {
    const { data: prods } = await db.from('products').select('*');
    apps = prods || [];
    
    const appSelect = document.getElementById('keyAppSelect');
    const filterApp = document.getElementById('filterApp');
    if(!appSelect || !filterApp) return;
    
    appSelect.innerHTML = '<option value="">Select App...</option>';
    filterApp.innerHTML = '<option value="All">All Apps</option>';
    
    apps.forEach(app => {
        appSelect.innerHTML += `<option value="${app.name}">${app.name}</option>`;
        filterApp.innerHTML += `<option value="${app.name}">${app.name}</option>`;
    });

    updateKeyPlanDropdown();
    loadInventory();
}

function updateKeyPlanDropdown() {
    const appName = document.getElementById('keyAppSelect').value;
    const planSelect = document.getElementById('keyPlanSelect');
    if(!planSelect) return;
    planSelect.innerHTML = '';
    
    const app = apps.find(a => a.name === appName);
    if(app && app.plans) {
        app.plans.forEach(p => {
            planSelect.innerHTML += `<option value="${p.name}">${p.name} (₹${p.price})</option>`;
        });
    }
}

// Save Keys
async function saveKeys() {
    const keysText = document.getElementById('keyStrings').value.trim();
    const appName = document.getElementById('keyAppSelect').value;
    const planName = document.getElementById('keyPlanSelect').value;

    if(!keysText || !appName || !planName) return alert('Fill in all fields!');

    const keysArray = keysText.split('\n').map(k => k.trim()).filter(k => k);
    const inserts = keysArray.map(k => ({
        key_str: k,
        product_name: appName,
        plan_name: planName,
        status: 'Live'
    }));

    await db.from('keys').insert(inserts);
    alert(`${inserts.length} Key(s) Added!`);
    
    document.getElementById('keyStrings').value = '';
    loadInventory();
}

// Inventory
async function loadInventory() {
    const appFilter = document.getElementById('filterApp').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('inventoryList');
    if(!tbody) return;

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
                    <button onclick="toggleStatus(${k.id}, '${k.status}')" class="px-3 py-1.5 bg-[#1a1a1a] border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 text-yellow-500 transition"><i class="fa-solid fa-rotate"></i></button>
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
    if(!confirm("Delete key permanently?")) return;
    await db.from('keys').delete().eq('id', id);
    loadInventory();
}
