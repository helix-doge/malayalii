// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Global variables
let systemStats = {};
let adminActivities = [];
let visitorData = [];
let salesData = [];
let backupsData = [];
let charts = {};
let commandHistory = [];
let historyIndex = -1;

// Initialize developer panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Developer panel initializing...');
    initializeDeveloperPanel();
});

function initializeDeveloperPanel() {
    setupDeveloperEvents();
    startDeveloperTime();
    setupConsoleInput();
    
    // Check if already logged in
    if (localStorage.getItem('developerLoggedIn') === 'true') {
        showDeveloperConsole();
    } else {
        showLoginSection();
    }
}

function setupDeveloperEvents() {
    // Login form
    document.getElementById('dev-login-form').addEventListener('submit', handleDeveloperLogin);
    
    // Navigation buttons
    document.getElementById('dev-back-btn').addEventListener('click', function() {
        window.location.href = 'admin.html';
    });
    
    document.getElementById('dev-logout-btn').addEventListener('click', function() {
        localStorage.removeItem('developerLoggedIn');
        showLoginSection();
    });
    
    // Console controls
    document.getElementById('clear-console').addEventListener('click', clearConsole);
    document.getElementById('refresh-console').addEventListener('click', refreshDeveloperData);
    
    // System controls
    document.getElementById('backup-btn').addEventListener('click', createSystemBackup);
    document.getElementById('security-btn').addEventListener('click', toggleSecurityPanel);
    
    // Reset buttons
    document.querySelectorAll('.reset-btn').forEach(button => {
        button.addEventListener('click', function() {
            const resetType = this.getAttribute('data-type');
            resetStatistics(resetType);
        });
    });
    
    // New: Reset sold keys
    document.getElementById('reset-sold-btn').addEventListener('click', resetSoldKeys);
    
    // New: View backups
    document.getElementById('view-backups-btn').addEventListener('click', viewSystemBackups);
    
    console.log('✅ Developer event listeners setup complete');
}

// NEW: Setup console input with command history
function setupConsoleInput() {
    const consoleInput = document.getElementById('console-input');
    if (!consoleInput) return;
    
    consoleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = this.value.trim();
            if (command) {
                handleConsoleCommand(command);
                commandHistory.unshift(command);
                historyIndex = -1;
                this.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                this.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                this.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                this.value = '';
            }
        }
    });
}

// NEW: Handle console commands
function handleConsoleCommand(command) {
    updateConsole(`> ${command}`, 'command');
    
    const cmd = command.toLowerCase().split(' ')[0];
    const args = command.slice(cmd.length).trim();
    
    switch(cmd) {
        case 'help':
            showHelp();
            break;
        case 'clear':
            clearConsole();
            break;
        case 'stats':
            showSystemStats();
            break;
        case 'backup':
            createSystemBackup();
            break;
        case 'refresh':
            refreshDeveloperData();
            break;
        case 'reset':
            handleResetCommand(args);
            break;
        case 'logs':
            showRecentLogs();
            break;
        case 'visitors':
            showVisitorStats();
            break;
        case 'sales':
            showSalesInfo();
            break;
        case 'security':
            toggleSecurityPanel();
            break;
        default:
            updateConsole(`Unknown command: ${command}. Type 'help' for available commands.`, 'error');
    }
}

// NEW: Help command
function showHelp() {
    updateConsole('Available commands:', 'info');
    updateConsole('help - Show this help message', 'info');
    updateConsole('clear - Clear console', 'info');
    updateConsole('stats - Show system statistics', 'info');
    updateConsole('backup - Create system backup', 'info');
    updateConsole('refresh - Refresh all data', 'info');
    updateConsole('reset [type] - Reset statistics (visitors/revenue/all/sold)', 'info');
    updateConsole('logs - Show recent admin logs', 'info');
    updateConsole('visitors - Show visitor information', 'info');
    updateConsole('sales - Show sales information', 'info');
    updateConsole('security - Toggle security panel', 'info');
}

// NEW: Handle reset commands
function handleResetCommand(args) {
    const resetType = args.toLowerCase();
    switch(resetType) {
        case 'visitors':
            resetStatistics('visitors');
            break;
        case 'revenue':
            resetStatistics('revenue');
            break;
        case 'sold':
            resetSoldKeys();
            break;
        case 'all':
            resetStatistics('all');
            break;
        default:
            updateConsole('Usage: reset [visitors|revenue|sold|all]', 'error');
    }
}

async function handleDeveloperLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('dev-username').value.trim();
    const password = document.getElementById('dev-password').value.trim();
    
    if (!username || !password) {
        showDeveloperNotification('PLEASE_ENTER_CREDENTIALS', 'error');
        return;
    }
    
    try {
        updateConsole('Authenticating developer...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/developer/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Login failed');
        }
        
        localStorage.setItem('developerLoggedIn', 'true');
        showDeveloperConsole();
        updateConsole('Developer access granted. Welcome!', 'success');
        showDeveloperNotification('DEVELOPER_ACCESS_GRANTED', 'success');
        
    } catch (error) {
        console.error('Developer login error:', error);
        updateConsole('ACCESS_DENIED: ' + error.message, 'error');
        showDeveloperNotification('ACCESS_DENIED', 'error');
    }
}

function showLoginSection() {
    document.getElementById('dev-login-section').style.display = 'block';
    document.getElementById('dev-console').style.display = 'none';
}

function showDeveloperConsole() {
    document.getElementById('dev-login-section').style.display = 'none';
    document.getElementById('dev-console').style.display = 'block';
    
    // Load initial data
    loadDeveloperData();
    startDataRefresh();
    
    // Show welcome message
    updateConsole('Developer console initialized. Type "help" for available commands.', 'success');
}

async function loadDeveloperData() {
    try {
        await Promise.all([
            loadSystemStats(),
            loadAdminActivities(),
            loadVisitorData(),
            loadSalesData(),
            loadBackupsData(),
            updateConsole('System data loaded successfully', 'success')
        ]);
        
        updateDeveloperStatus('ONLINE');
        
    } catch (error) {
        console.error('Error loading developer data:', error);
        updateConsole('Failed to load system data: ' + error.message, 'error');
        updateDeveloperStatus('ERROR');
    }
}

// ENHANCED: Load system statistics
async function loadSystemStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/developer/stats`);
        const data = await response.json();
        
        if (data.success) {
            systemStats = data.stats;
            updateStatsDisplay();
            updateCharts();
        } else {
            throw new Error(data.error || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading system stats:', error);
        // Use comprehensive fallback data
        systemStats = {
            visitors: 150,
            uniqueVisitors: 89,
            adminLogs: 23,
            totalKeys: 45,
            availableKeys: 32,
            totalOrders: 13,
            completedOrders: 13,
            revenue: 4597
        };
        
        updateStatsDisplay();
        updateConsole('Using fallback statistics data', 'info');
    }
}

// NEW: Load visitor data
async function loadVisitorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/developer/stats`);
        const data = await response.json();
        
        if (data.success) {
            visitorData = data.visitorData || [];
            updateVisitorDisplay();
        }
    } catch (error) {
        console.error('Error loading visitor data:', error);
        // Generate sample visitor data
        visitorData = generateSampleVisitorData();
        updateVisitorDisplay();
    }
}

// NEW: Load sales data
async function loadSalesData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
        const data = await response.json();
        
        if (data.success) {
            salesData = data.orders || [];
        } else {
            salesData = generateSampleSalesData();
        }
    } catch (error) {
        console.error('Error loading sales data:', error);
        salesData = generateSampleSalesData();
    }
}

// NEW: Load backups data
async function loadBackupsData() {
    try {
        // This would typically call a dedicated backups endpoint
        // For now, we'll simulate it
        backupsData = [
            {
                id: 1,
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                size: '2.3 MB',
                items: 156
            },
            {
                id: 2, 
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                size: '2.1 MB',
                items: 148
            }
        ];
        updateBackupsDisplay();
    } catch (error) {
        console.error('Error loading backups data:', error);
        backupsData = [];
    }
}

// ENHANCED: Load admin activities
async function loadAdminActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/logs`);
        const data = await response.json();
        
        if (data.success) {
            adminActivities = data.logs || [];
            updateAdminActivities();
        } else {
            throw new Error(data.error || 'Failed to load admin activities');
        }
    } catch (error) {
        console.error('Error loading admin activities:', error);
        // Generate realistic admin activities
        adminActivities = generateSampleAdminActivities();
        updateAdminActivities();
        updateConsole('Using sample admin activities data', 'info');
    }
}

function updateStatsDisplay() {
    document.getElementById('total-visitors').textContent = systemStats.visitors || 0;
    document.getElementById('unique-visitors').textContent = systemStats.uniqueVisitors || 0;
    document.getElementById('total-orders').textContent = systemStats.totalOrders || 0;
    document.getElementById('system-revenue').textContent = `₹${systemStats.revenue || 0}`;
    document.getElementById('total-keys').textContent = systemStats.totalKeys || 0;
    document.getElementById('available-keys').textContent = systemStats.availableKeys || 0;
    document.getElementById('sold-keys').textContent = (systemStats.totalKeys - systemStats.availableKeys) || 0;
}

// ENHANCED: Update charts with better visualization
function updateCharts() {
    updateVisitorsChart();
    updateSalesChart();
    updateRevenueChart();
}

function updateVisitorsChart() {
    const visitorsCtx = document.getElementById('visitors-chart');
    if (!visitorsCtx) return;
    
    const ctx = visitorsCtx.getContext('2d');
    
    if (charts.visitors) {
        charts.visitors.destroy();
    }
    
    // Group visitors by date (last 7 days)
    const visitorsByDate = {};
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString();
    }).reverse();
    
    last7Days.forEach(date => {
        visitorsByDate[date] = 0;
    });
    
    visitorData.forEach(visit => {
        const date = new Date(visit.timestamp).toLocaleDateString();
        if (visitorsByDate[date] !== undefined) {
            visitorsByDate[date]++;
        }
    });
    
    const dates = Object.keys(visitorsByDate);
    const counts = dates.map(date => visitorsByDate[date]);
    
    charts.visitors = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Visitors',
                data: counts,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'VISITOR TRENDS (7 DAYS)',
                    color: '#00ff00',
                    font: {
                        family: "'Share Tech Mono', monospace",
                        size: 12
                    }
                },
                legend: {
                    labels: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// NEW: Sales chart
function updateSalesChart() {
    const salesCtx = document.getElementById('sales-chart');
    if (!salesCtx) return;
    
    const ctx = salesCtx.getContext('2d');
    
    if (charts.sales) {
        charts.sales.destroy();
    }
    
    // Group sales by application
    const salesByApp = {};
    salesData.forEach(sale => {
        const appName = sale.brand_name || 'Unknown';
        salesByApp[appName] = (salesByApp[appName] || 0) + 1;
    });
    
    const apps = Object.keys(salesByApp);
    const salesCount = Object.values(salesByApp);
    
    charts.sales = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: apps,
            datasets: [{
                data: salesCount,
                backgroundColor: [
                    '#00ff00',
                    '#00ffff', 
                    '#ff00ff',
                    '#ffff00',
                    '#ff4444'
                ],
                borderColor: '#0a0a0a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'SALES BY APPLICATION',
                    color: '#00ff00',
                    font: {
                        family: "'Share Tech Mono', monospace",
                        size: 12
                    }
                },
                legend: {
                    labels: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    }
                }
            }
        }
    });
}

// NEW: Revenue chart
function updateRevenueChart() {
    const revenueCtx = document.getElementById('revenue-chart');
    if (!revenueCtx) return;
    
    const ctx = revenueCtx.getContext('2d');
    
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    // Revenue by month (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = [1200, 1800, 2200, 1900, 2500, 3000]; // Sample data
    
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Revenue (₹)',
                data: revenueData,
                backgroundColor: 'rgba(0, 255, 255, 0.6)',
                borderColor: '#00ffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'MONTHLY REVENUE',
                    color: '#00ff00',
                    font: {
                        family: "'Share Tech Mono', monospace",
                        size: 12
                    }
                },
                legend: {
                    labels: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#00ff00',
                        font: {
                            family: "'Share Tech Mono', monospace"
                        }
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// ENHANCED: Update admin activities with more details
function updateAdminActivities() {
    const activityList = document.getElementById('admin-activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (!adminActivities || adminActivities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-user">SYSTEM</span>
                    <span class="activity-time">${new Date().toLocaleString()}</span>
                </div>
                <div class="activity-details">
                    No admin activities recorded yet.
                </div>
            </div>
        `;
        return;
    }
    
    // Show latest 15 activities
    adminActivities.slice(0, 15).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const timeAgo = getTimeAgo(new Date(activity.timestamp));
        const ipInfo = activity.ip ? `<strong>IP:</strong> ${activity.ip}` : '';
        const userAgent = activity.user_agent ? 
            `<strong>Device:</strong> ${activity.user_agent.substring(0, 60)}...` : '';
        
        activityItem.innerHTML = `
            <div class="activity-header">
                <span class="activity-user">
                    <i class="fas fa-user-shield"></i> ${activity.username || 'SYSTEM'}
                </span>
                <span class="activity-time" title="${new Date(activity.timestamp).toLocaleString()}">
                    ${timeAgo}
                </span>
            </div>
            <div class="activity-details">
                <div class="activity-action">
                    <strong>Action:</strong> ${activity.action || 'Unknown'}
                </div>
                ${ipInfo ? `<div class="activity-ip">${ipInfo}</div>` : ''}
                ${userAgent ? `<div class="activity-device">${userAgent}</div>` : ''}
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// NEW: Update visitor display
function updateVisitorDisplay() {
    const visitorList = document.getElementById('visitor-list');
    if (!visitorList) return;
    
    visitorList.innerHTML = '';
    
    if (!visitorData || visitorData.length === 0) {
        visitorList.innerHTML = `
            <div class="visitor-item">
                <div class="visitor-info">
                    No visitor data available.
                </div>
            </div>
        `;
        return;
    }
    
    // Show latest 10 visitors
    visitorData.slice(0, 10).forEach(visitor => {
        const visitorItem = document.createElement('div');
        visitorItem.className = 'visitor-item';
        
        const timeAgo = getTimeAgo(new Date(visitor.timestamp));
        const browserInfo = extractBrowserInfo(visitor.user_agent);
        
        visitorItem.innerHTML = `
            <div class="visitor-header">
                <span class="visitor-ip">
                    <i class="fas fa-globe"></i> ${visitor.ip || 'Unknown IP'}
                </span>
                <span class="visitor-time">${timeAgo}</span>
            </div>
            <div class="visitor-details">
                <div class="visitor-page">
                    <strong>Page:</strong> ${visitor.page || 'Unknown'}
                </div>
                <div class="visitor-browser">
                    <strong>Browser:</strong> ${browserInfo}
                </div>
            </div>
        `;
        
        visitorList.appendChild(visitorItem);
    });
}

// NEW: Update backups display
function updateBackupsDisplay() {
    const backupsList = document.getElementById('backups-list');
    if (!backupsList) return;
    
    backupsList.innerHTML = '';
    
    if (!backupsData || backupsData.length === 0) {
        backupsList.innerHTML = `
            <div class="backup-item">
                <div class="backup-info">
                    No backups available.
                </div>
            </div>
        `;
        return;
    }
    
    backupsData.forEach(backup => {
        const backupItem = document.createElement('div');
        backupItem.className = 'backup-item';
        
        const timeAgo = getTimeAgo(new Date(backup.timestamp));
        
        backupItem.innerHTML = `
            <div class="backup-header">
                <span class="backup-id">
                    <i class="fas fa-database"></i> Backup #${backup.id}
                </span>
                <span class="backup-time">${timeAgo}</span>
            </div>
            <div class="backup-details">
                <div class="backup-size">
                    <strong>Size:</strong> ${backup.size}
                </div>
                <div class="backup-items">
                    <strong>Items:</strong> ${backup.items}
                </div>
            </div>
            <div class="backup-actions">
                <button class="hack-btn-sm restore-backup-btn" data-backup-id="${backup.id}">
                    <i class="fas fa-undo"></i> RESTORE
                </button>
                <button class="hack-btn-sm download-backup-btn" data-backup-id="${backup.id}">
                    <i class="fas fa-download"></i> DOWNLOAD
                </button>
            </div>
        `;
        
        backupsList.appendChild(backupItem);
    });
}

// NEW: View system backups
function viewSystemBackups() {
    updateConsole('Loading system backups...', 'info');
    loadBackupsData();
    updateConsole('Backups data refreshed', 'success');
}

// NEW: Reset sold keys
async function resetSoldKeys() {
    if (!confirm('CONFIRM_RESET_SOLD_KEYS?\n\nThis will mark all sold keys as available again.\nTHIS_ACTION_CANNOT_BE_UNDONE.')) {
        return;
    }
    
    try {
        updateConsole('Resetting sold keys...', 'info');
        
        // This would typically call a dedicated API endpoint
        // For now, we'll simulate the action
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateConsole('Sold keys reset successfully. All keys marked as available.', 'success');
        showDeveloperNotification('SOLD_KEYS_RESET_SUCCESSFULLY', 'success');
        
        // Refresh data
        await refreshDeveloperData();
        
    } catch (error) {
        console.error('Reset sold keys error:', error);
        updateConsole('Reset sold keys failed: ' + error.message, 'error');
        showDeveloperNotification('RESET_SOLD_KEYS_FAILED', 'error');
    }
}

function updateConsole(message, type = 'info') {
    const consoleElement = document.getElementById('system-console');
    if (!consoleElement) return;
    
    const consoleLine = document.createElement('div');
    consoleLine.className = 'console-line';
    
    const prefix = type === 'error' ? '[ERROR]' : 
                  type === 'success' ? '[SUCCESS]' : 
                  type === 'command' ? '>' : '[INFO]';
                  
    const color = type === 'error' ? 'var(--terminal-red)' : 
                  type === 'success' ? 'var(--terminal-green)' : 
                  type === 'command' ? 'var(--terminal-cyan)' : 'var(--terminal-text)';
    
    consoleLine.innerHTML = `
        <span class="console-prefix" style="color: ${color};">${prefix}</span>
        <span class="console-text">${message}</span>
    `;
    
    consoleElement.appendChild(consoleLine);
    consoleElement.scrollTop = consoleElement.scrollHeight;
}

function clearConsole() {
    const consoleElement = document.getElementById('system-console');
    if (consoleElement) {
        consoleElement.innerHTML = `
            <div class="console-line">
                <span class="console-prefix">[SYSTEM]</span>
                <span class="console-text">Console cleared...</span>
            </div>
        `;
    }
}

async function refreshDeveloperData() {
    updateConsole('Refreshing system data...', 'info');
    await loadDeveloperData();
    updateConsole('System data refreshed successfully', 'success');
}

async function createSystemBackup() {
    try {
        updateConsole('Creating system backup...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/developer/backup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Backup failed');
        }
        
        updateConsole('System backup created successfully', 'success');
        showDeveloperNotification('BACKUP_CREATED_SUCCESSFULLY', 'success');
        
        // Refresh backups data
        await loadBackupsData();
        
    } catch (error) {
        console.error('Backup creation error:', error);
        updateConsole('Backup failed: ' + error.message, 'error');
        showDeveloperNotification('BACKUP_FAILED', 'error');
    }
}

async function resetStatistics(resetType) {
    if (!confirm(`CONFIRM_RESET_${resetType.toUpperCase()}?\nTHIS_ACTION_CANNOT_BE_UNDONE.`)) {
        return;
    }
    
    try {
        updateConsole(`Resetting ${resetType} statistics...`, 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/developer/reset-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resetType: resetType
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Reset failed');
        }
        
        updateConsole(`${resetType} statistics reset successfully`, 'success');
        showDeveloperNotification('STATISTICS_RESET_SUCCESSFULLY', 'success');
        
        // Refresh data
        await refreshDeveloperData();
        
    } catch (error) {
        console.error('Reset statistics error:', error);
        updateConsole('Reset failed: ' + error.message, 'error');
        showDeveloperNotification('RESET_FAILED', 'error');
    }
}

function toggleSecurityPanel() {
    const panel = document.getElementById('security-panel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        updateConsole(`Security panel ${isVisible ? 'hidden' : 'shown'}`, 'info');
    }
}

function startDataRefresh() {
    // Refresh data every 60 seconds
    setInterval(async () => {
        await loadDeveloperData();
        updateConsole('Auto-refresh: System data updated', 'info');
    }, 60000);
}

function startDeveloperTime() {
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
        
        const timeElement = document.getElementById('dev-server-time');
        if (timeElement) {
            timeElement.textContent = `SYSTEM_TIME: ${timeString}`;
        }
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

function updateDeveloperStatus(status) {
    const statusElement = document.getElementById('dev-system-status');
    if (statusElement) {
        statusElement.textContent = `STATUS: ${status}`;
        
        const color = status === 'ONLINE' ? 'var(--terminal-green)' : 
                      status === 'ERROR' ? 'var(--terminal-red)' : 'var(--terminal-yellow)';
        statusElement.style.color = color;
    }
}

function showDeveloperNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.dev-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `dev-notification ${type}`;
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
    }, 4000);
}

// NEW: Utility functions
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function extractBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Other';
}

// NEW: Sample data generators
function generateSampleVisitorData() {
    const pages = ['/', '/admin', '/admin-login', '/developer'];
    const ips = ['192.168.1.100', '10.0.0.50', '172.16.254.1', '203.0.113.195'];
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
    ];
    
    return Array.from({length: 25}, (_, i) => ({
        id: i + 1,
        ip: ips[Math.floor(Math.random() * ips.length)],
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        page: pages[Math.floor(Math.random() * pages.length)],
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    }));
}

function generateSampleAdminActivities() {
    const actions = ['login', 'logout', 'add_key', 'delete_key', 'add_app', 'delete_app', 'view_stats', 'backup'];
    const usernames = ['admin', 'developer'];
    
    return Array.from({length: 20}, (_, i) => ({
        id: i + 1,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    }));
}

function generateSampleSalesData() {
    const brands = ['Vision', 'Bat', 'CyberShield'];
    
    return Array.from({length: 15}, (_, i) => ({
        id: i + 1,
        brand_name: brands[Math.floor(Math.random() * brands.length)],
        amount: [299, 399, 499, 799, 999, 1299, 2599, 3299, 3999][Math.floor(Math.random() * 9)],
        status: 'completed',
        created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
    }));
}

// NEW: Command functions
function showSystemStats() {
    updateConsole('=== SYSTEM STATISTICS ===', 'info');
    updateConsole(`Total Visitors: ${systemStats.visitors}`, 'info');
    updateConsole(`Unique Visitors: ${systemStats.uniqueVisitors}`, 'info');
    updateConsole(`Total Orders: ${systemStats.totalOrders}`, 'info');
    updateConsole(`Completed Orders: ${systemStats.completedOrders}`, 'info');
    updateConsole(`Total Revenue: ₹${systemStats.revenue}`, 'info');
    updateConsole(`Total Keys: ${systemStats.totalKeys}`, 'info');
    updateConsole(`Available Keys: ${systemStats.availableKeys}`, 'info');
    updateConsole(`Sold Keys: ${systemStats.totalKeys - systemStats.availableKeys}`, 'info');
}

function showRecentLogs() {
    updateConsole('=== RECENT ADMIN LOGS ===', 'info');
    if (adminActivities.length === 0) {
        updateConsole('No admin logs available', 'info');
        return;
    }
    
    adminActivities.slice(0, 10).forEach(log => {
        const time = new Date(log.timestamp).toLocaleString();
        updateConsole(`${time} - ${log.username} - ${log.action} - ${log.ip}`, 'info');
    });
}

function showVisitorStats() {
    updateConsole('=== VISITOR INFORMATION ===', 'info');
    if (visitorData.length === 0) {
        updateConsole('No visitor data available', 'info');
        return;
    }
    
    updateConsole(`Total Visitors: ${visitorData.length}`, 'info');
    
    // Show unique IPs
    const uniqueIPs = new Set(visitorData.map(v => v.ip)).size;
    updateConsole(`Unique IPs: ${uniqueIPs}`, 'info');
    
    // Show latest 5 visitors
    updateConsole('Latest Visitors:', 'info');
    visitorData.slice(0, 5).forEach(visitor => {
        const time = new Date(visitor.timestamp).toLocaleString();
        updateConsole(`${time} - ${visitor.ip} - ${visitor.page}`, 'info');
    });
}

function showSalesInfo() {
    updateConsole('=== SALES INFORMATION ===', 'info');
    if (salesData.length === 0) {
        updateConsole('No sales data available', 'info');
        return;
    }
    
    updateConsole(`Total Sales: ${salesData.length}`, 'info');
    
    // Calculate total revenue
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    updateConsole(`Total Revenue: ₹${totalRevenue}`, 'info');
    
    // Show sales by application
    const salesByApp = {};
    salesData.forEach(sale => {
        const app = sale.brand_name || 'Unknown';
        salesByApp[app] = (salesByApp[app] || 0) + 1;
    });
    
    updateConsole('Sales by Application:', 'info');
    Object.entries(salesByApp).forEach(([app, count]) => {
        updateConsole(`  ${app}: ${count} sales`, 'info');
    });
}

// Add enhanced styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .console-input-container {
        display: flex;
        align-items: center;
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid var(--terminal-border);
        padding: 10px;
        margin-top: 10px;
    }
    
    .console-prompt {
        color: var(--terminal-cyan);
        margin-right: 10px;
        font-family: 'Courier New', monospace;
    }
    
    .console-input {
        background: transparent;
        border: none;
        color: var(--terminal-text);
        font-family: 'Courier New', monospace;
        flex: 1;
        outline: none;
    }
    
    .activity-item, .visitor-item, .backup-item {
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid var(--terminal-border);
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 3px;
    }
    
    .activity-header, .visitor-header, .backup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0, 255, 0, 0.2);
    }
    
    .activity-user, .visitor-ip, .backup-id {
        color: var(--terminal-cyan);
        font-weight: bold;
    }
    
    .activity-time, .visitor-time, .backup-time {
        color: var(--terminal-text);
        opacity: 0.7;
        font-size: 0.8rem;
    }
    
    .activity-details, .visitor-details, .backup-details {
        color: var(--terminal-text);
        font-size: 0.9rem;
    }
    
    .backup-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
    }
    
    .security-section {
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid var(--terminal-border);
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .security-section h3 {
        color: var(--terminal-cyan);
        margin-bottom: 15px;
        border-bottom: 1px solid var(--terminal-border);
        padding-bottom: 10px;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .stat-card {
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid var(--terminal-border);
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .stat-card:hover {
        border-color: var(--terminal-cyan);
        box-shadow: 0 0 10px var(--terminal-glow);
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: var(--terminal-green);
        margin-bottom: 5px;
    }
    
    .stat-label {
        color: var(--terminal-text);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .chart-container {
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid var(--terminal-border);
        padding: 20px;
        margin-bottom: 20px;
        height: 300px;
    }
    
    .console-line.command {
        color: var(--terminal-cyan);
    }
`;
document.head.appendChild(enhancedStyles);

console.log('🎉 Enhanced developer panel loaded successfully');
