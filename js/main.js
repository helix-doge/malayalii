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

/* ================= PAGE SWITCH ================= */
function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= LOAD APPS ================= */
async function openApps(platform) {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  if (error) {
    console.error(error);
    alert("Failed to load apps");
    return;
  }

  const grid = document.getElementById("appGrid");
  grid.innerHTML = "";

  if (!data || data.length === 0) {
    grid.innerHTML = `<p style="opacity:.6">No apps available</p>`;
  }

  data.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon_url || ""}">
      <h4>${app.name}</h4>
    `;
    div.onclick = () => openPlans(app);
    grid.appendChild(div);
  });

  switchPage("appsPage");
}

/* ================= LOAD KEY COUNTS ================= */
async function loadKeyCounts() {
  KEY_COUNT = {};

  const { data } = await supabase
    .from("keys")
    .select("plan_id");

  if (!data) return;

  data.forEach(k => {
    if (!k.plan_id) return;
    KEY_COUNT[k.plan_id] = (KEY_COUNT[k.plan_id] || 0) + 1;
  });
}

/* ================= OPEN PLANS ================= */
async function openPlans(app) {
  CURRENT_APP = app;
  CURRENT_PLAN = null;

  document.getElementById("plansTitle").innerText = app.name;

  await loadKeyCounts();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  if (error) {
    console.error(error);
    alert("Failed to load plans");
    return;
  }

  renderPlans(plans || []);
  switchPage("plansPage");
}

/* ================= RENDER PLANS ================= */
function renderPlans(plans) {
  const grid = document.getElementById("plansGrid");
  grid.innerHTML = "";

  if (plans.length === 0) {
    grid.innerHTML = `<p style="opacity:.6">No plans available</p>`;
    return;
  }

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
        ${
          soldOut
            ? "<em>SOLD OUT</em>"
            : `<small>${available} keys available</small>`
        }
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
  document
    .querySelectorAll(".plan-card")
    .forEach(p => p.classList.remove("active"));
  el.classList.add("active");
}

/* ================= BUY KEY ================= */
async function buyKey() {
  if (!CURRENT_PLAN) {
    alert("Please select a plan");
    return;
  }

  const { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("plan_id", CURRENT_PLAN.id)
    .limit(1)
    .single();

  if (error || !data) {
    alert("No keys available");
    return;
  }

  await supabase
    .from("keys")
    .delete()
    .eq("id", data.id);

  alert("Your Key:\n\n" + data.key_value);

  // Refresh UI instantly
  openPlans(CURRENT_APP);
}

/* ================= BACK NAV ================= */
function backToHero() {
  switchPage("heroPage");
}

function backToApps() {
  switchPage("appsPage");
}

/* ================= EXPOSE TO HTML ================= */
window.openApps = openApps;
window.buyKey = buyKey;
window.backToHero = backToHero;
window.backToApps = backToApps;
