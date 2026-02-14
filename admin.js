import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= AUTH CHECK ================= */
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.replace("admin-login.html");
    return false;
  }

  return true;
}

/* ================= INIT ================= */
checkAuth().then(ok => {
  if (!ok) return;
  initAdmin();
});

/* ================= LOGOUT ================= */
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.replace("admin-login.html");
  };
}

/* ================= PAGE NAV ================= */
function setupNavigation() {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".bottom-nav button");

  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      pages.forEach(p => p.classList.remove("active"));
      document.getElementById("page-" + btn.dataset.page).classList.add("active");
    };
  });
}

/* ================= DASHBOARD ================= */
async function loadStats() {
  const { data: apps } = await supabase.from("apps").select("id");
  const { data: plans } = await supabase.from("plans").select("id");
  const { data: keys } = await supabase.from("keys").select("id");

  document.getElementById("statApps").textContent = apps.length;
  document.getElementById("statPlans").textContent = plans.length;
  document.getElementById("statKeys").textContent = keys.length;
}

/* ================= LOAD APPS ================= */
async function loadApps() {
  const list = document.getElementById("appsList");
  const filter = document.getElementById("appFilter").value;

  const { data } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false });

  list.innerHTML = "";

  data
    .filter(app => filter === "all" || app.platform === filter)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform}</small>
      `;
      list.appendChild(div);
    });
}

/* ================= LOAD KEYS ================= */
async function loadKeys() {
  const appId = document.getElementById("filterApp").value;
  const status = document.getElementById("filterStatus").value;

  let query = supabase
    .from("keys")
    .select("*, apps(name), plans(label)");

  if (appId) query = query.eq("app_id", appId);
  if (status === "available") query = query.eq("is_used", false);
  if (status === "used") query = query.eq("is_used", true);

  const { data } = await query;

  const tbody = document.getElementById("keysTableBody");
  tbody.innerHTML = "";

  let available = 0;
  let used = 0;

  data.forEach(k => {
    if (k.is_used) used++;
    else available++;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k.apps?.name || ""}</td>
      <td>${k.plans?.label || ""}</td>
      <td>${k.key_value}</td>
      <td>${k.is_used ? "Used" : "Available"}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("totalKeys").textContent = data.length;
  document.getElementById("availableKeys").textContent = available;
  document.getElementById("usedKeys").textContent = used;
}

/* ================= ADD KEYS ================= */
async function loadAppDropdowns() {
  const { data: apps } = await supabase.from("apps").select("*");

  const appSelect = document.getElementById("keyAppSelect");
  appSelect.innerHTML = "";

  apps.forEach(app => {
    const opt = document.createElement("option");
    opt.value = app.id;
    opt.textContent = app.name;
    appSelect.appendChild(opt);
  });

  appSelect.onchange = loadPlanDropdowns;
  loadPlanDropdowns();
}

async function loadPlanDropdowns() {
  const appId = document.getElementById("keyAppSelect").value;
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", appId);

  const planSelect = document.getElementById("keyPlanSelect");
  planSelect.innerHTML = "";

  data.forEach(plan => {
    const opt = document.createElement("option");
    opt.value = plan.id;
    opt.textContent = `${plan.label} - ₹${plan.price}`;
    planSelect.appendChild(opt);
  });
}

async function saveKeys() {
  const appId = document.getElementById("keyAppSelect").value;
  const planId = document.getElementById("keyPlanSelect").value;
  const bulk = document.getElementById("keyBulk").value.trim();

  if (!bulk) return alert("No keys entered");

  const keys = bulk.split("\n").map(k => ({
    app_id: appId,
    plan_id: planId,
    key_value: k.trim(),
    is_used: false
  }));

  await supabase.from("keys").insert(keys);
  document.getElementById("keyBulk").value = "";
  alert("Keys saved");
}

/* ================= INIT ADMIN ================= */
function initAdmin() {
  setupLogout();
  setupNavigation();
  loadStats();
  loadApps();
  loadAppDropdowns();

  document.getElementById("appFilter").onchange = loadApps;
  document.getElementById("loadKeysBtn").onclick = loadKeys;
  document.getElementById("saveKeysBtn").onclick = saveKeys;
}
