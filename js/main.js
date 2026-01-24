/* ===============================
   PAGE REFERENCES
================================ */
const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");

const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

/* ===============================
   GLOBAL STATE
================================ */
let ALL_APPS = [];
let DATA_LOADED = false;

/* ===============================
   LOAD APPS FROM BACKEND
================================ */
async function loadApps() {
  try {
    const res = await fetch("/api/apps");
    ALL_APPS = await res.json();
    DATA_LOADED = true;
    console.log("Apps loaded:", ALL_APPS);
  } catch (err) {
    console.error("Failed to load apps", err);
  }
}

loadApps();

/* ===============================
   PLATFORM → APPS
================================ */
async function openApps(platform) {

  // Ensure data is loaded
  if (!DATA_LOADED) {
    await loadApps();
  }

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(app => app.platform === platform);

  if (filtered.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
    return;
  }

  filtered.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";

    div.innerHTML = `
      <img src="${app.icon_url}" alt="${app.name}">
      <div class="app-info">
        <h4>${app.name}</h4>
        <p>${app.description || ""}</p>
      </div>
    `;

    appGrid.appendChild(div);
  });
}

/* ===============================
   BACK TO HOME
================================ */
function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}
