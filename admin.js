import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let APPS = [];
let KEY_INTERVAL = null;

/* ================= PAGE REFERENCES ================= */
const pages = {
  dashboard: document.getElementById("page-dashboard"),
  apps: document.getElementById("page-apps"),
  add: document.getElementById("page-add"),
  keys: document.getElementById("page-keys"),
  "add-keys": document.getElementById("page-add-keys")
};

/* ================= BOTTOM NAV ================= */
document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".bottom-nav button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[btn.dataset.page].classList.add("active");

    if (btn.dataset.page === "keys") {
      initKeys();
    } else if (btn.dataset.page === "add-keys") {
      initAddKeys();
    } else {
      stopKeyLive();
    }
  });
});

/* ================= LOAD APPS ================= */
async function loadApps() {
  const { data, error } = await supabase
    .from("apps")
    .select("*, plans(*)");

  if (error) {
    console.error(error);
    return;
  }

  APPS = data || [];
  updateDashboard();
}

/* ================= DASHBOARD ================= */
function updateDashboard() {
  document.getElementById("statApps").textContent = APPS.length;
  document.getElementById("statPlans").textContent =
    APPS.reduce((s, a) => s + a.plans.length, 0);
}

/* ================= KEY MANAGEMENT ================= */
async function initKeys() {
  await loadApps();
  populateKeyFilter();
  loadKeys();

  stopKeyLive();
  KEY_INTERVAL = setInterval(loadKeys, 5000);
}

function stopKeyLive() {
  if (KEY_INTERVAL) clearInterval(KEY_INTERVAL);
}

/* ================= KEY FILTER ================= */
function populateKeyFilter() {
  const filterApp = document.getElementById("filterApp");
  filterApp.innerHTML = `<option value="">All Apps</option>`;

  APPS.forEach(app => {
    const opt = document.createElement("option");
    opt.value = app.id;
    opt.textContent = app.name;
    filterApp.appendChild(opt);
  });
}

/* ================= LOAD KEYS ================= */
async function loadKeys() {
  const { data, error } = await supabase
    .from("keys")
    .select("id, key_value, is_used, apps(name,id), plans(label)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  renderKeys(data || []);
}

/* ================= RENDER KEYS ================= */
function renderKeys(keys) {
  const filterApp = document.getElementById("filterApp").value;
  const filterStatus = document.getElementById("filterStatus").value;

  let list = [...keys];

  if (filterApp) {
    list = list.filter(k => k.apps?.id === filterApp);
  }

  if (filterStatus === "available") {
    list = list.filter(k => !k.is_used);
  }

  if (filterStatus === "used") {
    list = list.filter(k => k.is_used);
  }

  document.getElementById("totalKeys").textContent = list.length;
  document.getElementById("availableKeys").textContent =
    list.filter(k => !k.is_used).length;
  document.getElementById("usedKeys").textContent =
    list.filter(k => k.is_used).length;

  const tbody = document.getElementById("keysTableBody");
  tbody.innerHTML = "";

  list.forEach(k => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k.apps?.name || "-"}</td>
      <td>${k.plans?.label || "-"}</td>
      <td>${k.key_value}</td>
      <td>${k.is_used ? "Used" : "Available"}</td>
      <td>
        <button class="delete-btn" data-id="${k.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => deleteKey(btn.dataset.id);
  });
}

/* ================= DELETE KEY ================= */
async function deleteKey(id) {
  if (!confirm("Delete this key permanently?")) return;
  await supabase.from("keys").delete().eq("id", id);
  loadKeys();
}

/* ================= FILTER EVENTS ================= */
document.getElementById("filterApp").onchange = loadKeys;
document.getElementById("filterStatus").onchange = loadKeys;

/* ================= ADD KEYS PAGE ================= */
async function initAddKeys() {
  await loadApps();

  const appSelect = document.getElementById("keyAppSelect");
  appSelect.innerHTML = "";

  APPS.forEach(app => {
    const opt = document.createElement("option");
    opt.value = app.id;
    opt.textContent = app.name;
    appSelect.appendChild(opt);
  });

  loadKeyPlans();
}

function loadKeyPlans() {
  const appId = document.getElementById("keyAppSelect").value;
  const planSelect = document.getElementById("keyPlanSelect");
  planSelect.innerHTML = "";

  const app = APPS.find(a => a.id === appId);
  if (!app) return;

  app.plans.forEach(plan => {
    const opt = document.createElement("option");
    opt.value = plan.id;
    opt.textContent = `${plan.label} – ₹${plan.price}`;
    planSelect.appendChild(opt);
  });
}

document.getElementById("keyAppSelect").onchange = loadKeyPlans;

document.getElementById("saveKeysBtn").onclick = async () => {
  const bulk = document.getElementById("keyBulk").value;
  const keys = bulk.split("\n").map(k => k.trim()).filter(Boolean);

  for (const k of keys) {
    await supabase.from("keys").insert({
      app_id: document.getElementById("keyAppSelect").value,
      plan_id: document.getElementById("keyPlanSelect").value,
      key_value: k
    });
  }

  document.getElementById("keyBulk").value = "";
  alert("Keys added successfully");
};

/* ================= INIT ================= */
loadApps();
