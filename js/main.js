const API = "https://malayali-store-backend.onrender.com/api/apps";

// PAGES
const homePage = document.getElementById("home");
const appsPage = document.getElementById("apps");

// ELEMENTS
const androidBtn = document.getElementById("androidBtn");
const iosBtn = document.getElementById("iosBtn");
const backBtn = document.getElementById("backBtn");
const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

let ALL_APPS = [];
let CURRENT_PLATFORM = "";

// FETCH APPS
async function loadApps() {
  const res = await fetch(API);
  ALL_APPS = await res.json();
}

// OPEN APPS PAGE
async function openApps(platform) {
  CURRENT_PLATFORM = platform;

  homePage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

  appGrid.innerHTML = "Loading...";

  await loadApps();
  renderApps();
}

// RENDER APPS
function renderApps() {
  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(a => a.platform === CURRENT_PLATFORM);

  if (filtered.length === 0) {
    appGrid.innerHTML = "<p style='text-align:center'>No apps available</p>";
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

    appGrid.appendChild(div);
  });
}

// BACK
function goHome() {
  appsPage.classList.remove("active");
  homePage.classList.add("active");
}

// EVENTS
androidBtn.onclick = () => openApps("android");
iosBtn.onclick = () => openApps("ios");
backBtn.onclick = goHome;
