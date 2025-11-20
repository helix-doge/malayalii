// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Global variables
let brandsData = [];
let keysData = [];
let couponsData = [];

// Admin authentication check
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

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
        showNotification('ADMIN_PANEL_INITIALIZATION_FAILED', 'error');
    }
}

async function loadAdminData() {
    await loadBrands();
    await updateStats();
    await loadAppsGrid();
    await loadFilters();
    await loadKeysTable();
    await loadCoupons();
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
        showNotification('ERROR_LOADING_BRANDS', 'error');
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
    
    // Add app button
    document.getElementById('add-app-btn').addEventListener('click', openAddAppModal);
    
    // Manage coupons button
    document.getElementById('manage-coupons-btn').addEventListener('click', openCouponsModal);
    
    // Add key button
    document.getElementById('add-key-btn').addEventListener('click', openAddKeyModal);
    
    // Form submissions
    document.getElementById('app-form').addEventListener('submit', handleAddApp);
    document.getElementById('key-form').addEventListener('submit', handleAddKey);
    document.getElementById('duration-form').addEventListener('submit', handleAddDuration);
    document.getElementById('edit-duration-form').addEventListener('submit', handleEditDuration);
    document.getElementById('add-coupon-btn').addEventListener('click', handleAddCoupon);
    
    // Delete duration button
    document.getElementById('delete-duration-btn').addEventListener('click', handleDeleteDuration);
    
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
        showNotification('ERROR_LOADING_STATISTICS', 'error');
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
        
        for (const brand of brandsData) {
            // Get available keys count for this brand
            let availableCount = 0;
            try {
                const keysResponse = await fetch(`${API_BASE_URL}/api/keys/available/${brand.id}`);
                if (keysResponse.ok) {
                    const keysData = await keysResponse.json();
                    availableCount = keysData.success ? keysData.count : 0;
                }
            } catch (error) {
                console.error(`Error loading key count for brand ${brand.id}:`, error);
            }
            
            const appCard = document.createElement('div');
            appCard.className = 'app-card';
            
            appCard.innerHTML = `
                <div class="app-name">${brand.name.toUpperCase()}</div>
                <div class="app-description">${brand.description || 'No description'}</div>
                <div class="app-stats">
                    <div style="color: var(--terminal-green); font-size: 0.8rem;">
                        KEYS_AVAILABLE: ${availableCount}
                    </div>
                </div>
                <div class="app-durations">
                    ${(brand.plans || []).map((plan, index) => `
                        <div class="duration-item">
                            <span>${plan.name}</span>
                            <span>₹${plan.price}</span>
                            <button class="edit-duration-btn" data-app-id="${brand.id}" data-index="${index}">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="app-actions">
                    <button class="hack-btn-sm add-duration-btn" data-app-id="${brand.id}">
                        <i class="fas fa-plus"></i> ADD_DURATION
                    </button>
                    <button class="hack-btn-sm delete-app-btn" data-app-id="${brand.id}">
                        <i class="fas fa-trash"></i> DELETE_APP
                    </button>
                </div>
            `;
            
            appsGrid.appendChild(appCard);
        }
        
        // Add event listeners
        document.querySelectorAll('.add-duration-btn').forEach(button => {
            button.addEventListener('click', function() {
                const appId = parseInt(this.getAttribute('data-app-id'));
                openAddDurationModal(appId);
            });
        });
        
        document.querySelectorAll('.edit-duration-btn').forEach(button => {
            button.addEventListener('click', function() {
                const appId = parseInt(this.getAttribute('data-app-id'));
                const index = parseInt(this.getAttribute('data-index'));
                openEditDurationModal(appId, index);
            });
        });
        
        document.querySelectorAll('.delete-app-btn').forEach(button => {
            button.addEventListener('click', function() {
                const appId = parseInt(this.getAttribute('data-app-id'));
                deleteApp(appId);
            });
        });
        
    } catch (error) {
        console.error('Error loading apps grid:', error);
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

function openEditDurationModal(appId, index) {
    const brand = brandsData.find(b => b.id === appId);
    if (!brand || !brand.plans || !brand.plans[index]) {
        showNotification('DURATION_NOT_FOUND', 'error');
        return;
    }
    
    const plan = brand.plans[index];
    
    document.getElementById('edit-duration-app-id').value = appId;
    document.getElementById('edit-duration-index').value = index;
    document.getElementById('edit-duration-name').value = plan.name;
    document.getElementById('edit-duration-price').value = plan.price;
    
    document.getElementById('edit-duration-modal').style.display = 'block';
}

function openCouponsModal() {
    document.getElementById('coupons-modal').style.display = 'block';
    document.getElementById('coupon-code').focus();
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
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('add-app-modal').style.display = 'none';
            showNotification('APPLICATION_ADDED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to add application');
        }
    } catch (error) {
        console.error('Error adding app:', error);
        showNotification('NETWORK_ERROR: CANNOT_ADD_APPLICATION', 'error');
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
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('add-key-modal').style.display = 'none';
            showNotification('KEY_ADDED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to add key');
        }
    } catch (error) {
        console.error('Error adding key:', error);
        showNotification('NETWORK_ERROR: CANNOT_ADD_KEY', 'error');
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
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('add-duration-modal').style.display = 'none';
            showNotification('DURATION_ADDED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to add duration');
        }
    } catch (error) {
        console.error('Error adding duration:', error);
        showNotification('NETWORK_ERROR: CANNOT_ADD_DURATION', 'error');
    }
}

async function handleEditDuration(e) {
    e.preventDefault();
    
    const appId = parseInt(document.getElementById('edit-duration-app-id').value);
    const index = parseInt(document.getElementById('edit-duration-index').value);
    const name = document.getElementById('edit-duration-name').value.trim();
    const price = parseFloat(document.getElementById('edit-duration-price').value);
    
    if (!appId || !name || !price || price < 0) {
        showNotification('PLEASE_FILL_ALL_FIELDS_CORRECTLY', 'error');
        return;
    }
    
    try {
        const brand = brandsData.find(b => b.id === appId);
        if (!brand) {
            showNotification('APPLICATION_NOT_FOUND', 'error');
            return;
        }
        
        // Update the plan locally first
        const updatedPlans = [...brand.plans];
        updatedPlans[index] = { name: name, price: price };
        
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
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('edit-duration-modal').style.display = 'none';
            showNotification('DURATION_UPDATED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to update duration');
        }
    } catch (error) {
        console.error('Error updating duration:', error);
        showNotification('NETWORK_ERROR: CANNOT_UPDATE_DURATION', 'error');
    }
}

async function handleDeleteDuration() {
    const appId = parseInt(document.getElementById('edit-duration-app-id').value);
    const index = parseInt(document.getElementById('edit-duration-index').value);
    
    if (!appId || isNaN(index)) {
        showNotification('INVALID_DURATION_SELECTION', 'error');
        return;
    }
    
    if (!confirm('CONFIRM_DURATION_DELETION?\nTHIS_ACTION_CANNOT_BE_UNDONE.')) {
        return;
    }
    
    try {
        const brand = brandsData.find(b => b.id === appId);
        if (!brand || !brand.plans || !brand.plans[index]) {
            showNotification('DURATION_NOT_FOUND', 'error');
            return;
        }
        
        // Remove the plan from the array
        const updatedPlans = brand.plans.filter((_, i) => i !== index);
        
        // Update the brand with the new plans array
        const response = await fetch(`${API_BASE_URL}/api/admin/brands/${appId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plans: updatedPlans
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('edit-duration-modal').style.display = 'none';
            showNotification('DURATION_DELETED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to delete duration');
        }
    } catch (error) {
        console.error('Error deleting duration:', error);
        showNotification('NETWORK_ERROR: CANNOT_DELETE_DURATION', 'error');
    }
}

async function handleAddCoupon() {
    const code = document.getElementById('coupon-code').value.trim();
    const discount = parseInt(document.getElementById('coupon-discount').value);
    const validity = document.getElementById('coupon-validity').value;
    
    if (!code || !discount || discount < 1 || discount > 100) {
        showNotification('PLEASE_ENTER_VALID_COUPON_DETAILS', 'error');
        return;
    }
    
    try {
        // For now, we'll store coupons in localStorage since we don't have a backend endpoint
        const coupon = {
            id: Date.now(),
            code: code.toUpperCase(),
            discount: discount,
            validity: validity,
            created_at: new Date().toISOString(),
            status: 'active'
        };
        
        couponsData.push(coupon);
        localStorage.setItem('admin_coupons', JSON.stringify(couponsData));
        
        document.getElementById('coupon-code').value = '';
        document.getElementById('coupon-discount').value = '';
        document.getElementById('coupon-validity').value = '';
        
        showNotification('COUPON_ADDED_SUCCESSFULLY', 'success');
        await loadCoupons();
        
    } catch (error) {
        console.error('Error adding coupon:', error);
        showNotification('FAILED_TO_ADD_COUPON', 'error');
    }
}

async function loadCoupons() {
    try {
        // Load coupons from localStorage
        const storedCoupons = localStorage.getItem('admin_coupons');
        couponsData = storedCoupons ? JSON.parse(storedCoupons) : [];
        
        const couponsList = document.getElementById('coupons-list');
        
        if (couponsData.length === 0) {
            couponsList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--terminal-cyan);">
                    <i class="fas fa-tag" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    NO_COUPONS_CONFIGURED
                </div>
            `;
            return;
        }
        
        couponsList.innerHTML = `
            <h3 style="color: var(--terminal-cyan); margin-bottom: 15px;">ACTIVE_COUPONS (${couponsData.length})</h3>
            <div class="coupons-grid">
                ${couponsData.map(coupon => `
                    <div class="coupon-item" style="background: rgba(0,255,0,0.1); border: 1px solid var(--terminal-green); padding: 15px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div>
                                <strong style="color: var(--terminal-cyan);">${coupon.code}</strong>
                                <div style="font-size: 0.8rem; color: var(--terminal-text);">
                                    ${coupon.discount}% OFF • Valid until: ${coupon.validity || 'No expiry'}
                                </div>
                            </div>
                            <button class="delete-coupon-btn hack-btn-sm" data-coupon-id="${coupon.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners to delete coupon buttons
        document.querySelectorAll('.delete-coupon-btn').forEach(button => {
            button.addEventListener('click', function() {
                const couponId = parseInt(this.getAttribute('data-coupon-id'));
                deleteCoupon(couponId);
            });
        });
        
    } catch (error) {
        console.error('Error loading coupons:', error);
    }
}

async function deleteCoupon(couponId) {
    if (!confirm('CONFIRM_COUPON_DELETION?')) {
        return;
    }
    
    try {
        couponsData = couponsData.filter(coupon => coupon.id !== couponId);
        localStorage.setItem('admin_coupons', JSON.stringify(couponsData));
        
        showNotification('COUPON_DELETED_SUCCESSFULLY', 'success');
        await loadCoupons();
        
    } catch (error) {
        console.error('Error deleting coupon:', error);
        showNotification('FAILED_TO_DELETE_COUPON', 'error');
    }
}

async function deleteApp(appId) {
    if (!confirm('CONFIRM_APPLICATION_DELETION?\nTHIS_WILL_ALSO_DELETE_ALL_ASSOCIATED_KEYS.\nTHIS_ACTION_CANNOT_BE_UNDONE.')) {
        return;
    }
    
    try {
        // First, check if there are any keys associated with this app
        const keysResponse = await fetch(`${API_BASE_URL}/api/admin/keys`);
        if (keysResponse.ok) {
            const keysData = await keysResponse.json();
            const appKeys = keysData.keys ? keysData.keys.filter(key => key.brand_id === appId) : [];
            
            if (appKeys.length > 0) {
                if (!confirm(`WARNING: This application has ${appKeys.length} keys associated with it. Deleting the application will also delete all these keys. Continue?`)) {
                    return;
                }
            }
        }
        
        // Delete the application
        const response = await fetch(`${API_BASE_URL}/api/admin/brands/${appId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('APPLICATION_DELETED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to delete application');
        }
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('NETWORK_ERROR: CANNOT_DELETE_APPLICATION', 'error');
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
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('KEY_DELETED_SUCCESSFULLY', 'success');
            await loadAdminData(); // Reload all data
        } else {
            throw new Error(data.error || 'Failed to delete key');
        }
    } catch (error) {
        console.error('Error deleting key:', error);
        showNotification('NETWORK_ERROR: CANNOT_DELETE_KEY', 'error');
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

// Utility function to copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Make functions globally available
window.showNotification = showNotification;

console.log('🎉 Admin panel loaded successfully');
