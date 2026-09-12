// Admin Authentication Guard & Login
function checkAdminAuth() {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated && !window.location.pathname.includes("admin-login.html")) {
        window.location.href = "admin-login.html";
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const id = document.getElementById("adminIdInput").value.trim();
    const pwd = document.getElementById("adminPasswordInput").value.trim();

    if (id === ADMIN_ID && pwd === ADMIN_PASS) {
        sessionStorage.setItem("admin_authenticated", "true");
        window.location.href = "admin.html";
    } else {
        alert("Invalid Admin ID or Password!");
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("admin_authenticated");
    window.location.href = "admin-login.html";
}
