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
    setTimeout(() => toast.style.display = "none", 2000);
  }

  function renderPlans() {
    plansBox.innerHTML = "";
    PLANS.forEach((p, i) => {
      const d = document.createElement("div");
      d.innerHTML = `
        <input placeholder="1 DAY / 1 WEEK / 1 MONTH" value="${p.label}">
        <input placeholder="Price" value="${p.price}">
      `;
      const [l, pr] = d.querySelectorAll("input");
      l.oninput = e => PLANS[i].label = e.target.value;
      pr.oninput = e => PLANS[i].price = e.target.value;
      plansBox.appendChild(d);
    });
  }

  function addPlan() {
    PLANS.push({ label: "", price: "" });
    renderPlans();
  }

  async function saveApp() {
    if (SAVING) return;
    SAVING = true;
    saveAppBtn.disabled = true;

    const name = document.getElementById("name").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const platform = document.getElementById("platform").value;
    const file = document.getElementById("icon").files[0];

    if (!name) {
      showToast("App name required", true);
      reset();
      return;
    }

    let icon_url = null;

    if (file) {
      const { data, error } = await supabase.storage
        .from("app-icons")
        .upload(`icons/${Date.now()}-${file.name}`, file, { upsert: true });

      if (error) {
        showToast("Icon upload failed", true);
        reset();
        return;
      }

      icon_url =
        `https://dytrdmvicireccasxxvj.supabase.co/storage/v1/object/public/app-icons/${data.path}`;
    }

    const res = await fetch(`${API}/api/admin/app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: desc,
        platform,
        icon_url,
        plans: PLANS.filter(p => p.label && p.price)
      })
    });

    if (!res.ok) {
      showToast("Save failed", true);
      reset();
      return;
    }

    showToast("App saved");
    PLANS = [];
    plansBox.innerHTML = "";
    document.getElementById("name").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("icon").value = "";

    reset();
  }

  function reset() {
    SAVING = false;
    saveAppBtn.disabled = false;
  }

  async function loadApps() {
    const res = await fetch(`${API}/api/apps?ts=${Date.now()}`);
    const apps = await res.json();
    appsBox.innerHTML = "";
    apps.forEach(a => {
      const d = document.createElement("div");
      d.textContent = `${a.name} (${a.platform})`;
      appsBox.appendChild(d);
    });
  }

  // 🔥 REALTIME TRIGGER
  supabase
    .channel("admin-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, loadApps)
    .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, loadApps)
    .subscribe();

  addPlanBtn.onclick = addPlan;
  saveAppBtn.onclick = saveApp;

  loadApps();
});
