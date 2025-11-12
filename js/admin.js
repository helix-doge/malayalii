// Load data from main.js
let brandsData = [];
let keysData = [];

// Admin authentication check
if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocalStorage();
    loadAdminData();
    setupAdminEvents();
    startServerTime();
});

function loadDataFromLocalStorage() {
    const savedBrands = localStorage.getItem('brandsData');
    const savedKeys = localStorage.getItem('keysData');
    
    if (savedBrands) {
        const parsedBrands = JSON.parse(savedBrands);
        if (parsedBrands && parsedBrands.length > 0) {
            brandsData = parsedBrands;
        } else {
            // Initialize with default apps
            brandsData = [
                { 
                    id: 1, 
                    name: "Vision", 
                    description: "Advanced visual processing suite",
                    plans: [
                        { name: "1 Month", price: 299 },
                        { name: "3 Months", price: 799 },
                        { name: "1 Year", price: 2599 }
                    ]
                },
                { 
                    id: 2, 
                    name: "Bat", 
                    description: "Network security and penetration toolkit",
                    plans: [
                        { name: "1 Month", price: 399 },
                        { name: "3 Months", price: 999 },
                        { name: "1 Year", price: 3299 }
                    ]
                }
            ];
        }
    } else {
        // Initialize with default apps
        brandsData = [
            { 
                id: 1, 
                name: "Vision", 
                description: "Advanced visual processing suite",
                plans: [
                    { name: "1 Month", price: 299 },
                    { name: "3 Months", price: 799 },
                    { name: "1 Year", price: 2599 }
                ]
            },
            { 
                id: 2, 
                name: "Bat", 
                description: "Network security and penetration toolkit",
                plans: [
                    { name: "1 Month", price: 399 },
                    { name: "3 Months", price: 999 },
                    { name: "1 Year", price: 3299 }
                ]
            }
        ];
    }
    
    if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        if (parsedKeys && parsedKeys.length > 0) {
            keysData = parsedKeys;
        } else {
            keysData = [];
        }
    } else {
        keysData = [];
    }
    
    saveDataToLocalStorage();
}

function loadAdminData() {
    updateStats();
    loadAppsGrid();
    loadFilters();
    loadKeysTable();
}

function setupAdminEvents() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = 'admin-login.html';
    });
    
    // Add app button
    document.getElementById('add-app-btn').addEventListener('click', function() {
        openAddAppModal();
    });
    
    // Add key button
    document.getElementById('add-key-btn').addEventListener('click', function() {
        openAddKeyModal();
    });
    
    // App form submission
    document.getElementById('app-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewApp();
    });
    
    // Key form submission
    document.getElementById('key-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewKey();
    });
    
    // Duration form submission
    document.getElementById('duration-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewDuration();
    });
    
    // Search and filter events
    document.getElementById('key-search').addEventListener('input', function() {
        loadKeysTable();
    });
    
    document.getElementById('app-filter').addEventListener('change', function() {
        loadKeysTable();
    });
    
    document.getElementById('status-filter').addEventListener('change', function() {
        loadKeysTable();
    });
    
    // Close modals
    document.querySelectorAll('.modal .close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

function updateStats() {
    const totalKeys = keysData.length;
    const availableKeys = keysData.filter(key => key.status === 'available').length;
    const soldKeys = totalKeys - availableKeys;
    
    // Calculate revenue
    let revenue = 0;
    keysData.forEach(key => {
        if (key.status === 'sold') {
            const brand = brandsData.find(b => b.id === key.brandId);
            if (brand) {
                const plan = brand.plans.find(p => p.name === key.plan);
                if (plan) {
                    revenue += plan.price;
                }
            }
        }
    });
    
    document.getElementById('total-keys').textContent = totalKeys;
    document.getElementById('available-keys').textContent = availableKeys;
    document.getElementById('sold-keys').textContent = soldKeys;
    document.getElementById('total-revenue').textContent = `₹${revenue}`;
}

function loadAppsGrid() {
    const appsGrid = document.getElementById('apps-grid');
    appsGrid.innerHTML = '';
    
    if (brandsData.length === 0) {
        appsGrid.innerHTML = `
            <div class="app-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem; color: var(--terminal-cyan); margin-bottom: 15px;">
                    <i class="fas fa-box-open"></i>
                </div>
                <div style="color: var(--terminal-text);">NO_APPLICATIONS_CONFIGURED</div>
            </div>
        `;
        return;
    }
    
    brandsData.forEach(brand => {
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        
        const availableKeys = keysData.filter(key => key.brandId === brand.id && key.status === 'available').length;
        
        appCard.innerHTML = `
            <div class="app-name">${brand.name.toUpperCase()}</div>
            <div class="app-description">${brand.description}</div>
            <div class="app-stats">
                <div style="color: var(--terminal-green); font-size: 0.8rem;">
                    KEYS_AVAILABLE: ${availableKeys}
                </div>
            </div>
            <div class="app-durations">
                ${brand.plans.map(plan => `
                    <div class="duration-item">
                        <span>${plan.name}</span>
                        <span>₹${plan.price}</span>
                    </div>
                `).join('')}
            </div>
            <div class="app-actions">
                <button class="hack-btn-sm add-duration-btn" data-app-id="${brand.id}">
                    <i class="fas fa-plus"></i> ADD_DURATION
                </button>
            </div>
        `;
        
        appsGrid.appendChild(appCard);
    });
    
    // Add event listeners to duration buttons
    document.querySelectorAll('.add-duration-btn').forEach(button => {
        button.addEventListener('click', function() {
            const appId = parseInt(this.getAttribute('data-app-id'));
            openAddDurationModal(appId);
        });
    });
}

function loadFilters() {
    const appFilter = document.getElementById('app-filter');
    appFilter.innerHTML = '<option value="">ALL_APPS</option>';
    
    brandsData.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name.toUpperCase();
        appFilter.appendChild(option);
    });
}

function loadKeysTable() {
    const tableBody = document.getElementById('keys-table-body');
    const searchTerm = document.getElementById('key-search').value.toLowerCase();
    const appFilter = document.getElementById('app-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredKeys = keysData;
    
    // Apply filters
    if (searchTerm) {
        filteredKeys = filteredKeys.filter(key => 
            key.key.toLowerCase().includes(searchTerm) ||
            (key.orderId && key.orderId.toLowerCase().includes(searchTerm))
        );
    }
    
    if (appFilter) {
        filteredKeys = filteredKeys.filter(key => key.brandId === parseInt(appFilter));
    }
    
    if (statusFilter) {
        filteredKeys = filteredKeys.filter(key => key.status === statusFilter);
    }
    
    if (filteredKeys.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--terminal-cyan);">
                    <i class="fas fa-key" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    NO_KEYS_FOUND
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    filteredKeys.forEach(key => {
        const brand = brandsData.find(b => b.id === key.brandId);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <code style="color: var(--terminal-cyan); font-size: 0.8rem;">${key.key}</code>
            </td>
            <td>${brand ? brand.name.toUpperCase() : 'UNKNOWN'}</td>
            <td>${key.plan}</td>
            <td>
                <span class="status-${key.status}">${key.status.toUpperCase()}</span>
            </td>
            <td>
                ${key.orderId ? `<code style="font-size: 0.7rem;">${key.orderId}</code>` : '-'}
            </td>
            <td>
                <button class="hack-btn-sm delete-key-btn" data-key-id="${key.id}">
                    <i class="fas fa-trash"></i> DELETE
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-key-btn').forEach(button => {
        button.addEventListener('click', function() {
            const keyId = parseInt(this.getAttribute('data-key-id'));
            deleteKey(keyId);
        });
    });
}

function openAddAppModal() {
    document.getElementById('add-app-modal').style.display = 'block';
    document.getElementById('app-form').reset();
}

function openAddKeyModal() {
    const keyAppSelect = document.getElementById('key-app');
    const keyDurationSelect = document.getElementById('key-duration');
    
    keyAppSelect.innerHTML = '<option value="">SELECT_APPLICATION</option>';
    keyDurationSelect.innerHTML = '<option value="">SELECT_APPLICATION_FIRST</option>';
    keyDurationSelect.disabled = true;
    
    brandsData.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name.toUpperCase();
        keyAppSelect.appendChild(option);
    });
    
    // Add event listener to load durations when app is selected
    keyAppSelect.addEventListener('change', function() {
        const appId = parseInt(this.value);
        const brand = brandsData.find(b => b.id === appId);
        
        keyDurationSelect.innerHTML = '<option value="">SELECT_DURATION</option>';
        
        if (brand && brand.plans) {
            brand.plans.forEach(plan => {
                const option = document.createElement('option');
                option.value = plan.name;
                option.textContent = plan.name;
                keyDurationSelect.appendChild(option);
            });
            keyDurationSelect.disabled = false;
        } else {
            keyDurationSelect.disabled = true;
        }
    });
    
    document.getElementById('add-key-modal').style.display = 'block';
    document.getElementById('key-form').reset();
}

function openAddDurationModal(appId = null) {
    const durationAppSelect = document.getElementById('duration-app');
    durationAppSelect.innerHTML = '<option value="">SELECT_APPLICATION</option>';
    
    brandsData.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name.toUpperCase();
        if (appId && brand.id === appId) {
            option.selected = true;
        }
        durationAppSelect.appendChild(option);
    });
    
    document.getElementById('add-duration-modal').style.display = 'block';
    document.getElementById('duration-form').reset();
}

function addNewApp() {
    const name = document.getElementById('app-name').value.trim();
    const description = document.getElementById('app-description').value.trim();
    
    if (!name) {
        showNotification('PLEASE_ENTER_APP_NAME', 'error');
        return;
    }
    
    // Check if app already exists
    if (brandsData.some(brand => brand.name.toLowerCase() === name.toLowerCase())) {
        showNotification('APP_ALREADY_EXISTS', 'error');
        return;
    }
    
    const newApp = {
        id: brandsData.length > 0 ? Math.max(...brandsData.map(b => b.id)) + 1 : 1,
        name: name,
        description: description || 'No description provided',
        plans: []
    };
    
    brandsData.push(newApp);
    saveDataToLocalStorage();
    loadAdminData();
    
    document.getElementById('add-app-modal').style.display = 'none';
    showNotification('APPLICATION_ADDED_SUCCESSFULLY', 'success');
}

function addNewKey() {
    const appId = parseInt(document.getElementById('key-app').value);
    const duration = document.getElementById('key-duration').value;
    const keyCode = document.getElementById('key-code').value.trim();
    
    if (!appId || !duration || !keyCode) {
        showNotification('PLEASE_FILL_ALL_FIELDS', 'error');
        return;
    }
    
    // Check if key already exists
    if (keysData.some(key => key.key === keyCode)) {
        showNotification('KEY_ALREADY_EXISTS', 'error');
        return;
    }
    
    const newKey = {
        id: keysData.length > 0 ? Math.max(...keysData.map(k => k.id)) + 1 : 1,
        brandId: appId,
        plan: duration,
        key: keyCode,
        status: 'available',
        addedAt: new Date().toISOString()
    };
    
    keysData.push(newKey);
    saveDataToLocalStorage();
    loadAdminData();
    
    document.getElementById('add-key-modal').style.display = 'none';
    showNotification('KEY_ADDED_SUCCESSFULLY', 'success');
}

function addNewDuration() {
    const appId = parseInt(document.getElementById('duration-app').value);
    const name = document.getElementById('duration-name').value.trim();
    const price = parseFloat(document.getElementById('duration-price').value);
    
    if (!appId || !name || !price) {
        showNotification('PLEASE_FILL_ALL_FIELDS', 'error');
        return;
    }
    
    const app = brandsData.find(b => b.id === appId);
    if (!app) {
        showNotification('APPLICATION_NOT_FOUND', 'error');
        return;
    }
    
    // Check if duration already exists
    if (app.plans.some(plan => plan.name.toLowerCase() === name.toLowerCase())) {
        showNotification('DURATION_ALREADY_EXISTS', 'error');
        return;
    }
    
    app.plans.push({
        name: name,
        price: price
    });
    
    saveDataToLocalStorage();
    loadAdminData();
    
    document.getElementById('add-duration-modal').style.display = 'none';
    showNotification('DURATION_ADDED_SUCCESSFULLY', 'success');
}

function deleteKey(keyId) {
    if (!confirm('CONFIRM_KEY_DELETION?\nTHIS_ACTION_CANNOT_BE_UNDONE.')) {
        return;
    }
    
    keysData = keysData.filter(key => key.id !== keyId);
    saveDataToLocalStorage();
    loadAdminData();
    
    showNotification('KEY_DELETED_SUCCESSFULLY', 'success');
}

function startServerTime() {
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
        
        document.getElementById('server-time').textContent = `SYSTEM_TIME: ${timeString}`;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0,255,0,0.1)' : type === 'error' ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,255,0.1)'};
        border: 1px solid ${type === 'success' ? 'var(--terminal-green)' : type === 'error' ? 'var(--terminal-red)' : 'var(--terminal-cyan)'};
        color: var(--terminal-text);
        padding: 15px 20px;
        font-family: 'Share Tech Mono', monospace;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function saveDataToLocalStorage() {
    localStorage.setItem('brandsData', JSON.stringify(brandsData));
    localStorage.setItem('keysData', JSON.stringify(keysData));
}
