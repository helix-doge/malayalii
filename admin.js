import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let APPS = [];
let EDIT_ID = null;

/* ---------- TOAST ---------- */
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ---------- PAGE SWITCH ---------- */
const pages = {
  dashboard: pageDashboard,
  apps: pageApps,
  add: pageAdd,
  keys: pageKeys
};

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");

  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById("nav" + page.charAt(0).toUpperCase() + page.slice(1))
    .classList.add("active");
}

navDashboard.onclick = () => show("dashboard");
navApps.onclick = () => show("apps");
navAdd.onclick = () => {
  resetForm();
  show("add");
};
navKeys.onclick = () => {
  show("keys");
  loadKeyApps();
  loadKeyStats();
  loadOrders();
};

/* ---------- LOAD APPS ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  APPS = data || [];
  renderApps();
  updateStats();
}

/* ---------- DASHBOARD ---------- */
function updateStats() {
  statTotal.textContent = APPS.length;
  statAndroid.textContent = APPS.filter(a => a.platform === "android").length;
  statIos.textContent = APPS.filter(a => a.platform === "ios").length;
  statPlans.textContent = APPS.reduce((s,a)=>s+a.plans.length,0);
}

/* ---------- APPS ---------- */
function renderApps() {
  appsList.innerHTML = "";
  APPS.forEach(app => {
    const d = document.createElement("div");
    d.className = "app-card";
    d.innerHTML = `
      <b>${app.name}</b><br>
      ${app.platform}<br>
      Plans: ${app.plans.length}
      <button>Edit</button>
    `;
    d.querySelector("button").onclick = () => openEdit(app);
    appsList.appendChild(d);
  });
}

function openEdit(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlan(p.label, p.price));

  show("add");
}

/* ---------- PLANS ---------- */
addPlanBtn.onclick = () => addPlan();

function addPlan(label="", price="") {
  const row = document.createElement("div");
  row.className = "plan";
  row.innerHTML = `
    <input value="${label}">
    <input type="number" value="${price}">
    <button>✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
}

/* ---------- SAVE APP ---------- */
saveBtn.onclick = async () => {
  if (!appName.value.trim()) return toast("App name required");

  let iconUrl = null;
  if (iconFile.files[0]) {
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;
    await supabase.storage.from("app-icons").upload(path, file, { upsert:true });
    iconUrl = supabase.storage.from("app-icons").getPublicUrl(path).data.publicUrl;
  }

  let app;
  if (EDIT_ID) {
    const res = await supabase.from("apps")
      .update({ name: appName.value, platform: platform.value, description: description.value, ...(iconUrl && { icon_url: iconUrl }) })
      .eq("id", EDIT_ID)
      .select().single();
    app = res.data;
    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  } else {
    const res = await supabase.from("apps")
      .insert({ name: appName.value, platform: platform.value, description: description.value, icon_url: iconUrl })
      .select().single();
    app = res.data;
  }

  for (const row of plans.children) {
    await supabase.from("plans").insert({
      app_id: app.id,
      label: row.children[0].value,
      price: Number(row.children[1].value)
    });
  }

  toast("App saved");
  resetForm();
  loadApps();
  show("apps");
};

/* ---------- DELETE ---------- */
deleteBtn.onclick = async () => {
  await supabase.from("apps").delete().eq("id", EDIT_ID);
  toast("App deleted");
  resetForm();
  loadApps();
  show("apps");
};

/* ---------- FORM RESET ---------- */
function resetForm() {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteBtn.classList.add("hidden");
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
}

/* ---------- KEYS ---------- */
async function loadKeyApps() {
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
  const keys = keyBulk.value.split("\n").map(k=>k.trim()).filter(Boolean);
  for (const k of keys) {
    await supabase.from("keys").insert({
      app_id: keyApp.value,
      plan_id: keyPlan.value,
      key_value: k
    });
  }
  keyBulk.value = "";
  toast("Keys saved");
  loadKeyStats();
};

/* ---------- KEY STATS ---------- */
async function loadKeyStats() {
  const { data } = await supabase.from("keys").select("*");
  totalKeys.textContent = data.length;
  usedKeys.textContent = data.filter(k=>k.is_used).length;
  freeKeys.textContent = data.filter(k=>!k.is_used).length;
}

/* ---------- ORDERS ---------- */
async function loadOrders() {
  const { data } = await supabase
    .from("orders")
    .select("order_id, created_at, apps(name), plans(label)");

  ordersList.innerHTML = "";
  data.forEach(o => {
    const d = document.createElement("div");
    d.className = "app-card";
    d.innerHTML = `
      <b>${o.order_id}</b><br>
      ${o.apps.name} – ${o.plans.label}<br>
      ${new Date(o.created_at).toLocaleString()}
    `;
    ordersList.appendChild(d);
  });
}

/* ---------- REALTIME ---------- */
supabase.channel("admin-final")
  .on("postgres_changes",{event:"*",schema:"public",table:"apps"},loadApps)
  .on("postgres_changes",{event:"*",schema:"public",table:"plans"},loadApps)
  .on("postgres_changes",{event:"*",schema:"public",table:"keys"},loadKeyStats)
  .on("postgres_changes",{event:"*",schema:"public",table:"orders"},loadOrders)
  .subscribe();

/* INIT */
loadApps();
