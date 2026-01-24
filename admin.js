document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin JS loaded");

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

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2500);
  }

  function renderPlans() {
    plansBox.innerHTML = "";

    PLANS.forEach((plan, index) => {
      const div = document.createElement("div");

      const label = document.createElement("input");
      label.placeholder = "1 DAY / 1 WEEK / 1 MONTH";
      label.value = plan.label;
      label.oninput = e => PLANS[index].label = e.target.value;

      const price = document.createElement("input");
      price.placeholder = "Price";
      price.value = plan.price;
      price.oninput = e => PLANS[index].price = e.target.value;

      div.appendChild(label);
      div.appendChild(price);
      plansBox.appendChild(div);
    });
  }

  function addPlan() {
    console.log("Add Plan clicked");
    PLANS.push({ label: "", price: "" });
    renderPlans();
  }

  async function saveApp() {
    console.log("Save App clicked");

    const name = document.getElementById("name").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const platform = document.getElementById("platform").value;
    const file = document.getElementById("icon").files[0];

    if (!name) {
      showToast("App name required");
      return;
    }

    let icon_url = null;

    if (file) {
      const { data, error } = await supabase.storage
        .from("app-icons")
        .upload(`icons/${Date.now()}-${file.name}`, file, { upsert: true });

      if (error) {
        showToast("Icon upload failed");
        return;
      }

      icon_url =
        `https://dytrdmvicireccasxxvj.supabase.co/storage/v1/object/public/app-icons/${data.path}`;
    }

    const cleanPlans = PLANS.filter(p => p.label && p.price);

    await fetch(`${API}/api/admin/app`, {
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

    PLANS = [];
    plansBox.innerHTML = "";
    document.getElementById("name").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("icon").value = "";

    showToast("App saved successfully");
    loadApps();
  }

  async function loadApps() {
    const res = await fetch(`${API}/api/apps`);
    const apps = await res.json();

    appsBox.innerHTML = "";
    apps.forEach(app => {
      const div = document.createElement("div");
      div.textContent = `${app.name} (${app.platform})`;
      appsBox.appendChild(div);
    });
  }

  // 🔗 BUTTON BINDINGS (THIS FIXES EVERYTHING)
  addPlanBtn.addEventListener("click", addPlan);
  saveAppBtn.addEventListener("click", saveApp);

  loadApps();
});
