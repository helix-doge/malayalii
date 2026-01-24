/* ===============================
   SUPABASE (REALTIME)
================================ */
const SUPABASE_URL = "https://dytrdmvicireccasxxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   PAGE ELEMENTS
================================ */
const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

/* ===============================
   STATE
================================ */
let ALL_APPS = [];
let CURRENT_PLATFORM = null;

/* ===============================
   LOAD APPS
================================ */
async function fetchApps() {
  const res = await fetch("/api/apps");
  ALL_APPS = await res.json();

  // Re-render if user is already inside apps page
  if (CURRENT_PLATFORM) {
    renderApps(CURRENT_PLATFORM);
  }
}

fetchApps();

/* ===============================
   REALTIME LISTENER
================================ */
supabase
  .channel("apps-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "apps" },
    () => fetchApps()
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "plans" },
    () => fetchApps()
  )
  .subscribe();

/* ===============================
   OPEN PLATFORM
================================ */
function openApps(platform) {
  CURRENT_PLATFORM = platform;

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  renderApps(platform);
}

/* ===============================
   RENDER APPS
================================ */
function renderApps(platform) {
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
      <img src="${app.icon_url || ""}">
      <div class="app-info">
        <h4>${app.name}</h4>
        <p>${app.description || ""}</p>
      </div>
    `;

    appGrid.appendChild(div);
  });
}

/* ===============================
   BACK
================================ */
function backToHero() {
  CURRENT_PLATFORM = null;
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}
