import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://dytrdmvicireccasxxvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dHJkbXZpY2lyZWNjYXN4eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk1MjYsImV4cCI6MjA3ODc5NTUyNn0.MJpdbbhUI7BkZ_FtHao_83R2ncEQyTv3nS-YZBCyIHY";

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("adminLoggedIn") === "true") {
        window.location.href = "admin.html"; 
        return;
    }
    setupForm();
});

function setupForm() {
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const strengthBar = document.querySelector(".strength-bar");

    passwordInput.addEventListener("input", function () {
        const password = this.value;
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        strengthBar.style.width = strength + "%";
        strengthBar.style.background =
            strength < 50 ? "var(--terminal-red)" :
            strength < 75 ? "var(--terminal-yellow)" :
            "var(--terminal-green)";
    });

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showNotification("ENTER BOTH FIELDS", "error");
            return;
        }

        const btn = loginForm.querySelector("button");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING...';

        const { data, error } = await supabase.rpc("check_admin_login", {
            user_input: username,
            pass_input: password,
        });

        btn.disabled = false;
        btn.innerHTML = '<span class="btn-text"><i class="fas fa-fingerprint"></i> VERIFY_IDENTITY</span>';

        if (error) {
            console.error(error);
            showNotification("SERVER ERROR", "error");
            return;
        }

        if (data === true) {
            showNotification("ACCESS_GRANTED", "success");
            localStorage.setItem("adminLoggedIn", "true");
            setTimeout(() => (window.location.href = "admin.html"), 1200);
        } else {
            showNotification("ACCESS_DENIED", "error");
            loginForm.style.animation = "shake 0.5s ease";
            setTimeout(() => (loginForm.style.animation = ""), 500);
        }
    });
}

function showNotification(message, type = "info") {
    document.querySelectorAll(".notification").forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === "success" ? "check" : "exclamation-triangle"}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "rgba(0,255,0,0.1)" : "rgba(255,0,0,0.1)"};
        border: 1px solid ${type === "success" ? "var(--terminal-green)" : "var(--terminal-red)"};
        color: var(--terminal-text);
        padding: 15px 20px;
        z-index: 10000;
        display: flex;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

const styles = document.createElement("style");
styles.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
}
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}`;
document.head.appendChild(styles);
