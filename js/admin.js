document.addEventListener("DOMContentLoaded", () => {

  const SUPABASE_URL = "https://dytrdmvicireccasxxvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const appName = document.getElementById("appName");
  const appDesc = document.getElementById("appDesc");
  const platformSelect = document.getElementById("platformSelect");
  const appIcon = document.getElementById("appIcon");
  const plansList = document.getElementById("plansList");
  const appsList = document.getElementById("appsList");
  const toast = document.getElementById("toast");
  const formTitle = document.getElementById("formTitle");

  let editingId = null;
  let plans = [];

  /* ===============================
     TOAST
  ================================ */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

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
        <button>Edit</button>
        <button>Delete</button>
      `;

      div.children[2].onclick = () => editApp(app);
      div.children[3].onclick = () => deleteApp(app.id);

      appsList.appendChild(div);
    });
  }

  loadApps();

  /* ===============================
     REALTIME SYNC
  ================================ */
  supabase
    .channel("admin-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "apps" },
      () => loadApps()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "plans" },
      () => loadApps()
    )
    .subscribe();

  /* ===============================
     PLANS
  ================================ */
  function renderPlans() {
    plansList.innerHTML = "";

    plans.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "plan-row";
      row.innerHTML = `
        <input value="${p.label}" placeholder="1 DAY / 1 WEEK / 1 MONTH">
        <input value="${p.price}" placeholder="Price">
        <button>X</button>
      `;

      row.children[0].oninput = e => plans[i].label = e.target.value;
      row.children[1].oninput = e => plans[i].price = e.target.value;
      row.children[2].onclick = () => {
        plans.splice(i, 1);
        renderPlans();
      };

      plansList.appendChild(row);
    });
  }

  document.getElementById("addPlanBtn").onclick = () => {
    plans.push({ label: "", price: "" });
    renderPlans();
  };

  /* ===============================
     SAVE APP
  ================================ */
  document.getElementById("saveAppBtn").onclick = async () => {

    let icon_url = null;
    const file = appIcon.files[0];

    if (file) {
      const { data, error } = await supabase.storage
        .from("app-icons")
        .upload(`icons/${Date.now()}-${file.name}`, file, { upsert: true });

      if (error) return showToast("Icon upload failed");

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
    showToast("App saved");
  };

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
    await fetch(`/api/admin/app/${id}`, { method: "DELETE" });
    showToast("App deleted");
  }

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
