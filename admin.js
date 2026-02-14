import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= AUTH ================= */
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.replace("admin-login.html");
    return false;
  }
  return true;
}

checkAuth().then(ok => {
  if (!ok) return;
  initAdmin();
});

/* ================= STATE ================= */
let EDIT_APP_ID = null;
let ALL_APPS = [];

/* ================= INIT ================= */
function initAdmin() {
  setupLogout();
  setupNavigation();
  loadStats();
  loadApps();
  loadAppDropdowns();
}

/* ================= LOGOUT ================= */
function setupLogout() {
  document.getElementById("logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    window.location.replace("admin-login.html");
  };
}

/* ================= NAV ================= */
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
  const { count: apps } = await supabase.from("apps").select("*", { count: "exact", head: true });
  const { count: plans } = await supabase.from("plans").select("*", { count: "exact", head: true });
  const { count: keys } = await supabase.from("keys").select("*", { count: "exact", head: true });

  statApps.textContent = apps || 0;
  statPlans.textContent = plans || 0;
  statKeys.textContent = keys || 0;
}

/* ================= LOAD APPS ================= */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*");
  ALL_APPS = data;

  const list = document.getElementById("appsList");
  const filter = document.getElementById("appFilter").value;

  list.innerHTML = "";

  data
    .filter(a => filter === "all" || a.platform === filter)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform}</small><br>
        <button class="primary">Edit</button>
      `;
      div.querySelector("button").onclick = () => openEdit(app);
      list.appendChild(div);
    });

  loadAppDropdowns();
}

appFilter.onchange = loadApps;

/* ================= EDIT APP ================= */
async function openEdit(app) {
  EDIT_APP_ID = app.id;

  document.querySelector('[data-page="add"]').click();
  formTitle.textContent = "Edit App";
  cancelEditBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  plansDiv.innerHTML = "";
  plans.forEach(p => addPlanRow(p.label, p.price));
}

/* ================= PLAN ROW ================= */
function addPlanRow(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "plan-row";
  row.innerHTML = `
    <input value="${label}" placeholder="Plan">
    <input value="${price}" type="number" placeholder="Price">
    <button>X</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
}

addPlanBtn.onclick = () => addPlanRow();

/* ================= SAVE APP ================= */
saveAppBtn.onclick = async () => {
  const name = appName.value;
  if (!name) return alert("Enter app name");

  let appData;

  if (EDIT_APP_ID) {
    const { data } = await supabase
      .from("apps")
      .update({
        name,
        platform: platform.value,
        description: description.value
      })
      .eq("id", EDIT_APP_ID)
      .select()
      .single();

    appData = data;
    await supabase.from("plans").delete().eq("app_id", EDIT_APP_ID);
  } else {
    const { data } = await supabase
      .from("apps")
      .insert({
        name,
        platform: platform.value,
        description: description.value
      })
      .select()
      .single();

    appData = data;
  }

  document.querySelectorAll(".plan-row").forEach(async row => {
    const label = row.children[0].value;
    const price = row.children[1].value;

    if (label && price) {
      await supabase.from("plans").insert({
        app_id: appData.id,
        label,
        price
      });
    }
  });

  resetForm();
  loadApps();
  loadStats();
};

/* ================= RESET ================= */
cancelEditBtn.onclick = resetForm;

function resetForm() {
  EDIT_APP_ID = null;
  formTitle.textContent = "Add App";
  cancelEditBtn.classList.add("hidden");
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
}

/* ================= DROPDOWNS ================= */
async function loadAppDropdowns() {
  keyAppSelect.innerHTML = "";

  ALL_APPS.forEach(app => {
    const opt = document.createElement("option");
    opt.value = app.id;
    opt.textContent = app.name;
    keyAppSelect.appendChild(opt);
  });

  loadPlanDropdowns();
}

keyAppSelect.onchange = loadPlanDropdowns;

async function loadPlanDropdowns() {
  const appId = keyAppSelect.value;

  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", appId);

  keyPlanSelect.innerHTML = "";

  data.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.label} - ₹${p.price}`;
    keyPlanSelect.appendChild(opt);
  });
}

/* ================= ADD KEYS ================= */
saveKeysBtn.onclick = async () => {
  const keys = keyBulk.value.split("\n").map(k => k.trim()).filter(k => k);

  for (let k of keys) {
    await supabase.from("keys").insert({
      app_id: keyAppSelect.value,
      plan_id: keyPlanSelect.value,
      key_value: k,
      is_used: false
    });
  }

  keyBulk.value = "";
  alert("Keys saved");
  loadStats();
};

/* ================= VIEW KEYS ================= */
loadKeysBtn.onclick = async () => {
  let query = supabase
    .from("keys")
    .select("*, apps(name), plans(label)");

  if (filterApp.value) query = query.eq("app_id", filterApp.value);
  if (filterStatus.value === "available") query = query.eq("is_used", false);
  if (filterStatus.value === "used") query = query.eq("is_used", true);

  const { data } = await query;

  keysTableBody.innerHTML = "";

  let available = 0;
  let used = 0;

  data.forEach(k => {
    if (k.is_used) used++;
    else available++;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k.apps?.name}</td>
      <td>${k.plans?.label}</td>
      <td>${k.key_value}</td>
      <td>${k.is_used ? "Used" : "Available"}</td>
    `;
    keysTableBody.appendChild(tr);
  });

  totalKeys.textContent = data.length;
  availableKeys.textContent = available;
  usedKeys.textContent = used;
};
