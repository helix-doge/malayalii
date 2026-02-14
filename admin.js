import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* =====================================================
   ADMIN AUTH CHECK (Safe version – does NOT break UI)
===================================================== */

async function checkAdmin() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.replace("admin-login.html");
    return false;
  }

  return true;
}

/* Run auth check first */
checkAdmin().then((allowed) => {
  if (!allowed) return;

  // Only run admin functions if logged in
  initAdminPanel();
});

/* =====================================================
   LOGOUT
===================================================== */

async function logout() {
  await supabase.auth.signOut();
  window.location.replace("admin-login.html");
}

/* =====================================================
   MAIN ADMIN LOGIC
===================================================== */

function initAdminPanel() {

  console.log("Admin authenticated");

  /* Logout button */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  /* ================= PAGE SWITCH ================= */
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll(".bottom-nav button");

  navButtons.forEach(btn => {
    btn.onclick = () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      pages.forEach(p => p.classList.remove("active"));
      document.getElementById("page-" + btn.dataset.page).classList.add("active");
    };
  });

  /* ================= EXISTING APPS LOAD ================= */

  const appsList = document.getElementById("appsList");
  const appFilter = document.getElementById("appFilter");

  async function loadApps() {
    const { data } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });

    appsList.innerHTML = "";

    const platform = appFilter.value;

    data
      .filter(app => platform === "all" || app.platform === platform)
      .forEach(app => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <b>${app.name}</b><br>
          <small>${app.platform}</small>
        `;
        appsList.appendChild(div);
      });
  }

  if (appFilter) {
    appFilter.onchange = loadApps;
  }

  loadApps();

  /* ================= DASHBOARD STATS ================= */

  async function loadStats() {
    const { data: apps } = await supabase.from("apps").select("id");
    const { data: plans } = await supabase.from("plans").select("id");
    const { data: keys } = await supabase.from("keys").select("id");

    const statApps = document.getElementById("statApps");
    const statPlans = document.getElementById("statPlans");
    const statKeys = document.getElementById("statKeys");

    if (statApps) statApps.textContent = apps.length;
    if (statPlans) statPlans.textContent = plans.length;
    if (statKeys) statKeys.textContent = keys.length;
  }

  loadStats();

  console.log("Admin panel initialized");
}
