let selectedTool = null;

const appData = {
  infinite: {
    android: ["Infinite Lite", "Infinite Pro"],
    ios: ["Infinite iOS Secure"]
  },
  win: {
    android: [],
    ios: ["Win iOS V1", "Win iOS V2"]
  },
  king: {
    android: [],
    ios: ["King iOS Premium"]
  }
};

function openPlatform(tool) {
  selectedTool = tool;

  document.getElementById("platformSection").classList.remove("hidden");
  document.getElementById("appSection").classList.add("hidden");
}

function showApps(platform) {
  const appGrid = document.getElementById("appGrid");
  appGrid.innerHTML = "";

  const apps = appData[selectedTool][platform];

  if (apps.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
  } else {
    apps.forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";
      div.innerHTML = `
        <h4>${app}</h4>
        <p>Click to purchase key</p>
      `;
      div.onclick = () => {
        window.location.href = `purchase.html?app=${encodeURIComponent(app)}`;
      };
      appGrid.appendChild(div);
    });
  }

  document.getElementById("appSection").classList.remove("hidden");
}
