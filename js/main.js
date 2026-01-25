document.addEventListener("DOMContentLoaded", () => {

  const API = "https://malayali-store-backend.onrender.com/api/apps";

  const home = document.getElementById("home");
  const apps = document.getElementById("apps");

  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");
  const backBtn = document.getElementById("backBtn");

  const appGrid = document.getElementById("appGrid");
  const appsTitle = document.getElementById("appsTitle");

  let ALL_APPS = [];
  let CURRENT_PLATFORM = "";

  async function loadApps() {
    const res = await fetch(API);
    ALL_APPS = await res.json();
  }

  function showApps(platform) {
    CURRENT_PLATFORM = platform;

    home.classList.remove("show");
    apps.classList.add("show");

    appsTitle.textContent =
      platform === "android" ? "ANDROID APPS" : "iOS / iPAD APPS";

    appGrid.innerHTML = "Loading...";

    loadApps().then(renderApps);
  }

  function renderApps() {
    appGrid.innerHTML = "";

    const list = ALL_APPS.filter(a => a.platform === CURRENT_PLATFORM);

    if (!list.length) {
      appGrid.innerHTML = "<p style='text-align:center'>No apps available</p>";
      return;
    }

    list.forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";
      div.innerHTML = `
        <img src="${app.icon_url || ""}">
        <h4>${app.name}</h4>
        <p>${app.description || ""}</p>
      `;
      appGrid.appendChild(div);
    });
  }

  androidBtn.onclick = () => showApps("android");
  iosBtn.onclick = () => showApps("ios");

  backBtn.onclick = () => {
    apps.classList.remove("show");
    home.classList.add("show");
  };

});
