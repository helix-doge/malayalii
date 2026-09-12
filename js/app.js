// State variables
let productsData = [];
let selectedProduct = null;
let selectedPlan = null;

// Fallback sample data in case DB connection fails or is slow
const fallbackProducts = [
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

// Run setup as soon as page loads
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    const productBtnText = document.getElementById('productBtnText');
    
    try {
        // Fetch products from database with a 3-second timeout guard
        const dbPromise = (typeof db !== 'undefined' && db) 
            ? db.from('products').select('*') 
            : Promise.reject('Database client not initialized');

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 3000)
        );

        const response = await Promise.race([dbPromise, timeoutPromise]);

        if (response && response.data && response.data.length > 0) {
            productsData = response.data;
        } else {
            productsData = fallbackProducts;
        }
    } catch (err) {
        console.warn('Database fetch failed or timed out. Loading fallback data:', err);
        productsData = fallbackProducts;
    }

    renderProductDropdown();
}

function renderProductDropdown() {
    const btnText = document.getElementById('productBtnText');
    const dropdown = document.getElementById('productDropdown');

    if (!productsData || productsData.length === 0) {
        btnText.innerText = "No Products Available";
        return;
    }

    btnText.innerText = "Select Product";
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

    // Automatically select the first product for fast UX
    selectProduct(0);
}

function selectProduct(index) {
    selectedProduct = productsData[index];
    document.getElementById('productBtnText').innerText = selectedProduct.name;
    
    const hintElement = document.getElementById('productHint');
    if (hintElement && selectedProduct.hint) {
        hintElement.innerText = selectedProduct.hint;
    }

    toggleDropdown('productDropdown', false);
    renderPlanDropdown();
}

function renderPlanDropdown() {
    const btnText = document.getElementById('planBtnText');
    const dropdown = document.getElementById('planDropdown');
    
    dropdown.innerHTML = '';
    selectedPlan = null;
    document.getElementById('totalPrice').innerText = '₹ --';
    document.getElementById('stockCount').innerText = 'Checking...';

    if (!selectedProduct || !selectedProduct.plans || selectedProduct.plans.length === 0) {
        btnText.innerText = "No Plans Available";
        return;
    }

    btnText.innerText = "Choose Duration";

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

    // Auto select first plan
    selectPlan(0);
}

function selectPlan(index) {
    selectedPlan = selectedProduct.plans[index];
    document.getElementById('planBtnText').innerText = `${selectedPlan.name} - ₹${selectedPlan.price}`;
    document.getElementById('totalPrice').innerText = `₹ ${selectedPlan.price}`;
    
    toggleDropdown('planDropdown', false);
    checkStockCount();
}

async function checkStockCount() {
    const stockElement = document.getElementById('stockCount');
    if (!selectedProduct || !selectedPlan) return;

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

    // Default status if query fails
    stockElement.innerText = `Available`;
}

// Global UI Helper Functions
function toggleDropdown(id, forceState) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    // Close other dropdowns first
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

// Close dropdowns if user clicks outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#productDropdown') && !e.target.closest('#planDropdown') && !e.target.closest('button')) {
        toggleDropdown('productDropdown', false);
        toggleDropdown('planDropdown', false);
    }
});

function payNow() {
    if (!selectedProduct || !selectedPlan) {
        alert('Please select a product and plan first!');
        return;
    }
    alert(`Redirecting to FamPay Gateway for ${selectedProduct.name} (${selectedPlan.name}) - Total: ₹${selectedPlan.price}`);
}
