const API = "https://malayali-store-backend.onrender.com";

const supabase = window.supabase.createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let ALL_APPS = [];
let CURRENT_PLATFORM = null;

async function fetchApps() {
  const res = await fetch(`${API}/api/apps?ts=${Date.now()}`);
  ALL_APPS = await res.json();
  if (CURRENT_PLATFORM) renderApps();
}

function openApps(platform) {
  CURRENT_PLATFORM = platform;
  fetchApps();
  heroPage.classList.remove("active");
  appsPage.classList.add("active");
  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";
}

function renderApps() {
  appGrid.innerHTML = "";

  const list = ALL_APPS.filter(a => a.platform === CURRENT_PLATFORM);

  if (!list.length) {
    appGrid.innerHTML = "<p>No apps available</p>";
    return;
  }

  list.forEach(app => {
    const d = document.createElement("div");
    d.className = "app-card";
    d.innerHTML = `
      <img src="${app.icon_url || ''}">
      <h4>${app.name}</h4>
      <p>${app.description || ''}</p>
    `;
    appGrid.appendChild(d);
  });
}

// 🔥 REALTIME UPDATE
supabase
  .channel("main-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, fetchApps)
  .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, fetchApps)
  .subscribe();
