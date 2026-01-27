import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let APPS = [];
let EDIT_ID = null;

/* ---------- PAGE SWITCH ---------- */
const pages = {
  dashboard: document.getElementById("page-dashboard"),
  apps: document.getElementById("page-apps"),
  add: document.getElementById("page-add"),
  keys: document.getElementById("page-keys")
};

document.querySelectorAll(".bottom-nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[btn.dataset.page].classList.add("active");

    if (btn.dataset.page === "keys") {
      loadKeyDropdowns();
      loadKeyStats();
    }
  };
});

/* ---------- LOAD APPS ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  APPS = data || [];
  renderApps();
  updateStats();
}

/* ---------- DASHBOARD ---------- */
function updateStats() {
  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s, a) => s + a.plans.length, 0);
}

/* ---------- APPS LIST ---------- */
function renderApps() {
  appsList.innerHTML = "";
  const f = appFilter.value;

  APPS
    .filter(a => f === "all" || a.platform === f)
    .forEach(app => {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform}</small>
        <button>Edit</button>
      `;
      d.querySelector("button").onclick = () => openEdit(app);
      appsList.appendChild(d);
    });
}

appFilter.onchange = renderApps;

/* ---------- ADD / EDIT APP ---------- */
function openAdd() {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteAppBtn.classList.add("hidden");
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
}

function openEdit(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteAppBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlanRow(p.label, p.price));

  document.querySelector('[data-page="add"]').click();
}

addPlanBtn.onclick = () => addPlanRow();

function addPlanRow(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "plan-row";
  row.innerHTML = `
    <input placeholder="Plan name" value="${label}">
    <input type="number" placeholder="Price" value="${price}">
    <button type="button">✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
}

saveAppBtn.onclick = async () => {
  if (!appName.value) return;

  let app;
  if (EDIT_ID) {
    const res = await supabase
      .from("apps")
      .update({ name: appName.value, platform: platform.value, description: description.value })
      .eq("id", EDIT_ID)
      .select().single();
    app = res.data;
    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  } else {
    const res = await supabase
      .from("apps")
      .insert({ name: appName.value, platform: platform.value, description: description.value })
      .select().single();
    app = res.data;
  }

  for (const row of plans.children) {
    const label = row.children[0].value;
    const price = row.children[1].value;
    if (label && price) {
      await supabase.from("plans").insert({ app_id: app.id, label, price });
    }
  }

  loadApps();
  document.querySelector('[data-page="apps"]').click();
};

deleteAppBtn.onclick = async () => {
  await supabase.from("apps").delete().eq("id", EDIT_ID);
  loadApps();
  document.querySelector('[data-page="apps"]').click();
};

/* ---------- KEYS ---------- */
function loadKeyDropdowns() {
  keyApp.innerHTML = "";
  APPS.forEach(a => {
    const o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    keyApp.appendChild(o);
  });
  loadKeyPlans();
}

function loadKeyPlans() {
  keyPlan.innerHTML = "";
  const app = APPS.find(a => a.id === keyApp.value);
  if (!app) return;
  app.plans.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    keyPlan.appendChild(o);
  });
}

keyApp.onchange = loadKeyPlans;

saveKeysBtn.onclick = async () => {
  const keys = keyBulk.value.split("\n").map(k => k.trim()).filter(Boolean);
  for (const k of keys) {
    await supabase.from("keys").insert({
      app_id: keyApp.value,
      plan_id: keyPlan.value,
      key_value: k
    });
  }
  keyBulk.value = "";
  loadKeyStats();
};

async function loadKeyStats() {
  const { data } = await supabase.from("keys").select("*");
  statKeys.textContent = data.length;
  totalKeys.textContent = data.length;
  usedKeys.textContent = data.filter(k => k.is_used).length;
  freeKeys.textContent = data.filter(k => !k.is_used).length;
}

/* INIT */
openAdd();
loadApps();
