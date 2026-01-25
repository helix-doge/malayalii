import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- UI ---------- */
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    pages.forEach(p => p.classList.remove("show"));
    document.getElementById(tab.dataset.page).classList.add("show");
  };
});

/* ---------- DASHBOARD ---------- */
async function loadStats() {
  const { data: apps } = await supabase.from("apps").select("id, platform, plans");

  document.getElementById("statTotalApps").textContent = apps.length;
  document.getElementById("statAndroid").textContent =
    apps.filter(a => a.platform === "android").length;
  document.getElementById("statIos").textContent =
    apps.filter(a => a.platform === "ios").length;

  let planCount = 0;
  apps.forEach(a => planCount += (a.plans?.length || 0));
  document.getElementById("statPlans").textContent = planCount;
}

/* ---------- APPS LIST ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*");
  const list = document.getElementById("appsList");
  list.innerHTML = "";

  data.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon_url || ''}">
      <h4>${app.name}</h4>
      <small>${app.platform}</small>
    `;
    list.appendChild(div);
  });
}

/* ---------- ADD APP ---------- */
document.getElementById("saveAppBtn").onclick = async () => {
  const name = appName.value.trim();
  if (!name) return alert("App name required");

  await supabase.from("apps").insert({
    name,
    platform: platform.value,
    description: description.value,
    icon_url: iconUrl.value,
    plans: [
      { label: "1 DAY", price: Number(dayPrice.value) },
      { label: "1 WEEK", price: Number(weekPrice.value) },
      { label: "1 MONTH", price: Number(monthPrice.value) }
    ]
  });

  alert("App saved");
  appName.value = description.value = iconUrl.value = "";
};

/* ---------- REALTIME ---------- */
supabase
  .channel("apps-live")
  .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, () => {
    loadStats();
    loadApps();
  })
  .subscribe();

/* INIT */
loadStats();
loadApps();
