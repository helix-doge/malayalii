const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const plansGrid = document.getElementById("plansGrid");

const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");

let ALL_APPS = [];
let CURRENT_APP = null;

/* LOAD DATA */
fetch("/api/apps")
  .then(res => res.json())
  .then(data => ALL_APPS = data)
  .catch(console.error);

/* PLATFORM → APPS */
function openApps(platform) {
  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  ALL_APPS
    .filter(a => a.platform === platform)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";
      div.innerHTML = `
        <img src="${app.icon_url}">
        <div>
          <strong>${app.name}</strong>
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

  app.plans.forEach(p => {
    const div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML = `<h3>${p.label}</h3><span>₹${p.price}</span>`;
    plansGrid.appendChild(div);
  });
}

function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}
