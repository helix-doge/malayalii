const API = "https://malayali-store-backend.onrender.com"; // Render backend URL

const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");

let ALL_APPS = [];
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;

/* LOAD APPS */
async function loadApps() {
  const res = await fetch(`${API}/api/apps`);
  ALL_APPS = await res.json();
}

loadApps();

/* HERO → APPS */
function openApps(platform) {
  CURRENT_PLATFORM = platform;

  heroPage.classList.remove("active");
  plansPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  renderApps();
}

/* APPS RENDER */
function renderApps() {
  appGrid.innerHTML = "";

  ALL_APPS
    .filter(app => app.platform === CURRENT_PLATFORM)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";

      div.innerHTML = `
        <img src="${app.icon_url || ''}">
        <h4>${app.name}</h4>
        <p>${app.description || ''}</p>
      `;

      div.onclick = () => openPlans(app);
      appGrid.appendChild(div);
    });
}

/* APPS → PLANS */
function openPlans(app) {
  CURRENT_APP = app;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = app.name + " Plans";

  renderPlans();
}

/* PLANS RENDER */
function renderPlans() {
  plansGrid.innerHTML = "";

  (CURRENT_APP.plans || []).forEach(plan => {
    const div = document.createElement("div");
    div.className = "plan-card";

    div.innerHTML = `
      <h4>${plan.label}</h4>
      <p>₹ ${plan.price}</p>
    `;

    plansGrid.appendChild(div);
  });
}

/* BACK */
function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}
