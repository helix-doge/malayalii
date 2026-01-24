document.addEventListener("DOMContentLoaded", () => {

  const API = "https://malayali-store-backend.onrender.com";

  const supabase = window.supabase.createClient(
    "https://dytrdmvicireccasxxvj.supabase.co",
    "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
  );

  const plansBox = document.getElementById("plans");
  const appsBox = document.getElementById("apps");
  const toast = document.getElementById("toast");

  const addPlanBtn = document.getElementById("addPlanBtn");
  const saveAppBtn = document.getElementById("saveAppBtn");

  let PLANS = [];
  let SAVING = false;

  function showToast(msg, error = false) {
    toast.textContent = msg;
    toast.style.background = error ? "#ef4444" : "#22c55e";
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
  }

  /* ---------- PLANS ---------- */
  function renderPlans() {
    plansBox.innerHTML = "";
    PLANS.forEach((p, i) => {
      const div = document.createElement("div");

      const label = document.createElement("input");
      label.placeholder = "1 DAY / 1 WEEK / 1 MONTH";
      label.value = p.label;
      label.oninput = e => PLANS[i].label = e.target.value;

      const price = document.createElement("input");
      price.placeholder = "Price";
      price.value = p.price;
      price.oninput = e => PLANS[i].price = e.target.value;

      div.appendChild(label);
      div.appendChild(price);
      plansBox.appendChild(div);
    });
  }

  function addPlan() {
    PLANS.push({ label: "", price: "" });
    renderPlans();
  }

  /* ---------- SAVE APP ---------- */
  async function saveApp() {
    if (SAVING) return;
    SAVING = true;

    saveAppBtn.textContent = "Saving...";
    saveAppBtn.disabled = true;

    const name = document.getElementById("name").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const platform = document.getElementById("platform").value;
    const file = document.getElementById("icon").files[0];

    if (!name) {
      showToast("App name required", true);
      resetSave();
      return;
    }

    let icon_url = null;

    if (file) {
      const { data, error } = await supabase.storage
        .from("app-icons")
        .upload(`icons/${Date.now()}-${file.name}`, file, { upsert: true });

      if (error) {
        showToast("Icon upload failed", true);
        resetSave();
        return;
      }

      icon_url =
        `https://dytrdmvicireccasxxvj.supabase.co/storage/v1/object/public/app-icons/${data.path}`;
    }

    const cleanPlans = PLANS.filter(p => p.label && p.price);

    const res = await fetch(`${API}/api/admin/app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: desc,
        platform,
        icon_url,
        plans: cleanPlans
      })
    });

    if (!res.ok) {
      showToast("Save failed", true);
      resetSave();
      return;
    }

    showToast("App saved");

    PLANS = [];
    plansBox.innerHTML = "";
    document.getElementById("name").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("icon").value = "";

    resetSave();
    await loadApps(); // 🔁 FORCE REFRESH
  }

  function resetSave() {
    SAVING = false;
    saveAppBtn.textContent = "Save App";
    saveAppBtn.disabled = false;
  }

  /* ---------- LOAD APPS ---------- */
  async function loadApps() {
    const res = await fetch(`${API}/api/apps`);
    const apps = await res.json();

    appsBox.innerHTML = "";

    apps.forEach(app => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${app.name}</b> (${app.platform})`;
      appsBox.appendChild(div);
    });
  }

  addPlanBtn.addEventListener("click", addPlan);
  saveAppBtn.addEventListener("click", saveApp);

  loadApps();
});
