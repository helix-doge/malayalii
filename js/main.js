const API = "https://malayali-store-backend.onrender.com";

let ALL_APPS = [];

async function fetchApps() {
  const res = await fetch(`${API}/api/apps?ts=${Date.now()}`);
  ALL_APPS = await res.json();
}

async function openApps(platform) {
  await fetchApps();

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  const filtered = ALL_APPS.filter(a => a.platform === platform);

  if (!filtered.length) {
    appGrid.innerHTML = "<p>No apps available</p>";
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
