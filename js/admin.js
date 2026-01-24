/* ===============================
   SUPABASE CONFIG (FRONTEND)
================================ */
const SUPABASE_URL = "https://dytrdmvicireccasxxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XXXXXXXXXXXXXXXX";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   DOM ELEMENTS
================================ */
const appNameInput = document.getElementById("appName");
const appDescInput = document.getElementById("appDesc");
const platformSelect = document.getElementById("platformSelect");
const appIconInput = document.getElementById("appIcon");
const plansListDiv = document.getElementById("plansList");
const appsListDiv = document.getElementById("appsList");
const formTitle = document.getElementById("formTitle");

/* ===============================
   STATE
================================ */
let editingId = null;
let plans = [];

/* ===============================
   LOAD APPS
================================ */
async function loadApps() {
  const res = await fetch("/api/apps");
  const apps = await res.json();

  appsListDiv.innerHTML = "";

  apps.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-item";

    div.innerHTML = `
      <strong>${app.name}</strong> (${app.platform})
      <p>${app.description || ""}</p>
      <button onclick='editApp(${JSON.stringify(app)})'>Edit</button>
      <button onclick="deleteApp('${app.id}')">Delete</button>
    `;

    appsListDiv.appendChild(div);
  });
}

loadApps();

/* ===============================
   PLANS
================================ */
function addPlan() {
  plans.push({ label: "", price: "" });
  renderPlans();
}

function removePlan(index) {
  plans.splice(index, 1);
  renderPlans();
}

function renderPlans() {
  plansListDiv.innerHTML = "";

  plans.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "plan-row";

    row.innerHTML = `
      <input
        placeholder="1 DAY / 1 WEEK / 1 MONTH"
        value="${p.label}"
        oninput="plans[${i}].label = this.value"
      >
      <input
        placeholder="Price"
        value="${p.price}"
        oninput="plans[${i}].price = this.value"
      >
      <button onclick="removePlan(${i})">X</button>
    `;

    plansListDiv.appendChild(row);
  });
}

/* ===============================
   SAVE APP
================================ */
async function saveApp() {
  const name = appNameInput.value.trim();
  const description = appDescInput.value.trim();
  const platform = platformSelect.value;
  const file = appIconInput.files[0];

  if (!name) {
    alert("App name is required");
    return;
  }

  let icon_url = null;

  if (file) {
    const { data, error } = await supabase.storage
      .from("app-icons")
      .upload(Date.now() + "-" + file.name, file);

    if (error) {
      alert("Icon upload failed");
      return;
    }

    icon_url =
      `${SUPABASE_URL}/storage/v1/object/public/app-icons/${data.path}`;
  }

  const payload = {
    name,
    description,
    platform,
    icon_url,
    plans
  };

  const method = editingId ? "PUT" : "POST";
  const url = editingId
    ? `/api/admin/app/${editingId}`
    : "/api/admin/app";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  resetForm();
  loadApps();
}

/* ===============================
   EDIT APP
================================ */
function editApp(app) {
  editingId = app.id;
  formTitle.innerText = "Edit App";

  appNameInput.value = app.name;
  appDescInput.value = app.description || "";
  platformSelect.value = app.platform;

  plans = app.plans || [];
  renderPlans();
}

/* ===============================
   DELETE APP
================================ */
async function deleteApp(id) {
  if (!confirm("Delete this app?")) return;

  await fetch(`/api/admin/app/${id}`, { method: "DELETE" });
  loadApps();
}

/* ===============================
   RESET FORM
================================ */
function resetForm() {
  editingId = null;
  appNameInput.value = "";
  appDescInput.value = "";
  appIconInput.value = "";
  plans = [];
  renderPlans();
  formTitle.innerText = "Add App";
}
