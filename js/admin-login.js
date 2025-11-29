// --- Supabase Secure Admin Login --- //
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Your Supabase credentials
const supabaseUrl = "https://dytrdmvicireccasxxvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dHJkbXZpY2lyZWNjYXN4eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk1MjYsImV4cCI6MjA3ODc5NTUyNn0.MJpdbbhUI7BkZ_FtHao_83R2ncEQyTv3nS-YZBCyIHY";
const supabase = createClient(supabaseUrl, supabaseKey);

// UI elements
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const strengthBar = document.querySelector('.strength-bar');

// Password strength UI (optional UI effect)
passwordInput.addEventListener('input', () => {
    const p = passwordInput.value;
    let s = 0;
    if (p.length >= 6) s += 25;
    if (/[A-Z]/.test(p)) s += 25;
    if (/[0-9]/.test(p)) s += 25;
    if (/[^A-Za-z0-9]/.test(p)) s += 25;

    strengthBar.style.width = s + "%";
    strengthBar.style.background = s < 50 ? "var(--terminal-red)" :
        s < 75 ? "var(--terminal-yellow)" : "var(--terminal-green)";
});

// 🚀 Login Submit
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showNotification("ENTER_VALID_CREDENTIALS", "error");
        return;
    }

    const btn = loginForm.querySelector("button");
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> VERIFYING...`;

    const { data, error } = await supabase.rpc("check_admin_login", {
        user_input: username,
        pass_input: password
    });

    if (data === true) {
        localStorage.setItem("adminLoggedIn", "true");
        showNotification("ACCESS_GRANTED", "success");

        setTimeout(() => {
            window.location.href = "admin.html";
        }, 1000);

    } else {
        showNotification("INVALID_ACCESS_CODE", "error");

        btn.disabled = false;
        btn.innerHTML = `<span class="btn-text"><i class="fas fa-fingerprint"></i> VERIFY_IDENTITY</span>`;

        loginForm.style.animation = "shake 0.5s ease";
        setTimeout(() => loginForm.style.animation = "", 500);
    }
});

// Notification popup UI
function showNotification(message, type = "info") {
    document.querySelectorAll(".notification").forEach(n => n.remove());

    const n = document.createElement("div");
    n.className = `notification ${type}`;
    n.innerHTML = `
        <span class="notification-icon">
            <i class="fas fa-${type === "success" ? "check" : "exclamation-triangle"}"></i>
        </span>
        <span class="notification-text">${message}</span>
    `;

    n.style.cssText = `
        position: fixed; top:20px; right:20px;
        padding:14px 18px; z-index:9999;
        background:${type==="success"?"rgba(0,255,0,0.1)":"rgba(255,0,0,0.1)"};
        border:1px solid ${type==="success"?"var(--terminal-green)":"var(--terminal-red)"};
        color:var(--terminal-text);
        display:flex; align-items:center; gap:10px;
        animation:slideIn .3s ease;
        font-family:'Share Tech Mono', monospace;
    `;

    document.body.appendChild(n);

    setTimeout(() => {
        n.style.animation = "slideOut .3s ease";
        setTimeout(() => n.remove(), 250);
    }, 3500);
}
