const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");
const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

let ALL_APPS = {};
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;

/* FETCH DATA FROM BACKEND */
fetch("/api/apps")
  .then(res => res.json())
  .then(data => {
    ALL_APPS = data;
  })
  .catch(err => {
    console.error("Failed to load apps", err);
  });

/* PLATFORM → APPS */
function openApps(platform) {
  CURRENT_PLATFORM = platform;

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  (ALL_APPS[platform] || []).forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon}" alt="${app.name}">
      <div class="app-info">
        <h4>${app.name}</h4>
        <p>${app.description}</p>
      </div>
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

  plansTitle.textContent = app.name;
  plansGrid.innerHTML = "";

  app.plans.forEach(plan => {
    const div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML = `
      <h3>${plan.label}</h3>
      <span>₹${plan.price}</span>
    `;
    plansGrid.appendChild(div);
  });
}

/* BACK NAVIGATION */
function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}
