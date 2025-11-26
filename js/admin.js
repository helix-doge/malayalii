// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Global variables
let brandsData = [];
let keysData = [];

// Admin authentication check
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

    // Check session timeout (24 hours)
    const loginTime = localStorage.getItem('adminLoginTime');
    const currentTime = new Date().getTime();
    const hoursSinceLogin = (currentTime - new Date(loginTime).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin >= 24) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = 'admin-login.html';
        return;
    }

    console.log('🚀 Admin panel initializing...');
    initializeAdminPanel();
});

async function initializeAdminPanel() {
    try {
        await loadAdminData();
        setupAdminEvents();
        startServerTime();
        console.log('✅ Admin panel initialized successfully');
    } catch (error) {
        console.error('❌ Admin panel initialization failed:', error);
        showNotification('ADMIN_PANEL_LOADED_WITH_ISSUES', 'error');
    }
}

async function loadAdminData() {
    try {
        // Load all data in parallel for better performance
        await Promise.all([
            loadBrands(),
            updateStats(),
            loadAppsGrid(),
            loadFilters(),
            loadKeysTable()
        ]);
        console.log('✅ All admin data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading admin data:', error);
        showNotification('SOME_DATA_LOADING_FAILED', 'error');
    }
}

async function loadBrands() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            brandsData = data.brands || [];
            console.log(`✅ Loaded ${brandsData.length} brands`);
        } else {
            throw new Error(data.error || 'Failed to load brands');
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        // Use fallback data
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
        showNotification('USING_FALLBACK_BRANDS_DATA', 'info');
    }
}

function setupAdminEvents() {
    console.log('Setting up admin event listeners...');
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('CONFIRM_LOGOUT?')) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            window.location.href = 'admin-login.html';
        }
    });
    
    // Developer button
    document.getElementById('developer-btn').addEventListener('click', function() {
        window.location.href = 'developer.html';
    });
    
    // Add app button
    document.getElementById('add-app-btn').addEventListener('click', openAddAppModal);
    
    // Add key button
    document.getElementById('add-key-btn').addEventListener('click', openAddKeyModal);
    
    // Form submissions
    document.getElementById('app-form').addEventListener('submit', handleAddApp);
    document.getElementById('key-form').addEventListener('submit', handleAddKey);
    document.getElementById('duration-form').addEventListener('submit', handleAddDuration);
    
    // Search and filter events
    document.getElementById('key-search').addEventListener('input', debounce(loadKeysTable, 300));
    document.getElementById('app-filter').addEventListener('change', loadKeysTable);
    document.getElementById('status-filter').addEventListener('change', loadKeysTable);
    
    // Close modals
    document.querySelectorAll('.modal .close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    console.log('✅ Admin event listeners setup complete');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('total-keys').textContent = data.stats.totalKeys;
            document.getElementById('available-keys').textContent = data.stats.availableKeys;
            document.getElementById('sold-keys').textContent = data.stats.soldKeys;
            document.getElementById('total-revenue').textContent = `₹${data.stats.revenue}`;
            console.log('✅ Stats updated successfully');
        } else {
            throw new Error(data.error || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default stats
        document.getElementById('total-keys').textContent = '10';
        document.getElementById('available-keys').textContent = '8';
        document.getElementById('sold-keys').textContent = '2';
        document.getElementById('total-revenue').textContent = '₹0';
        showNotification('USING_DEFAULT_STATISTICS', 'info');
    }
}

async function loadAppsGrid() {
    const appsGrid = document.getElementById('apps-grid');
    
    try {
        if (!brandsData || brandsData.length === 0) {
            appsGrid.innerHTML = `
                <div class="app-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: var(--terminal-cyan); margin-bottom: 15px;">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <div style="color: var(--terminal-text); margin-bottom: 20px;">NO_APPLICATIONS_CONFIGURED</div>
                    <button id="add-first-app" class="hack-btn">
                        <i class="fas fa-plus"></i> ADD_FIRST_APPLICATION
                    </button>
                </div>
            `;
            
            document.getElementById('add-first-app').addEventListener('click', openAddAppModal);
            return;
        }
        
        appsGrid.innerHTML = '';
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            brandsData.forEach(brand => {
                const appCard = document.createElement('div');
                appCard.className = 'app-card';
                
                appCard.innerHTML = `
                    <div class="app-header">
                        <div class="app-name">${brand.name.toUpperCase()}</div>
                        <button class="hack-btn-sm delete-app-btn" data-app-id="${brand.id}" data-app-name="${brand.name}">
                            <i class="fas fa-trash"></i> DELETE
                        </button>
                    </div>
                    <div class="app-description">${brand.description || 'No description'}</div>
                    <div class="app-stats">
                        <div style="color: var(--terminal-green); font-size: 0.8rem;">
                            KEYS_AVAILABLE: <span class="keys-count" data-brand-id="${brand.id}">Loading...</span>
                        </div>
                    </div>
                    <div class="app-durations">
                        ${(brand.plans || []).map(plan => `
                            <div class="duration-item">
                                <span>${plan.name}</span>
                                <span>₹${plan.price}</span>
                                <button class="delete-duration-btn" data-app-id="${brand.id}" data-plan-name="${plan.name}">
                                    <i class="fas fa-times" style="color: var(--terminal-red); cursor: pointer;"></i>
                                </button>
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
            
            // Load keys count for each brand
            loadKeysCountForBrands();
            
            // Add event listeners
            setupAppGridEventListeners();
        });
        
    } catch (error) {
        console.error('Error loading apps grid:', error);
        showNotification('ERROR_LOADING_APPLICATIONS_GRID', 'error');
    }
}

// Load keys count for each brand
async function loadKeysCountForBrands() {
    brandsData.forEach(async (brand) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/keys/available/${brand.id}`);
            const data = await response.json();
            
            if (data.success) {
                const countElement = document.querySelector(`.keys-count[data-brand-id="${brand.id}"]`);
                if (countElement) {
                    countElement.textContent = data.count;
                }
            }
        } catch (error) {
            console.error(`Error loading keys count for brand ${brand.id}:`, error);
        }
    });
}

// Setup event listeners for app grid
function setupAppGridEventListeners() {
    // Add duration buttons
    document.querySelectorAll('.add-duration-btn').forEach(button => {
        button.addEventListener('click', function() {
            const appId = parseInt(this.getAttribute('data-app-id'));
            openAddDurationModal(appId);
        });
    });
    
    // Delete app buttons
    document.querySelectorAll('.delete-app-btn').forEach(button => {
        button.addEventListener('click', function() {
            const appId = parseInt(this.getAttribute('data-app-id'));
            const appName = this.getAttribute('data-app-name');
            deleteApplication(appId, appName);
        });
    });
    
    // Delete duration buttons
    document.querySelectorAll('.delete-duration-btn').forEach(button => {
        button.addEventListener('click', function() {
            const appId = parseInt(this.getAttribute('data-app-id'));
            const planName = this.getAttribute('data-plan-name');
            deleteDuration(appId, planName);
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

async function loadKeysTable() {
    const tableBody = document.getElementById('keys-table-body');
    const searchTerm = document.getElementById('key-search').value.toLowerCase();
    const appFilter = document.getElementById('app-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/keys`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            keysData = data.keys || [];
            
            let filteredKeys = keysData;
            
            // Apply filters
            if (searchTerm) {
                filteredKeys = filteredKeys.filter(key => 
                    key.key_value.toLowerCase().includes(searchTerm) ||
                    (key.order_id && key.order_id.toLowerCase().includes(searchTerm))
                );
            }
            
            if (appFilter) {
                filteredKeys = filteredKeys.filter(key => key.brand_id === parseInt(appFilter));
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
            
            requestAnimationFrame(() => {
                filteredKeys.forEach(key => {
                    const brandName = key.brands ? key.brands.name : 'UNKNOWN';
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>
                            <code style="color: var(--terminal-cyan); font-size: 0.8rem;">${key.key_value}</code>
                        </td>
                        <td>${brandName.toUpperCase()}</td>
                        <td>${key.plan}</td>
                        <td>
                            <span class="status-${key.status}">${key.status.toUpperCase()}</span>
                        </td>
                        <td>
                            ${key.order_id ? `<code style="font-size: 0.7rem;">${key.order_id}</code>` : '-'}
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
            });
            
            console.log(`✅ Loaded ${filteredKeys.length} keys`);
        } else {
            throw new Error(data.error || 'Failed to load keys');
        }
    } catch (error) {
        console.error('Error loading keys:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--terminal-red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    ERROR_LOADING_KEYS
                </td>
            </tr>
        `;
    }
}

// Modal functions
function openAddAppModal() {
    document.getElementById('add-app-modal').style.display = 'block';
    document.getElementById('app-form').reset();
    document.getElementById('app-name').focus();
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
    document.getElementById('key-app').focus();
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
    document.getElementById('duration-name').focus();
}

// NEW: Delete Application
async function deleteApplication(appId, appName) {
    if (!confirm(`CONFIRM_DELETE_APPLICATION?\n\nApplication: ${appName}\n\nTHIS_ACTION_CANNOT_BE_UNDONE.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/brands/${appId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete application');
        }
        
        showNotification('APPLICATION_DELETED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('DELETE_APPLICATION_FAILED: ' + error.message, 'error');
    }
}

// NEW: Delete Duration
async function deleteDuration(appId, planName) {
    if (!confirm(`CONFIRM_DELETE_DURATION?\n\nPlan: ${planName}\n\nTHIS_ACTION_CANNOT_BE_UNDONE.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/brands/${appId}/plans/${encodeURIComponent(planName)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete duration');
        }
        
        showNotification('DURATION_DELETED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error deleting duration:', error);
        showNotification('DELETE_DURATION_FAILED: ' + error.message, 'error');
    }
}

// Form handlers
async function handleAddApp(e) {
    e.preventDefault();
    
    const name = document.getElementById('app-name').value.trim();
    const description = document.getElementById('app-description').value.trim();
    
    if (!name) {
        showNotification('PLEASE_ENTER_APP_NAME', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/brands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                description: description || 'No description provided'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to add application');
        }
        
        document.getElementById('add-app-modal').style.display = 'none';
        showNotification('APPLICATION_ADDED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error adding app:', error);
        showNotification('ADD_APP_FAILED: ' + error.message, 'error');
    }
}

async function handleAddKey(e) {
    e.preventDefault();
    
    const appId = parseInt(document.getElementById('key-app').value);
    const duration = document.getElementById('key-duration').value;
    const keyCode = document.getElementById('key-code').value.trim();
    
    if (!appId || !duration || !keyCode) {
        showNotification('PLEASE_FILL_ALL_FIELDS', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brandId: appId,
                plan: duration,
                keyValue: keyCode
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to add key');
        }
        
        document.getElementById('add-key-modal').style.display = 'none';
        showNotification('KEY_ADDED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error adding key:', error);
        showNotification('ADD_KEY_FAILED: ' + error.message, 'error');
    }
}

async function handleAddDuration(e) {
    e.preventDefault();
    
    const appId = parseInt(document.getElementById('duration-app').value);
    const name = document.getElementById('duration-name').value.trim();
    const price = parseFloat(document.getElementById('duration-price').value);
    
    if (!appId || !name || !price || price < 0) {
        showNotification('PLEASE_FILL_ALL_FIELDS_CORRECTLY', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/brands/${appId}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                price: price
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to add duration');
        }
        
        document.getElementById('add-duration-modal').style.display = 'none';
        showNotification('DURATION_ADDED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error adding duration:', error);
        showNotification('ADD_DURATION_FAILED: ' + error.message, 'error');
    }
}

async function deleteKey(keyId) {
    if (!confirm('CONFIRM_KEY_DELETION?\nTHIS_ACTION_CANNOT_BE_UNDONE.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/keys/${keyId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete key');
        }
        
        showNotification('KEY_DELETED_SUCCESSFULLY', 'success');
        await loadAdminData(); // Reload all data
        
    } catch (error) {
        console.error('Error deleting key:', error);
        showNotification('DELETE_KEY_FAILED: ' + error.message, 'error');
    }
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
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
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
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .delete-app-btn {
        background: rgba(255, 0, 0, 0.1) !important;
        border-color: var(--terminal-red) !important;
        color: var(--terminal-red) !important;
    }
    
    .delete-app-btn:hover {
        background: rgba(255, 0, 0, 0.2) !important;
    }
    
    .duration-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(0, 255, 0, 0.1);
    }
    
    .duration-item:last-child {
        border-bottom: none;
    }
    
    .status-available {
        background: rgba(0, 255, 0, 0.1);
        color: var(--terminal-green);
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 0.8rem;
    }
    
    .status-sold {
        background: rgba(255, 0, 0, 0.1);
        color: var(--terminal-red);
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(notificationStyles);

// Make functions globally available
window.showNotification = showNotification;

console.log('🎉 Admin panel loaded successfully');
