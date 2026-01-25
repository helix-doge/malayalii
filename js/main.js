document.addEventListener("DOMContentLoaded", () => {

  const API = "https://malayali-store-backend.onrender.com/api/apps";

  // Pages
  const home = document.getElementById("home");
  const apps = document.getElementById("apps");
  const plans = document.getElementById("plans");

  // Buttons
  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");
  const backBtn = document.getElementById("backBtn");
  const plansBackBtn = document.getElementById("plansBackBtn");

  // Containers
  const appGrid = document.getElementById("appGrid");
  const appsTitle = document.getElementById("appsTitle");
  const plansGrid = document.getElementById("plansGrid");
  const plansTitle = document.getElementById("plansTitle");

  let ALL_APPS = [];
  let CURRENT_PLATFORM = "";
  let CURRENT_APP = null;

  async function loadApps() {
    const res = await fetch(API);
    ALL_APPS = await res.json();
  }

  /* ---------- NAVIGATION ---------- */

  function showHome() {
    apps.classList.remove("show");
    plans.classList.remove("show");
    home.classList.add("show");
  }

  function showApps(platform) {
    CURRENT_PLATFORM = platform;

    home.classList.remove("show");
    plans.classList.remove("show");
    apps.classList.add("show");

    appsTitle.textContent =
      platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

    appGrid.innerHTML = "Loading...";

    loadApps().then(renderApps);
  }

  function showPlans(app) {
    CURRENT_APP = app;

    apps.classList.remove("show");
    plans.classList.add("show");

    plansTitle.textContent = app.name + " Plans";

    renderPlans();
  }

  /* ---------- RENDER ---------- */

  function renderApps() {
    appGrid.innerHTML = "";

    const list = ALL_APPS.filter(a => a.platform === CURRENT_PLATFORM);

    if (!list.length) {
      appGrid.innerHTML = "<p style='text-align:center'>No apps available</p>";
      return;
    }

    list.forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";

      div.innerHTML = `
        <img src="${app.icon_url || ""}">
        <h4>${app.name}</h4>
        <p>${app.description || ""}</p>
      `;

      div.onclick = () => showPlans(app);
      appGrid.appendChild(div);
    });
  }

  function renderPlans() {
    plansGrid.innerHTML = "";

    if (!CURRENT_APP.plans || CURRENT_APP.plans.length === 0) {
      plansGrid.innerHTML =
        "<p style='text-align:center'>No plans available</p>";
      return;
    }

    CURRENT_APP.plans.forEach(plan => {
      const div = document.createElement("div");
      div.className = "plan-card";

      div.innerHTML = `
        <h4>${plan.label}</h4>
        <p>₹ ${plan.price}</p>
        <button>Buy Now</button>
      `;

      plansGrid.appendChild(div);
    });
  }

  /* ---------- EVENTS ---------- */

  androidBtn.onclick = () => showApps("android");
  iosBtn.onclick = () => showApps("ios");

  backBtn.onclick = showHome;
  plansBackBtn.onclick = () => showApps(CURRENT_PLATFORM);

});
