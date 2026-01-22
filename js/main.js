const heroSection = document.getElementById("heroSection");
const appsSection = document.getElementById("appsSection");
const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

const appsData = {
  android: [
    { name: "Infinite Mod", desc: "Android Premium Tool" },
    { name: "Infinite Lite", desc: "Safe Android Version" }
  ],
  ios: [
    { name: "Win iOS", desc: "Secure iOS Tool" },
    { name: "King iOS", desc: "Premium iOS Mod" }
  ]
};

function selectPlatform(platform) {
  heroSection.classList.add("hidden-section");
  appsSection.classList.remove("hidden");

  appGrid.innerHTML = "";
  appsTitle.innerText =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appsData[platform].forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <h4>${app.name}</h4>
      <p>${app.desc}</p>
    `;
    appGrid.appendChild(div);
  });
}

function goBack() {
  appsSection.classList.add("hidden");
  heroSection.classList.remove("hidden-section");
}
