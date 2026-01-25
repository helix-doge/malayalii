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

  // Details
  const detailsIcon = document.getElementById("detailsIcon");
  const detailsName = document.getElementById("detailsName");
  const planSelect = document.querySelector(".plan-select");

  let ALL_APPS = [];
  let CURRENT_PLATFORM = "";
  let CURRENT_APP = null;

  /* ================= FETCH FROM DB ================= */
  async function loadApps() {
    const res = await fetch(API);
    ALL_APPS = await res.json();
  }

  /* ================= NAVIGATION ================= */
  function showPage(page) {
    [home, apps, details].forEach(p => p.classList.remove("show"));
    page.classList.add("show");
  }

  /* ================= HOME → APPS ================= */
  function openApps(platform) {
    CURRENT_PLATFORM = platform;
    showPage(apps);

    appsTitle.textContent =
      platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

    appGrid.innerHTML = "Loading apps...";
    loadApps().then(renderApps);
  }

  /* ================= APPS → DETAILS ================= */
  function openDetails(app) {
    CURRENT_APP = app;
    showPage(details);

    detailsName.textContent = app.name;
    detailsIcon.src = app.icon_url || "";

    renderPlans(app.plans);
  }

  /* ================= RENDER APPS ================= */
  function renderApps() {
    appGrid.innerHTML = "";

    const list = ALL_APPS.filter(
      app => app.platform === CURRENT_PLATFORM
    );

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

  /* ================= RENDER PLANS (DB ONLY) ================= */
  function renderPlans(plans) {
    planSelect.innerHTML = "<h3>Select Plan</h3>";

    if (!plans || plans.length === 0) {
      planSelect.innerHTML +=
        "<p style='text-align:center;color:#aaa'>No plans available</p>";
      return;
    }

    plans.forEach(plan => {
      const label = document.createElement("label");

      label.innerHTML = `
        <div class="plan-left">
          <input type="radio" name="plan" value="${plan.id}">
          <span>${plan.label}</span>
        </div>
        <div class="plan-price">₹ ${plan.price}</div>
      `;

      planSelect.appendChild(label);
    });
  }

  /* ================= EVENTS ================= */
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

    const planId = selected.value;

    alert(
      `Buying plan ID ${planId} for ${CURRENT_APP.name}`
    );
  };

});
