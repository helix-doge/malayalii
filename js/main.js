document.addEventListener("DOMContentLoaded", () => {

  const API = "https://malayali-store-backend.onrender.com/api/apps";

  // Pages
  const home = document.getElementById("home");
  const apps = document.getElementById("apps");
  const details = document.getElementById("appDetails");

  // Buttons
  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");
  const backBtn = document.getElementById("backBtn");
  const detailsBackBtn = document.getElementById("detailsBackBtn");
  const buyBtn = document.getElementById("buyBtn");

  // Containers
  const appGrid = document.getElementById("appGrid");
  const appsTitle = document.getElementById("appsTitle");

  // Details elements
  const detailsIcon = document.getElementById("detailsIcon");
  const detailsName = document.getElementById("detailsName");
  const planSelect = document.querySelector(".plan-select");

  let ALL_APPS = [];
  let CURRENT_PLATFORM = "";
  let CURRENT_APP = null;

  // Default prices (fallback)
  const DEFAULT_PLANS = [
    { label: "1 DAY", price: 199 },
    { label: "1 WEEK", price: 499 },
    { label: "1 MONTH", price: 999 }
  ];

  async function loadApps() {
    const res = await fetch(API);
    ALL_APPS = await res.json();
  }

  /* ---------- PAGE CONTROL ---------- */
  function showPage(page) {
    [home, apps, details].forEach(p => p.classList.remove("show"));
    page.classList.add("show");
  }

  /* ---------- HOME → APPS ---------- */
  function openApps(platform) {
    CURRENT_PLATFORM = platform;
    showPage(apps);

    appsTitle.textContent =
      platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

    appGrid.innerHTML = "Loading...";
    loadApps().then(renderApps);
  }

  /* ---------- APPS → DETAILS ---------- */
  function openDetails(app) {
    CURRENT_APP = app;
    showPage(details);

    detailsName.textContent = app.name;
    detailsIcon.src = app.icon_url || "";

    renderPlans(app.plans || DEFAULT_PLANS);
  }

  /* ---------- RENDER APPS ---------- */
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
      div.onclick = () => openDetails(app);
      appGrid.appendChild(div);
    });
  }

  /* ---------- RENDER PLANS ---------- */
  function renderPlans(plans) {
    planSelect.innerHTML = "<h3>Select Plan</h3>";

    plans.forEach(plan => {
      const label = document.createElement("label");
      label.innerHTML = `
        <span>
          <input type="radio" name="plan" value="${plan.label}">
          ${plan.label}
        </span>
        <span class="plan-price">₹ ${plan.price}</span>
      `;
      planSelect.appendChild(label);
    });
  }

  /* ---------- EVENTS ---------- */
  androidBtn.onclick = () => openApps("android");
  iosBtn.onclick = () => openApps("ios");

  backBtn.onclick = () => showPage(home);
  detailsBackBtn.onclick = () => showPage(apps);

  buyBtn.onclick = () => {
    const selected = document.querySelector("input[name='plan']:checked");
    if (!selected) {
      alert("Please select a plan");
      return;
    }

    const plan = selected.value;
    alert(`Buying ${plan} for ${CURRENT_APP.name}`);
  };

});
