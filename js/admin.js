const SUPABASE_URL = "https://dytrdmvicireccasxxvj.supabase.co";
const SUPABASE_KEY = "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let editingId = null;
let plans = [];

/* LOAD APPS */
async function loadApps() {
  const res = await fetch("/api/apps");
  const apps = await res.json();

  appsList.innerHTML = "";

  apps.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-item";
    div.innerHTML = `
      <strong>${app.name}</strong> (${app.platform})
      <p>${app.description || ""}</p>
      <button onclick='editApp(${JSON.stringify(app)})'>Edit</button>
      <button onclick="deleteApp('${app.id}')">Delete</button>
    `;
    appsList.appendChild(div);
  });
}

loadApps();

/* PLANS */
function addPlan() {
  plans.push({ label: "", price: "" });
  renderPlans();
}

function renderPlans() {
  plansList.innerHTML = "";
  plans.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "plan-row";
    row.innerHTML = `
      <input placeholder="1 DAY / 1 WEEK / 1 MONTH"
        value="${p.label}"
        oninput="plans[${i}].label=this.value">
      <input placeholder="Price"
        value="${p.price}"
        oninput="plans[${i}].price=this.value">
      <button onclick="removePlan(${i})">X</button>
    `;
    plansList.appendChild(row);
  });
}

function removePlan(i) {
  plans.splice(i, 1);
  renderPlans();
}

/* SAVE APP */
async function saveApp() {
  const name = appName.value.trim();
  const description = appDesc.value.trim();
  const platform = platformSelect.value;
  const file = appIcon.files[0];

  if (!name) return alert("App name required");

  let icon_url = null;

  if (file) {
    const { data, error } = await supabase.storage
      .from("app-icons")
      .upload(Date.now() + "-" + file.name, file);

    if (error) return alert("Icon upload failed");

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

/* EDIT */
function editApp(app) {
  editingId = app.id;
  formTitle.innerText = "Edit App";

  appName.value = app.name;
  appDesc.value = app.description || "";
  platformSelect.value = app.platform;

  plans = app.plans || [];
  renderPlans();
}

/* DELETE */
async function deleteApp(id) {
  if (!confirm("Delete app?")) return;
  await fetch(`/api/admin/app/${id}`, { method: "DELETE" });
  loadApps();
}

/* RESET */
function resetForm() {
  editingId = null;
  appName.value = "";
  appDesc.value = "";
  appIcon.value = "";
  plans = [];
  renderPlans();
  formTitle.innerText = "Add App";
}
