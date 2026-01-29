import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let APPS = [];
let KEY_INTERVAL = null;

/* ---------------- PAGE SWITCH ---------------- */
const pages = {
  dashboard: page-dashboard,
  apps: page-apps,
  add: page-add,
  keys: page-keys,
  "add-keys": page-add-keys
};

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".bottom-nav button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[btn.dataset.page].classList.add("active");

    if (btn.dataset.page === "keys") initKeys();
    if (btn.dataset.page === "add-keys") initAddKeys();
    else stopKeyLive();
  };
});

/* ---------------- LOAD APPS ---------------- */
async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)");

  APPS = data || [];
  updateDashboard();
}

/* ---------------- DASHBOARD ---------------- */
function updateDashboard() {
  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s, a) => s + a.plans.length, 0);
}

/* ---------------- KEY MANAGEMENT ---------------- */
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

function populateKeyFilter() {
  filterApp.innerHTML = `<option value="">All Apps</option>`;
  APPS.forEach(a => {
    const o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    filterApp.appendChild(o);
  });
}

async function loadKeys() {
  const { data } = await supabase
    .from("keys")
    .select("id, key_value, is_used, apps(name), plans(label)")
    .order("created_at", { ascending: false });

  renderKeys(data || []);
}

function renderKeys(keys) {
  let list = [...keys];

  if (filterApp.value)
    list = list.filter(k => k.apps?.name && k.apps?.id === filterApp.value);

  if (filterStatus.value === "available")
    list = list.filter(k => !k.is_used);

  if (filterStatus.value === "used")
    list = list.filter(k => k.is_used);

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
        <button class="delete-btn" onclick="deleteKey('${k.id}')">Delete</button>
      </td>
    `;
    keysTableBody.appendChild(tr);
  });
}

window.deleteKey = async id => {
  if (!confirm("Delete this key?")) return;
  await supabase.from("keys").delete().eq("id", id);
  loadKeys();
};

filterApp.onchange = loadKeys;
filterStatus.onchange = loadKeys;

/* ---------------- ADD KEYS PAGE ---------------- */
async function initAddKeys() {
  await loadApps();
  keyAppSelect.innerHTML = "";
  APPS.forEach(a => {
    const o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    keyAppSelect.appendChild(o);
  });
  loadKeyPlans();
}

function loadKeyPlans() {
  keyPlanSelect.innerHTML = "";
  const app = APPS.find(a => a.id === keyAppSelect.value);
  if (!app) return;

  app.plans.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = `${p.label} – ₹${p.price}`;
    keyPlanSelect.appendChild(o);
  });
}

keyAppSelect.onchange = loadKeyPlans;

saveKeysBtn.onclick = async () => {
  const keys = keyBulk.value
    .split("\n")
    .map(k => k.trim())
    .filter(Boolean);

  for (const k of keys) {
    await supabase.from("keys").insert({
      app_id: keyAppSelect.value,
      plan_id: keyPlanSelect.value,
      key_value: k
    });
  }

  keyBulk.value = "";
  alert("Keys added successfully");
};

/* ---------------- INIT ---------------- */
loadApps();
