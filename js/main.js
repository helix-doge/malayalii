// 🔗 BACKEND
const API = "https://malayali-store-backend.onrender.com";

// DOM elements
const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");
const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

// State
let ALL_APPS = [];
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;

/* ---------------- FETCH APPS ---------------- */
async function fetchApps() {
  try {
    const res = await fetch(`${API}/api/apps?ts=${Date.now()}`);
    ALL_APPS = await res.json();
  } catch (err) {
    console.error("Failed to fetch apps", err);
    ALL_APPS = [];
  }
}

/* ---------------- OPEN APPS PAGE ---------------- */
async function openApps(platform) {
  console.log("openApps clicked:", platform);

  CURRENT_PLATFORM = platform;

  await fetchApps();

  heroPage.classList.remove("active");
  plansPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  renderApps();
}

/* ---------------- RENDER APPS ---------------- */
function renderApps() {
  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(app => app.platform === CURRENT_PLATFORM);

  if (filtered.length === 0) {
    appGrid.innerHTML = "<p>No apps available</p>";
    return;
  }

  filtered.forEach(app => {
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

/* ---------------- OPEN PLANS ---------------- */
function openPlans(app) {
  CURRENT_APP = app;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = app.name + " Plans";
  plansGrid.innerHTML = "";

  if (!app.plans || app.plans.length === 0) {
    plansGrid.innerHTML = "<p>No plans available</p>";
    return;
  }

  app.plans.forEach(p => {
    const div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML = `<h4>${p.label}</h4><p>₹ ${p.price}</p>`;
    plansGrid.appendChild(div);
  });
}

/* ---------------- BACK BUTTONS ---------------- */
function backToHero() {
  appsPage.classList.remove("active");
  plansPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}

/* ---------------- MAKE FUNCTIONS GLOBAL ---------------- */
// 🔴 THIS IS THE IMPORTANT PART
window.openApps = openApps;
window.openPlans = openPlans;
window.backToHero = backToHero;
window.backToApps = backToApps;

// Initial load (optional)
fetchApps();
