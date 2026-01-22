/* ===============================
   PAGE REFERENCES
================================ */
const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");

const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

/* ===============================
   GLOBAL STATE
================================ */
let ALL_APPS = [];
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;

/* ===============================
   FETCH APPS FROM BACKEND
================================ */
async function loadApps() {
  try {
    const res = await fetch("/api/apps");
    const data = await res.json();
    ALL_APPS = data;
  } catch (err) {
    console.error("Failed to fetch apps:", err);
  }
}

loadApps();

/* ===============================
   PLATFORM → APPS
================================ */
function openApps(platform) {
  CURRENT_PLATFORM = platform;

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  const filteredApps = ALL_APPS.filter(
    app => app.platform === platform
  );

  if (filteredApps.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
    return;
  }

  filteredApps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";

    card.innerHTML = `
      <img src="${app.icon_url}" alt="${app.name}">
      <div class="app-info">
        <h4>${app.name}</h4>
        <p>${app.description}</p>
      </div>
    `;

    card.onclick = () => openPlans(app);
    appGrid.appendChild(card);
  });
}

/* ===============================
   APPS → PLANS
================================ */
function openPlans(app) {
  CURRENT_APP = app;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = app.name;
  plansGrid.innerHTML = "";

  if (!app.plans || app.plans.length === 0) {
    plansGrid.innerHTML = "<p>No plans available.</p>";
    return;
  }

  app.plans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "plan-card";

    card.innerHTML = `
      <h3>${plan.label}</h3>
      <span>₹${plan.price}</span>
    `;

    /* PAYMENT / KEY FLOW COMES HERE LATER */
    card.onclick = () => {
      console.log("Selected plan:", plan.label, plan.price);
    };

    plansGrid.appendChild(card);
  });
}

/* ===============================
   BACK NAVIGATION
================================ */
function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}
