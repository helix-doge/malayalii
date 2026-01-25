import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

// Pages
const dashboard = document.getElementById("dashboard");
const appsPage = document.getElementById("appsPage");
const addAppPage = document.getElementById("addAppPage");

// Buttons
dashboardBtn.onclick = () => showPage(dashboard);
appsBtn.onclick = () => showPage(appsPage);
addAppBtn.onclick = () => showPage(addAppPage);
cancelBtn.onclick = () => showPage(appsPage);

// Stats
async function loadStats() {
  const { data: apps } = await supabase.from("apps").select("id, platform");
  document.getElementById("totalApps").textContent = apps.length;
  document.getElementById("androidCount").textContent =
    apps.filter(a => a.platform === "android").length;
  document.getElementById("iosCount").textContent =
    apps.filter(a => a.platform === "ios").length;
}

// Apps list
async function loadApps() {
  const { data } = await supabase.from("apps").select("*");
  appsList.innerHTML = "";
  data.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-item";
    div.innerHTML = `<b>${app.name}</b><br>${app.platform}`;
    appsList.appendChild(div);
  });
}

// Save app
saveAppBtn.onclick = async () => {
  await supabase.from("apps").insert({
    name: appName.value,
    platform: platform.value,
    description: description.value
  });
  showPage(appsPage);
};

// Realtime
supabase
  .channel("apps-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, () => {
    loadStats();
    loadApps();
  })
  .subscribe();

function showPage(p) {
  [dashboard, appsPage, addAppPage].forEach(x => x.classList.remove("show"));
  p.classList.add("show");
}

loadStats();
loadApps();
