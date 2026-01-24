const API = "https://malayali-store-backend.onrender.com";

const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");

const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

let ALL_APPS = [];
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;

/* 🔁 ALWAYS FETCH LATEST DATA */
async function fetchApps() {
  const res = await fetch(`${API}/api/apps`);
  ALL_APPS = await res.json();
}

/* HERO → APPS */
async function openApps(platform) {
  CURRENT_PLATFORM = platform;

  await fetchApps(); // 🔴 THIS WAS MISSING

  heroPage.classList.remove("active");
  plansPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  renderApps();
}

/* RENDER APPS */
function renderApps() {
  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(a => a.platform === CURRENT_PLATFORM);

  if (filtered.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
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

/* APPS → PLANS */
function openPlans(app) {
  CURRENT_APP = app;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = app.name + " Plans";
  plansGrid.innerHTML = "";

  (app.plans || []).forEach(p => {
    const div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML = `<h4>${p.label}</h4><p>₹ ${p.price}</p>`;
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
