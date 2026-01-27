import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------------- STATE ---------------- */
let APPS = [];
let MODE = "add";       // "add" | "edit"
let EDIT_ID = null;

/* ---------------- PAGE SWITCH ---------------- */
const pages = {
  dashboard: document.getElementById("page-dashboard"),
  apps: document.getElementById("page-apps"),
  add: document.getElementById("page-add")
};

function showPage(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");

  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById(
    "nav" + page.charAt(0).toUpperCase() + page.slice(1)
  ).classList.add("active");
}

/* ---------------- NAV ---------------- */
navDashboard.onclick = () => showPage("dashboard");
navApps.onclick = () => showPage("apps");
navAdd.onclick = () => {
  openAddMode();
  showPage("add");
};

/* ---------------- LOAD DATA ---------------- */
async function loadApps() {
  const { data, error } = await supabase
    .from("apps")
    .select("*, plans(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load apps failed:", error);
    return;
  }

  APPS = data || [];
  renderApps();
  updateStats();
}

/* ---------------- DASHBOARD ---------------- */
function updateStats() {
  statTotal.textContent = APPS.length;
  statAndroid.textContent = APPS.filter(a => a.platform === "android").length;
  statIos.textContent = APPS.filter(a => a.platform === "ios").length;
  statPlans.textContent = APPS.reduce(
    (sum, a) => sum + (a.plans?.length || 0),
    0
  );
}

/* ---------------- APPS LIST ---------------- */
function renderApps() {
  appsList.innerHTML = "";
  const f = filter.value;

  APPS
    .filter(a => f === "all" || a.platform === f)
    .forEach(app => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform.toUpperCase()}</small><br>
        Plans: ${app.plans.length}
        <button>Edit</button>
      `;
      card.querySelector("button").onclick = () => openEditMode(app);
      appsList.appendChild(card);
    });
}

filter.onchange = renderApps;

/* ---------------- ADD MODE ---------------- */
function openAddMode() {
  MODE = "add";
  EDIT_ID = null;

  formTitle.textContent = "Add New App";
  deleteBtn.classList.add("hidden");

  appName.value = "";
  description.value = "";
  iconFile.value = "";
  plans.innerHTML = "";
}

/* ---------------- EDIT MODE ---------------- */
function openEditMode(app) {
  MODE = "edit";
  EDIT_ID = app.id;

  formTitle.textContent = "Edit App";
  deleteBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlan(p.label, p.price));

  showPage("add");
}

/* ---------------- PLANS ---------------- */
addPlanBtn.onclick = () => addPlan();

function addPlan(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "plan";
  row.innerHTML = `
    <input placeholder="Plan name" value="${label}">
    <input type="number" placeholder="Price" value="${price}">
    <button>✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
}

/* ---------------- SAVE APP ---------------- */
saveBtn.onclick = async () => {
  if (!appName.value.trim()) {
    alert("App name required");
    return;
  }

  let iconUrl = null;

  /* ICON UPLOAD */
  if (iconFile.files[0]) {
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const upload = await supabase
      .storage.from("app-icons")
      .upload(path, file, { upsert: true });

    if (upload.error) {
      alert("Icon upload failed");
      console.error(upload.error);
      return;
    }

    iconUrl = supabase
      .storage.from("app-icons")
      .getPublicUrl(path).data.publicUrl;
  }

  let app;

  /* ADD */
  if (MODE === "add") {
    const res = await supabase
      .from("apps")
      .insert({
        name: appName.value.trim(),
        platform: platform.value,
        description: description.value.trim(),
        icon_url: iconUrl
      })
      .select()
      .single();

    if (res.error) {
      alert("Failed to add app");
      console.error(res.error);
      return;
    }

    app = res.data;
  }

  /* EDIT */
  if (MODE === "edit") {
    const res = await supabase
      .from("apps")
      .update({
        name: appName.value.trim(),
        platform: platform.value,
        description: description.value.trim(),
        ...(iconUrl && { icon_url: iconUrl })
      })
      .eq("id", EDIT_ID)
      .select()
      .single();

    if (res.error) {
      alert("Failed to update app");
      console.error(res.error);
      return;
    }

    app = res.data;

    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  }

  /* SAVE PLANS */
  for (const row of plans.children) {
    const label = row.children[0].value.trim();
    const price = Number(row.children[1].value);

    if (!label || !price) continue;

    await supabase.from("plans").insert({
      app_id: app.id,
      label,
      price
    });
  }

  openAddMode();
  await loadApps();
  showPage("apps");
};

/* ---------------- DELETE ---------------- */
deleteBtn.onclick = async () => {
  if (!confirm("Delete this app?")) return;

  await supabase.from("apps").delete().eq("id", EDIT_ID);
  openAddMode();
  await loadApps();
  showPage("apps");
};

/* ---------------- REALTIME ---------------- */
supabase.channel("admin-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, loadApps)
  .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, loadApps)
  .subscribe();

/* INIT */
openAddMode();
loadApps();

/* ---------------- KEYS PAGE ---------------- */
const keyPage = document.getElementById("page-keys");
const keyApp = document.getElementById("keyApp");
const keyPlan = document.getElementById("keyPlan");

navKeys.onclick = () => showPage("keys");

/* Populate app dropdown */
function loadKeyApps() {
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
    o.textContent = `${p.label} – ₹${p.price}`;
    keyPlan.appendChild(o);
  });
}

keyApp.onchange = loadKeyPlans;

/* Save keys */
saveKeysBtn.onclick = async () => {
  const keys = keyBulk.value
    .split("\n")
    .map(k => k.trim())
    .filter(Boolean);

  if (!keys.length) return alert("No keys");

  for (const k of keys) {
    await supabase.from("keys").insert({
      app_id: keyApp.value,
      plan_id: keyPlan.value,
      key_value: k
    });
  }

  keyBulk.value = "";
  loadKeyStats();
  alert("Keys saved");
};

/* Stats */
async function loadKeyStats() {
  const { data } = await supabase.from("keys").select("*");

  totalKeys.textContent = data.length;
  usedKeys.textContent = data.filter(k => k.is_used).length;
  freeKeys.textContent = data.filter(k => !k.is_used).length;
}

/* Orders list */
async function loadOrders() {
  const { data } = await supabase
    .from("orders")
    .select("order_id, created_at, apps(name), plans(label)");

  ordersList.innerHTML = "";
  data.forEach(o => {
    const div = document.createElement("div");
    div.className = "order";
    div.innerHTML = `
      Order ID: <b>${o.order_id}</b><br>
      ${o.apps.name} – ${o.plans.label}<br>
      ${new Date(o.created_at).toLocaleString()}
    `;
    ordersList.appendChild(div);
  });
}

/* Load when opening */
navKeys.onclick = async () => {
  showPage("keys");
  loadKeyApps();
  loadKeyStats();
  loadOrders();
};

