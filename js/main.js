const heroPage = document.getElementById("heroPage");
const appsPage = document.getElementById("appsPage");
const plansPage = document.getElementById("plansPage");

const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");
const plansTitle = document.getElementById("plansTitle");
const plansGrid = document.getElementById("plansGrid");

let currentApp = null;

/* SAMPLE DATA (admin will control later) */
const data = {
  android: [
    {
      name: "Infinite Mod",
      icon: "assets/icons/infinite.png",
      plans: [
        { label: "Weekly", price: "₹199" },
        { label: "Monthly", price: "₹499" },
        { label: "Lifetime", price: "₹999" }
      ]
    }
  ],
  ios: [
    {
      name: "Win iOS",
      icon: "assets/icons/win.png",
      plans: [
        { label: "Weekly", price: "₹299" },
        { label: "Monthly", price: "₹699" },
        { label: "Lifetime", price: "₹1299" }
      ]
    }
  ]
};

function openApps(platform) {
  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appsTitle.textContent =
    platform === "android" ? "Android Apps" : "iOS / iPad Apps";

  appGrid.innerHTML = "";

  data[platform].forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon}" style="width:40px;margin-bottom:10px">
      <h4>${app.name}</h4>
    `;
    div.onclick = () => openPlans(app);
    appGrid.appendChild(div);
  });
}

function openPlans(app) {
  currentApp = app;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = app.name;
  plansGrid.innerHTML = "";

  app.plans.forEach(plan => {
    const div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML = `
      <h3>${plan.label}</h3>
      <p>Access Duration</p>
      <span>${plan.price}</span>
    `;
    plansGrid.appendChild(div);
  });
}

function goBack() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}
