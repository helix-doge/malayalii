import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= ADMIN PROTECTION ================= */
const { data } = await supabase.auth.getUser();

if (!data.user) {
  window.location.href = "admin-login.html";
}



import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= SUPABASE ================= */
  const supabase = createClient(
    "https://dytrdmvicireccasxxvj.supabase.co",
    "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
  );

  /* ================= ELEMENTS ================= */
  const pages = {
    dashboard: document.getElementById("page-dashboard"),
    apps: document.getElementById("page-apps"),
    add: document.getElementById("page-add"),
    keys: document.getElementById("page-keys"),
    "add-keys": document.getElementById("page-add-keys")
  };

  const navButtons = document.querySelectorAll(".bottom-nav button");

  // Dashboard
  const statApps = document.getElementById("statApps");
  const statPlans = document.getElementById("statPlans");
  const statKeys = document.getElementById("statKeys");

  // Apps
  const appsList = document.getElementById("appsList");
  const appFilter = document.getElementById("appFilter");

  // Add App
  const appName = document.getElementById("appName");
  const platform = document.getElementById("platform");
  const description = document.getElementById("description");
  const iconFile = document.getElementById("iconFile");
  const plansBox = document.getElementById("plans");
  const addPlanBtn = document.getElementById("addPlanBtn");
  const saveAppBtn = document.getElementById("saveAppBtn");
  const deleteAppBtn = document.getElementById("deleteAppBtn");
  const formTitle = document.getElementById("formTitle");

  // Keys
  const filterApp = document.getElementById("filterApp");
  const filterStatus = document.getElementById("filterStatus");
  const keysTableBody = document.getElementById("keysTableBody");
  const totalKeys = document.getElementById("totalKeys");
  const availableKeys = document.getElementById("availableKeys");
  const usedKeys = document.getElementById("usedKeys");

  // Add Keys
  const keyAppSelect = document.getElementById("keyAppSelect");
  const keyPlanSelect = document.getElementById("keyPlanSelect");
  const keyBulk = document.getElementById("keyBulk");
  const saveKeysBtn = document.getElementById("saveKeysBtn");

  /* ================= STATE ================= */
  let APPS = [];
  let EDIT_ID = null;
  let KEY_CHANNEL = null;
  let APP_CHANNEL = null;

  /* ================= NAVIGATION ================= */
  navButtons.forEach(btn => {
    btn.onclick = () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      Object.values(pages).forEach(p => p.classList.remove("active"));
      pages[btn.dataset.page].classList.add("active");

      if (btn.dataset.page === "keys") loadKeys();
      if (btn.dataset.page === "add-keys") initAddKeys();
    };
  });

  /* ================= LOAD APPS ================= */
  async function loadApps() {
    const { data } = await supabase
      .from("apps")
      .select("*, plans(*)")
      .order("created_at", { ascending: false });

    APPS = data || [];
    renderApps();
    updateDashboard();
    populateKeyAppFilters();
  }

  /* ================= DASHBOARD ================= */
  function updateDashboard() {
    statApps.textContent = APPS.length;
    statPlans.textContent = APPS.reduce((s, a) => s + a.plans.length, 0);
  }

  /* ================= APPS LIST ================= */
  function renderApps() {
    appsList.innerHTML = "";
    APPS
      .filter(a => appFilter.value === "all" || a.platform === appFilter.value)
      .forEach(app => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <b>${app.name}</b><br>
          <small>${app.platform}</small><br>
          <button>Edit</button>
        `;
        div.querySelector("button").onclick = () => openEdit(app);
        appsList.appendChild(div);
      });
  }

  appFilter.onchange = renderApps;

  /* ================= ADD / EDIT APP ================= */
  function openAdd() {
    EDIT_ID = null;
    formTitle.textContent = "Add App";
    deleteAppBtn.classList.add("hidden");
    appName.value = "";
    description.value = "";
    plansBox.innerHTML = "";
  }

  function openEdit(app) {
    EDIT_ID = app.id;
    formTitle.textContent = "Edit App";
    deleteAppBtn.classList.remove("hidden");

    appName.value = app.name;
    platform.value = app.platform;
    description.value = app.description || "";
    plansBox.innerHTML = "";

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
    plansBox.appendChild(row);
  }

  saveAppBtn.onclick = async () => {
    if (!appName.value.trim()) return alert("App name required");

    let iconUrl = null;

    if (iconFile.files[0]) {
      const file = iconFile.files[0];
      const path = `${Date.now()}-${file.name}`;
      await supabase.storage.from("app-icons").upload(path, file, { upsert: true });
      iconUrl = supabase.storage.from("app-icons").getPublicUrl(path).data.publicUrl;
    }

    let app;
    if (EDIT_ID) {
      const res = await supabase
        .from("apps")
        .update({
          name: appName.value,
          platform: platform.value,
          description: description.value,
          ...(iconUrl && { icon_url: iconUrl })
        })
        .eq("id", EDIT_ID)
        .select()
        .single();

      app = res.data;
      await supabase.from("plans").delete().eq("app_id", EDIT_ID);
    } else {
      const res = await supabase
        .from("apps")
        .insert({
          name: appName.value,
          platform: platform.value,
          description: description.value,
          icon_url: iconUrl
        })
        .select()
        .single();
      app = res.data;
    }

    for (const row of plansBox.children) {
      const label = row.children[0].value;
      const price = row.children[1].value;
      if (label && price) {
        await supabase.from("plans").insert({
          app_id: app.id,
          label,
          price
        });
      }
    }

    openAdd();
    loadApps();
    document.querySelector('[data-page="apps"]').click();
  };

  deleteAppBtn.onclick = async () => {
    if (!EDIT_ID) return;
    await supabase.from("apps").delete().eq("id", EDIT_ID);
    openAdd();
    loadApps();
    document.querySelector('[data-page="apps"]').click();
  };

  /* ================= KEYS ================= */
  async function loadKeys() {
    const { data } = await supabase
      .from("keys")
      .select("id, key_value, is_used, apps(name,id), plans(label)")
      .order("created_at", { ascending: false });

    statKeys.textContent = data.length;
    renderKeys(data);
  }

  function renderKeys(keys) {
    let list = [...keys];
    if (filterApp.value)
      list = list.filter(k => k.apps?.id === filterApp.value);
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
        <td>${k.apps?.name}</td>
        <td>${k.plans?.label}</td>
        <td>${k.key_value}</td>
        <td>${k.is_used ? "Used" : "Available"}</td>
        <td><button class="delete-btn">Delete</button></td>
      `;
      tr.querySelector("button").onclick = async () => {
        await supabase.from("keys").delete().eq("id", k.id);
        loadKeys();
      };
      keysTableBody.appendChild(tr);
    });
  }

  filterApp.onchange = loadKeys;
  filterStatus.onchange = loadKeys;

  /* ================= ADD KEYS ================= */
  function populateKeyAppFilters() {
    filterApp.innerHTML = `<option value="">All Apps</option>`;
    keyAppSelect.innerHTML = "";

    APPS.forEach(a => {
      const o1 = document.createElement("option");
      o1.value = a.id;
      o1.textContent = a.name;
      filterApp.appendChild(o1);

      const o2 = document.createElement("option");
      o2.value = a.id;
      o2.textContent = a.name;
      keyAppSelect.appendChild(o2);
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
    const keys = keyBulk.value.split("\n").map(k => k.trim()).filter(Boolean);
    for (const k of keys) {
      await supabase.from("keys").insert({
        app_id: keyAppSelect.value,
        plan_id: keyPlanSelect.value,
        key_value: k
      });
    }
    keyBulk.value = "";
    loadKeys();
  };

  /* ================= REALTIME ================= */
  APP_CHANNEL = supabase
    .channel("apps-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, loadApps)
    .subscribe();

  KEY_CHANNEL = supabase
    .channel("keys-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "keys" }, loadKeys)
    .subscribe();

  /* ================= INIT ================= */
  openAdd();
  loadApps();

});

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "admin-login.html";
  };
}
