// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Admin authentication check
if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
}

let brandsData = [];
let keysData = [];

document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
    setupAdminEvents();
    startServerTime();
});

async function loadAdminData() {
    await updateStats();
    await loadAppsGrid();
    await loadFilters();
    await loadKeysTable();
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

async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('total-keys').textContent = data.stats.totalKeys;
            document.getElementById('available-keys').textContent = data.stats.availableKeys;
            document.getElementById('sold-keys').textContent = data.stats.soldKeys;
            document.getElementById('total-revenue').textContent = `₹${data.stats.revenue}`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('ERROR_LOADING_STATISTICS', 'error');
    }
}

async function loadAppsGrid() {
    const appsGrid = document.getElementById('apps-grid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const data = await response.json();
        
        if (data.success) {
            brandsData = data.brands;
            
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
            
            appsGrid.innerHTML = '';
            
            for (const brand of brandsData) {
                // Get available keys count for this brand
                const keysResponse = await fetch(`${API_BASE_URL}/api/keys/available/${brand.id}`);
                const keysData = await keysResponse.json();
                const availableCount = keysData.success ? keysData.count : 0;
                
                const appCard = document.createElement('div');
                appCard.className = 'app-card';
                
                appCard.innerHTML = `
                    <div class="app-name">${brand.name.toUpperCase()}</div>
                    <div class="app-description">${brand.description}</div>
                    <div class="app-stats">
                        <div style="color: var(--terminal-green); font-size: 0.8rem;">
                            KEYS_AVAILABLE: ${availableCount}
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
            }
            
            // Add event listeners to duration buttons
            document.querySelectorAll('.add-duration-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const appId = parseInt(this.getAttribute('data-app-id'));
                    openAddDurationModal(appId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading apps:', error);
        showNotification('ERROR_LOADING_APPLICATIONS', 'error');
    }
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
        const data = await response.json();
        
        if (data.success) {
            keysData = data.keys;
            
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
        }
    } catch (error) {
        console.error('Error loading keys:', error);
        showNotification('ERROR_LOADING_KEYS', 'error');
    }
}

// ... Rest of the admin.js functions remain similar but would need to be updated for API calls
// (addNewApp, addNewKey, addNewDuration, deleteKey would need to call your backend API)

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
