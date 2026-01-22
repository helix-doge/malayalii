/* ===============================
   SUPABASE CONFIG
================================ */
const SUPABASE_URL = "https://dytrdmvicireccasxxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   STATE
================================ */
let editingAppId = null;
let plans = [];

/* ===============================
   LOAD EXISTING APPS
================================ */
async function loadApps() {
  const res = await fetch("/api/apps");
  const apps = await res.json();

  const list = document.getElementById("appsList");
  list.innerHTML = "";

  apps.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-item";
    div.innerHTML = `
      <strong>${app.name}</strong> (${app.platform})
      <p>${app.description}</p>
      <div class="app-actions">
        <button onclick='editApp(${JSON.stringify(app)})'>Edit</button>
        <button onclick="deleteApp('${app.id}')">Delete</button>
      </div>
    `;
    list.appendChild(div);
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

function renderPlans() {
  const container = document.getElementById("plansList");
  container.innerHTML = "";

  plans.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "plan-row";
    row.innerHTML = `
      <input placeholder="1 DAY / 1 WEEK / 1 MONTH"
             value="${p.label}"
             onchange="plans[${i}].label=this.value">
      <input placeholder="Price"
             value="${p.price}"
             onchange="plans[${i}].price=this.value">
      <button onclick="removePlan(${i})">X</button>
    `;
    container.appendChild(row);
  });
}

function removePlan(index) {
  plans.splice(index, 1);
  renderPlans();
}

/* ===============================
   SAVE APP
================================ */
async function saveApp() {
  const name = appName.value.trim();
  const description = appDesc.value.trim();
  const platform = document.getElementById("platform").value;
  const file = appIcon.files[0];

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

  await fetch("/api/admin/app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      platform,
      icon_url,
      plans
    })
  });

  resetForm();
  loadApps();
}

/* ===============================
   EDIT / DELETE
================================ */
function editApp(app) {
  editingAppId = app.id;
  formTitle.innerText = "Edit App";

  appName.value = app.name;
  appDesc.value = app.description;
  platform.value = app.platform;

  plans = app.plans || [];
  renderPlans();
}

async function deleteApp(id) {
  if (!confirm("Delete this app?")) return;

  await fetch(`/api/admin/app/${id}`, {
    method: "DELETE"
  });

  loadApps();
}

/* ===============================
   RESET FORM
================================ */
function resetForm() {
  editingAppId = null;
  appName.value = "";
  appDesc.value = "";
  appIcon.value = "";
  plans = [];
  renderPlans();
  formTitle.innerText = "Add New App";
}
