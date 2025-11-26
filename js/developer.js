// Backend API URL
const API_BASE_URL = 'https://malayali-store-backend.onrender.com';

// Global variables
let systemStats = {};
let adminActivities = [];
let visitorData = [];
let charts = {};

// Initialize developer panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Developer panel initializing...');
    initializeDeveloperPanel();
});

function initializeDeveloperPanel() {
    setupDeveloperEvents();
    startDeveloperTime();
    
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
    
    console.log('✅ Developer event listeners setup complete');
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
        showDeveloperNotification('DEVELOPER_ACCESS_GRANTED', 'success');
        
    } catch (error) {
        console.error('Developer login error:', error);
        showDeveloperNotification('ACCESS_DENIED: ' + error.message, 'error');
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
}

async function loadDeveloperData() {
    try {
        await Promise.all([
            loadSystemStats(),
            loadAdminActivities(),
            updateConsole('System data loaded successfully', 'success')
        ]);
        
        updateDeveloperStatus('ONLINE');
        
    } catch (error) {
        console.error('Error loading developer data:', error);
        updateConsole('Failed to load system data: ' + error.message, 'error');
        updateDeveloperStatus('ERROR');
    }
}

async function loadSystemStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/developer/stats`);
        const data = await response.json();
        
        if (data.success) {
            systemStats = data.stats;
            adminActivities = data.recentLogs || [];
            visitorData = data.visitorData || [];
            
            updateStatsDisplay();
            updateCharts();
            updateAdminActivities();
        } else {
            throw new Error(data.error || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading system stats:', error);
        // Use fallback data
        systemStats = {
            visitors: 0,
            uniqueVisitors: 0,
            adminLogs: 0,
            totalKeys: 0,
            availableKeys: 0,
            totalOrders: 0,
            completedOrders: 0,
            revenue: 0
        };
        adminActivities = [];
        visitorData = [];
        
        updateStatsDisplay();
        updateConsole('Using fallback statistics data', 'info');
    }
}

function updateStatsDisplay() {
    document.getElementById('total-visitors').textContent = systemStats.visitors || 0;
    document.getElementById('unique-visitors').textContent = systemStats.uniqueVisitors || 0;
    document.getElementById('total-orders').textContent = systemStats.totalOrders || 0;
    document.getElementById('system-revenue').textContent = `₹${systemStats.revenue || 0}`;
}

function updateCharts() {
    // Visitors chart
    const visitorsCtx = document.getElementById('visitors-chart');
    
    if (!visitorsCtx) {
        console.log('Visitors chart canvas not found');
        return;
    }
    
    const ctx = visitorsCtx.getContext('2d');
    
    if (charts.visitors) {
        charts.visitors.destroy();
    }
    
    // Group visitors by date
    const visitorsByDate = {};
    visitorData.forEach(visit => {
        const date = new Date(visit.timestamp).toLocaleDateString();
        visitorsByDate[date] = (visitorsByDate[date] || 0) + 1;
    });
    
    const dates = Object.keys(visitorsByDate).slice(-7); // Last 7 days
    const counts = dates.map(date => visitorsByDate[date]);
    
    // If no data, show empty chart
    if (dates.length === 0) {
        dates.push('No Data');
        counts.push(0);
    }
    
    charts.visitors = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Visitors',
                data: counts,
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#00ff00'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#00ff00'
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#00ff00'
                    },
                    grid: {
                        color: 'rgba(0, 255, 0, 0.1)'
                    }
                }
            }
        }
    });
}

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
    
    adminActivities.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        activityItem.innerHTML = `
            <div class="activity-header">
                <span class="activity-user">${activity.username || 'SYSTEM'}</span>
                <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
            </div>
            <div class="activity-details">
                <strong>Action:</strong> ${activity.action || 'Unknown'}<br>
                <strong>IP:</strong> ${activity.ip || 'Unknown'}<br>
                <strong>Device:</strong> ${(activity.user_agent || 'Unknown').substring(0, 50)}...
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

function updateConsole(message, type = 'info') {
    const consoleElement = document.getElementById('system-console');
    if (!consoleElement) return;
    
    const consoleLine = document.createElement('div');
    consoleLine.className = 'console-line';
    
    const prefix = type === 'error' ? '[ERROR]' : type === 'success' ? '[SUCCESS]' : '[INFO]';
    const color = type === 'error' ? 'var(--terminal-red)' : type === 'success' ? 'var(--terminal-green)' : 'var(--terminal-cyan)';
    
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
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function startDataRefresh() {
    // Refresh data every 30 seconds
    setInterval(async () => {
        await loadDeveloperData();
    }, 30000);
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
`;
document.head.appendChild(notificationStyles);

console.log('🎉 Developer panel loaded successfully');
