import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let CURRENT_APP = null;
let CURRENT_PLAN = null;
let KEY_COUNT = {};

/* ================= OPEN APPS ================= */
window.openApps = async function (platform) {
  const { data } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  const grid = document.getElementById("appGrid");
  grid.innerHTML = "";

  data.forEach(app => {
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
};

/* ================= LOAD KEYS COUNT ================= */
async function loadKeyCounts() {
  KEY_COUNT = {};

  const { data } = await supabase
    .from("keys")
    .select("plan_id");

  data.forEach(k => {
    if (!k.plan_id) return;
    KEY_COUNT[k.plan_id] = (KEY_COUNT[k.plan_id] || 0) + 1;
  });
}

/* ================= OPEN PLANS ================= */
async function openPlans(app) {
  CURRENT_APP = app;
  document.getElementById("plansTitle").innerText = app.name;

  await loadKeyCounts();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  renderPlans(plans || []);
  switchPage("plansPage");
}

/* ================= RENDER PLANS ================= */
function renderPlans(plans) {
  const grid = document.getElementById("plansGrid");
  grid.innerHTML = "";
  CURRENT_PLAN = null;

  plans.forEach(plan => {
    const available = KEY_COUNT[plan.id] || 0;
    const soldOut = available === 0;

    const card = document.createElement("div");
    card.className = "plan-card" + (soldOut ? " sold-out" : "");

    card.innerHTML = `
      <label>
        <input type="radio" name="plan" ${soldOut ? "disabled" : ""}>
        <span>${plan.label}</span>
        <b>₹ ${plan.price}</b>
        ${soldOut ? "<em>SOLD OUT</em>" : `<small>${available} keys</small>`}
      </label>
    `;

    if (!soldOut) {
      card.onclick = () => selectPlan(plan, card);
    }

    grid.appendChild(card);
  });
}

/* ================= SELECT PLAN ================= */
function selectPlan(plan, el) {
  CURRENT_PLAN = plan;
  document.querySelectorAll(".plan-card")
    .forEach(p => p.classList.remove("active"));
  el.classList.add("active");
}

/* ================= BUY KEY ================= */
window.buyKey = async function () {
  if (!CURRENT_PLAN) {
    alert("Please select a plan");
    return;
  }

  const { data } = await supabase
    .from("keys")
    .select("*")
    .eq("plan_id", CURRENT_PLAN.id)
    .limit(1)
    .single();

  if (!data) {
    alert("No keys available");
    return;
  }

  await supabase
    .from("keys")
    .delete()
    .eq("id", data.id);

  alert("Your Key:\n\n" + data.key_value);

  openPlans(CURRENT_APP);
};

/* ================= PAGE NAV ================= */
function switchPage(id) {
  document.querySelectorAll(".page")
    .forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

window.backToHero = () => switchPage("heroPage");
window.backToApps = () => switchPage("appsPage");
