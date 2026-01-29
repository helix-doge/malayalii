import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let APPS = [];
let KEY_INTERVAL = null;

/* ================= PAGE SWITCH ================= */
const pages = {
  dashboard: document.getElementById("page-dashboard"),
  apps: document.getElementById("page-apps"),
  add: document.getElementById("page-add"),
  keys: document.getElementById("page-keys")
};

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".bottom-nav button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[btn.dataset.page].classList.add("active");

    if (btn.dataset.page === "keys") {
      initKeys();
    } else {
      stopKeyLive();
    }
  };
});

/* ================= LOAD APPS ================= */
async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)");

  APPS = data || [];
  updateDashboard();
  populateKeyApps();
}

/* ================= DASHBOARD ================= */
function updateDashboard() {
  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s, a) => s + a.plans.length, 0);
}

/* ================= KEYS ================= */
async function initKeys() {
  await loadApps();
  await loadKeys();

  stopKeyLive();
  KEY_INTERVAL = setInterval(loadKeys, 5000);
}

function stopKeyLive() {
  if (KEY_INTERVAL) clearInterval(KEY_INTERVAL);
}

/* ================= POPULATE APP FILTER ================= */
function populateKeyApps() {
  filterApp.innerHTML = `<option value="">All Apps</option>`;
  APPS.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name;
    filterApp.appendChild(opt);
  });
}

/* ================= LOAD KEYS ================= */
async function loadKeys() {
  const { data } = await supabase
    .from("keys")
    .select("id, key_value, is_used, apps(name), plans(label)")
    .order("created_at", { ascending: false });

  renderKeys(data || []);
}

/* ================= RENDER KEYS ================= */
function renderKeys(keys) {
  const appFilter = filterApp.value;
  const statusFilter = filterStatus.value;

  let list = [...keys];

  if (appFilter) {
    list = list.filter(k => k.apps?.id === appFilter);
  }

  if (statusFilter === "available") {
    list = list.filter(k => !k.is_used);
  }

  if (statusFilter === "used") {
    list = list.filter(k => k.is_used);
  }

  totalKeys.textContent = list.length;
  availableKeys.textContent = list.filter(k => !k.is_used).length;
  usedKeys.textContent = list.filter(k => k.is_used).length;

  keysTableBody.innerHTML = "";

  list.forEach(k => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k.apps?.name || "-"}</td>
      <td>${k.plans?.label || "-"}</td>
      <td>${k.key_value}</td>
      <td>${k.is_used ? "Used" : "Available"}</td>
      <td>
        <button class="delete-btn" onclick="deleteKey('${k.id}')">
          Delete
        </button>
      </td>
    `;
    keysTableBody.appendChild(tr);
  });
}

/* ================= DELETE KEY ================= */
window.deleteKey = async (id) => {
  if (!confirm("Delete this key permanently?")) return;
  await supabase.from("keys").delete().eq("id", id);
  loadKeys();
};

/* ================= FILTER EVENTS ================= */
filterApp.onchange = loadKeys;
filterStatus.onchange = loadKeys;

/* ================= INIT ================= */
loadApps();
