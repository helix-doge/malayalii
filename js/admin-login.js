// 🔐 Supabase Client Init
const supabase = supabase.createClient(
    'https://dytrdmvicireccasxxvj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dHJkbXZpY2lyZWNjYXN4eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk1MjYsImV4cCI6MjA3ODc5NTUyNn0.MJpdbbhUI7BkZ_FtHao_83R2ncEQyTv3nS-YZBCyIHY'
);

document.addEventListener('DOMContentLoaded', async function () {

    const { data: session } = await supabase.auth.getSession();

    // If user already logged in → redirect to admin
    if (session.session) {
        window.location.href = 'admin.html';
        return;
    }

    initializeLogin();
});

function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.strength-bar');

    // Password strength indicator
    passwordInput.addEventListener('input', function () {
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

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showNotification('PLEASE_ENTER_BOTH_FIELDS', 'error');
            return;
        }

        const submitBtn = this.querySelector('button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING...';
        submitBtn.disabled = true;

        // 🔐 Supabase Auth login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showNotification('ACCESS_DENIED: INVALID_CREDENTIALS', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            loginForm.style.animation = 'shake 0.5s ease';
            setTimeout(() => { loginForm.style.animation = ''; }, 500);
            return;
        }

        showNotification('ACCESS_GRANTED', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    });

    usernameInput.focus();
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

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

// 🔄 Notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0;} to { transform: translateX(0); opacity: 1;}}
    @keyframes slideOut { from { transform: translateX(0); opacity: 1;} to { transform: translateX(100%); opacity: 0;}}
`;
document.head.appendChild(notificationStyles);
