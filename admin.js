import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let APPS = [];
let EDIT_ID = null;

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
      loadKeyDropdowns();
      loadKeyStats();
    }
  };
});

/* ================= LOAD APPS ================= */
async function loadApps() {
  const { data, error } = await supabase
    .from("apps")
    .select("*, plans(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load apps failed", error);
    return;
  }

  APPS = data || [];
  renderApps();
  updateDashboard();
}

/* ================= DASHBOARD ================= */
function updateDashboard() {
  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s, a) => s + a.plans.length, 0);
}

/* ================= APPS LIST ================= */
function renderApps() {
  appsList.innerHTML = "";
  const filter = appFilter.value;

  APPS
    .filter(a => filter === "all" || a.platform === filter)
    .forEach(app => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform}</small><br>
        <button>Edit</button>
      `;

      card.querySelector("button").onclick = () => openEdit(app);
      appsList.appendChild(card);
    });
}

appFilter.onchange = renderApps;

/* ================= ADD MODE ================= */
function openAdd() {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteAppBtn.classList.add("hidden");

  appName.value = "";
  description.value = "";
  iconFile.value = "";
  plans.innerHTML = "";
}

/* ================= EDIT MODE ================= */
function openEdit(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteAppBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";
  iconFile.value = "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlanRow(p.label, p.price));

  document.querySelector('[data-page="add"]').click();
}

/* ================= PLANS ================= */
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

/* ================= SAVE APP ================= */
saveAppBtn.onclick = async () => {
  if (!appName.value.trim()) return;

  let iconUrl = null;

  /* ICON UPLOAD */
  if (iconFile.files[0]) {
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const upload = await supabase.storage
      .from("app-icons")
      .upload(path, file, { upsert: true });

    if (upload.error) {
      console.error(upload.error);
      return;
    }

    iconUrl = supabase.storage
      .from("app-icons")
      .getPublicUrl(path).data.publicUrl;
  }

  let app;

  if (EDIT_ID) {
    /* UPDATE */
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
    /* INSERT */
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

  /* SAVE PLANS */
  for (const row of plans.children) {
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

  loadApps();
  document.querySelector('[data-page="apps"]').click();
};

/* ================= DELETE APP ================= */
deleteAppBtn.onclick = async () => {
  if (!EDIT_ID) return;

  await supabase.from("apps").delete().eq("id", EDIT_ID);
  loadApps();
  document.querySelector('[data-page="apps"]').click();
};

async function loadKeys() {
  const res = await fetch("/api/admin/keys");
  const keys = await res.json();

  const filterApp = document.getElementById("filterApp").value;
  const filterStatus = document.getElementById("filterStatus").value;

  let filtered = keys;

  if (filterApp) {
    filtered = filtered.filter(k => k.app_id === filterApp);
  }

  if (filterStatus === "available") {
    filtered = filtered.filter(k => !k.is_used);
  }

  if (filterStatus === "used") {
    filtered = filtered.filter(k => k.is_used);
  }

  renderKeys(filtered);
}

function renderKeys(keys) {
  const tbody = document.getElementById("keysTableBody");
  tbody.innerHTML = "";

  let total = keys.length;
  let available = keys.filter(k => !k.is_used).length;
  let used = keys.filter(k => k.is_used).length;

  document.getElementById("totalKeys").textContent = total;
  document.getElementById("availableKeys").textContent = available;
  document.getElementById("usedKeys").textContent = used;

  keys.forEach(k => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${k.app_name}</td>
      <td>${k.plan_label}</td>
      <td>${k.key_value}</td>
      <td>${k.is_used ? "Used" : "Available"}</td>
      <td>
        <button class="delete-btn" onclick="deleteKey('${k.id}')">
          Delete
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function deleteKey(keyId) {
  if (!confirm("Delete this key permanently?")) return;

  await fetch(`/api/admin/keys/${keyId}`, {
    method: "DELETE"
  });

  loadKeys();
}


/* ================= KEYS ================= */
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
    o.textContent = `${p.label} – ₹${p.price}`;
    keyPlan.appendChild(o);
  });
}

keyApp.onchange = loadKeyPlans;

saveKeysBtn.onclick = async () => {
  const keys = keyBulk.value
    .split("\n")
    .map(k => k.trim())
    .filter(Boolean);

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

/* ================= KEY STATS ================= */
async function loadKeyStats() {
  const { data } = await supabase.from("keys").select("*");

  statKeys.textContent = data.length;
  totalKeys.textContent = data.length;
  usedKeys.textContent = data.filter(k => k.is_used).length;
  freeKeys.textContent = data.filter(k => !k.is_used).length;
}

/* ================= INIT ================= */
openAdd();
loadApps();
