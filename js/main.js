const platformSection = document.getElementById("platformSection");
const appsSection = document.getElementById("appsSection");
const appGrid = document.getElementById("appGrid");
const appTitle = document.getElementById("appTitle");

const appsData = {
  android: [
    { name: "Infinite Mod", desc: "Android Premium Tool" },
    { name: "Infinite Lite", desc: "Safe Android Version" },
    { name: "BGMI Tool", desc: "Android Support" }
  ],
  ios: [
    { name: "Win iOS", desc: "iOS Secure Tool" },
    { name: "King iOS", desc: "Premium iOS Mod" }
  ]
};

function selectPlatform(platform) {
  platformSection.classList.add("hidden");
  appsSection.classList.remove("hidden");

  appGrid.innerHTML = "";
  appTitle.innerText =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appsData[platform].forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <h3>${app.name}</h3>
      <p>${app.desc}</p>
    `;

    div.onclick = () => {
      // NEXT STEP (keys page later)
      console.log("Selected app:", app.name);
    };

    appGrid.appendChild(div);
  });
}

function goBack() {
  appsSection.classList.add("hidden");
  platformSection.classList.remove("hidden");
}
