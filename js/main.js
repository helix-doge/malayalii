import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let CURRENT_APP = null;
let CURRENT_PLAN = null;
let KEY_COUNT_BY_PLAN = {};

/* ================= LOAD APPS ================= */
async function loadApps(platform) {
  const { data } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  showApps(data || []);
}

/* ================= SHOW APPS ================= */
function showApps(apps) {
  const grid = document.getElementById("appGrid");
  grid.innerHTML = "";

  apps.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon_url}">
      <h4>${app.name}</h4>
    `;
    div.onclick = () => openPlans(app);
    grid.appendChild(div);
  });

  switchPage("appsPage");
}

/* ================= OPEN PLANS ================= */
async function openPlans(app) {
  CURRENT_APP = app;
  document.getElementById("plansTitle").innerText = app.name;

  await loadKeyAvailability();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  renderPlans(plans || []);
  switchPage("plansPage");
}

/* ================= LOAD KEY AVAILABILITY ================= */
async function loadKeyAvailability() {
  KEY_COUNT_BY_PLAN = {};

  const { data } = await supabase
    .from("keys")
    .select("plan_id")
    .eq("is_used", false);

  data.forEach(k => {
    KEY_COUNT_BY_PLAN[k.plan_id] =
      (KEY_COUNT_BY_PLAN[k.plan_id] || 0) + 1;
  });
}

/* ================= RENDER PLANS ================= */
function renderPlans(plans) {
  const grid = document.getElementById("plansGrid");
  grid.innerHTML = "";

  plans.forEach(plan => {
    const available = KEY_COUNT_BY_PLAN[plan.id] || 0;
    const soldOut = available === 0;

    const div = document.createElement("div");
    div.className = "plan-card" + (soldOut ? " sold-out" : "");
    div.innerHTML = `
      <label>
        <input type="radio" name="plan" ${soldOut ? "disabled" : ""}>
        <span>${plan.label}</span>
        <b>₹ ${plan.price}</b>
        ${soldOut ? "<em>SOLD OUT</em>" : ""}
      </label>
    `;

    if (!soldOut) {
      div.onclick = () => selectPlan(plan);
    }

    grid.appendChild(div);
  });
}

/* ================= SELECT PLAN ================= */
function selectPlan(plan) {
  CURRENT_PLAN = plan;
  document.querySelectorAll(".plan-card")
    .forEach(p => p.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

/* ================= BUY KEY ================= */
async function buyKey() {
  if (!CURRENT_PLAN) {
    alert("Select a plan first");
    return;
  }

  const { data } = await supabase
    .from("keys")
    .select("*")
    .eq("plan_id", CURRENT_PLAN.id)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (!data) {
    alert("No keys available");
    return;
  }

  await supabase
    .from("keys")
    .update({ is_used: true })
    .eq("id", data.id);

  alert("Key Purchased:\n" + data.key_value);
  openPlans(CURRENT_APP); // refresh UI
}

/* ================= PAGE SWITCH ================= */
function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= BUTTON HOOKS ================= */
window.openApps = loadApps;
window.backToHero = () => switchPage("heroPage");
window.backToApps = () => switchPage("appsPage");
window.buyKey = buyKey;
