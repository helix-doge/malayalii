document.addEventListener('DOMContentLoaded', async () => {
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
