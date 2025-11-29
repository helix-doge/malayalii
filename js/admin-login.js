// Admin login credentials
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "malayali2025"
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        const loginTime = localStorage.getItem('adminLoginTime');
        const currentTime = new Date().getTime();
        const hoursSinceLogin = (currentTime - new Date(loginTime).getTime()) / (1000 * 60 * 60);
        
        // Auto logout after 24 hours
        if (hoursSinceLogin < 24) {
            window.location.href = 'admin.html';
            return;
        } else {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
        }
    }

    initializeLogin();
});

function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.strength-bar');

    // Password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;

        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        strengthBar.style.width = strength + '%';
        strengthBar.style.background = strength < 50 ? 'var(--terminal-red)' : 
                                      strength < 75 ? 'var(--terminal-yellow)' : 
                                      'var(--terminal-green)';
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showNotification('PLEASE_ENTER_BOTH_FIELDS', 'error');
            return;
        }

        // Simulate processing
        const submitBtn = this.querySelector('button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING...';
        submitBtn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                // Successful login
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminLoginTime', new Date().toISOString());
                
                showNotification('ACCESS_GRANTED', 'success');
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                // Failed login
                showNotification('ACCESS_DENIED: INVALID_CREDENTIALS', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Shake animation
                loginForm.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    loginForm.style.animation = '';
                }, 500);
            }
        }, 1500);
    });

    // Add shake animation
    const shakeStyles = document.createElement('style');
    shakeStyles.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeStyles);

    // Focus on username input
    usernameInput.focus();
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'};
        border: 1px solid ${type === 'success' ? 'var(--terminal-green)' : 'var(--terminal-red)'};
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
