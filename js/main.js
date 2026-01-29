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

  /* ================= FETCH ================= */

  async function loadApps() {
    const res = await fetch(API);
    ALL_APPS = await res.json();
  }

  /* ================= NAVIGATION ================= */

  function showPage(page) {
    [home, apps, details].forEach(p => p.classList.remove("show"));
    page.classList.add("show");
  }

  function openApps(platform) {
    CURRENT_PLATFORM = platform;
    showPage(apps);

    appsTitle.textContent =
      platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

    appGrid.innerHTML = "Loading...";
    loadApps().then(renderApps);
  }

  function openDetails(app) {
    CURRENT_APP = app;
    showPage(details);

    detailsName.textContent = app.name;
    detailsIcon.src = app.icon_url || "";

    renderPlans(app.plans);
  }

  /* ================= RENDER ================= */

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

  function renderPlans(plans) {
    planSelect.innerHTML = "<h3>Select Plan</h3>";

    if (!plans || plans.length === 0) {
      planSelect.innerHTML +=
        "<p style='text-align:center;color:#aaa'>No plans available</p>";
      return;
    }

    plans.forEach(plan => {
      const isSoldOut = !plan.available_keys || plan.available_keys <= 0;

      const label = document.createElement("label");
      label.className = isSoldOut ? "plan-disabled" : "";

      label.innerHTML = `
        <span>
          <input 
            type="radio" 
            name="plan" 
            value="${plan.id}"
            ${isSoldOut ? "disabled" : ""}
          >
          ${plan.label}
          ${isSoldOut ? '<span class="sold-out-badge">SOLD OUT</span>' : ''}
        </span>
        <span class="plan-price">₹ ${plan.price}</span>
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
      alert("Please select an available plan");
      return;
    }

    alert(
      `Proceeding to buy plan for ${CURRENT_APP.name}`
    );
  };

});
