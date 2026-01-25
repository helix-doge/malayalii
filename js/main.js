const API = "https://malayali-store-backend.onrender.com";

// DOM
const heroSection = document.querySelector(".hero");
const appsPage = document.getElementById("appsPage");
const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

const androidBtn = document.getElementById("androidBtn");
const iosBtn = document.getElementById("iosBtn");

// STATE
let CURRENT_PLATFORM = null;
let ALL_APPS = [];

/* ---------------- NAVIGATION ---------------- */
function goHome() {
  appsPage.style.display = "none";
  heroSection.style.display = "block";
}

/* ---------------- OPEN APPS ---------------- */
async function openApps(platform) {
  CURRENT_PLATFORM = platform;

  heroSection.style.display = "none";
  appsPage.style.display = "block";

  appsTitle.textContent =
    platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

  appGrid.innerHTML = "<p>Loading apps...</p>";

  await fetchApps();
  renderApps();
}

/* ---------------- FETCH APPS ---------------- */
async function fetchApps() {
  try {
    const res = await fetch(`${API}/api/apps`);
    ALL_APPS = await res.json();
  } catch (err) {
    console.error("Failed to load apps", err);
    ALL_APPS = [];
  }
}

/* ---------------- RENDER APPS ---------------- */
function renderApps() {
  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(
    app => app.platform === CURRENT_PLATFORM
  );

  if (filtered.length === 0) {
    appGrid.innerHTML = "<p>No apps available</p>";
    return;
  }

  filtered.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";

    div.innerHTML = `
      <img src="${app.icon_url || ''}" alt="">
      <h4>${app.name}</h4>
      <p>${app.description || ''}</p>
    `;

    appGrid.appendChild(div);
  });
}

/* ---------------- EVENTS ---------------- */
androidBtn.addEventListener("click", () => openApps("android"));
iosBtn.addEventListener("click", () => openApps("ios"));
