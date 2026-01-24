document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     SUPABASE CONFIG
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
  const appName = document.getElementById("appName");
  const appDesc = document.getElementById("appDesc");
  const platformSelect = document.getElementById("platformSelect");
  const appIcon = document.getElementById("appIcon");
  const plansList = document.getElementById("plansList");
  const appsList = document.getElementById("appsList");
  const formTitle = document.getElementById("formTitle");

  const addPlanBtn = document.getElementById("addPlanBtn");
  const saveAppBtn = document.getElementById("saveAppBtn");

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

    appsList.innerHTML = "";

    apps.forEach(app => {
      const div = document.createElement("div");
      div.className = "app-item";

      div.innerHTML = `
        <strong>${app.name}</strong> (${app.platform})
        <p>${app.description || ""}</p>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      `;

      div.querySelector(".edit-btn").addEventListener("click", () => editApp(app));
      div.querySelector(".delete-btn").addEventListener("click", () => deleteApp(app.id));

      appsList.appendChild(div);
    });
  }

  loadApps();

  /* ===============================
     PLANS
  ================================ */
  function renderPlans() {
    plansList.innerHTML = "";

    plans.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "plan-row";

      const label = document.createElement("input");
      label.placeholder = "1 DAY / 1 WEEK / 1 MONTH";
      label.value = p.label;
      label.oninput = e => plans[i].label = e.target.value;

      const price = document.createElement("input");
      price.placeholder = "Price";
      price.value = p.price;
      price.oninput = e => plans[i].price = e.target.value;

      const del = document.createElement("button");
      del.textContent = "X";
      del.onclick = () => {
        plans.splice(i, 1);
        renderPlans();
      };

      row.append(label, price, del);
      plansList.appendChild(row);
    });
  }

  addPlanBtn.addEventListener("click", () => {
    plans.push({ label: "", price: "" });
    renderPlans();
  });

  /* ===============================
     SAVE APP
  ================================ */
  saveAppBtn.addEventListener("click", async () => {

    if (!appName.value.trim()) {
      alert("App name required");
      return;
    }

    let icon_url = null;
    const file = appIcon.files[0];

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
      name: appName.value,
      description: appDesc.value,
      platform: platformSelect.value,
      icon_url,
      plans
    };

    const url = editingId
      ? `/api/admin/app/${editingId}`
      : "/api/admin/app";

    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    resetForm();
    loadApps();
  });

  /* ===============================
     EDIT / DELETE
  ================================ */
  function editApp(app) {
    editingId = app.id;
    formTitle.textContent = "Edit App";

    appName.value = app.name;
    appDesc.value = app.description || "";
    platformSelect.value = app.platform;

    plans = app.plans || [];
    renderPlans();
  }

  async function deleteApp(id) {
    if (!confirm("Delete this app?")) return;
    await fetch(`/api/admin/app/${id}`, { method: "DELETE" });
    loadApps();
  }

  /* ===============================
     RESET
  ================================ */
  function resetForm() {
    editingId = null;
    appName.value = "";
    appDesc.value = "";
    appIcon.value = "";
    plans = [];
    renderPlans();
    formTitle.textContent = "Add App";
  }

});
