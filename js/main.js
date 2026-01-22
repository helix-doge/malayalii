const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

const apps = {
  android: [
    "Infinite Mod",
    "Infinite Lite"
  ],
  ios: [
    "Win iOS",
    "King iOS"
  ]
};

function openApps(platform) {
  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";
  apps[platform].forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    appGrid.appendChild(div);
  });
}

function goBack() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}
