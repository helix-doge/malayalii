import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= STATE ================= */
let CURRENT_PLATFORM = null;
let CURRENT_APP = null;
let CURRENT_PLAN = null;
let KEY_COUNT = {};

/* ================= DOM READY ================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnAndroid").addEventListener("click", () => openApps("android"));
  document.getElementById("btnIOS").addEventListener("click", () => openApps("ios"));

  document.getElementById("backFromApps").addEventListener("click", () => switchPage("heroPage"));
  document.getElementById("backFromPlans").addEventListener("click", () => switchPage("appsPage"));
  document.getElementById("buyKeyBtn").addEventListener("click", buyKey);
});

/* ================= PAGE SWITCH ================= */
function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= OPEN APPS ================= */
async function openApps(platform) {
  CURRENT_PLATFORM = platform;

  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  if (error) {
    alert("Failed to load apps");
    return;
  }

  const grid = document.getElementById("appGrid");
  grid.innerHTML = "";

  if (!data.length) {
    grid.innerHTML = `<p class="empty">No apps available</p>`;
  }

  data.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <img src="${app.icon_url || ""}">
      <h4>${app.name}</h4>
    `;
    card.addEventListener("click", () => openPlans(app));
    grid.appendChild(card);
  });

  switchPage("appsPage");
}

/* ================= LOAD KEY COUNTS ================= */
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
  CURRENT_PLAN = null;

  document.getElementById("plansTitle").innerText = app.name;

  await loadKeyCounts();

  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  renderPlans(data || []);
  switchPage("plansPage");
}

/* ================= RENDER PLANS ================= */
function renderPlans(plans) {
  const grid = document.getElementById("plansGrid");
  grid.innerHTML = "";

  plans.forEach(plan => {
    const available = KEY_COUNT[plan.id] || 0;
    const soldOut = available === 0;

    const card = document.createElement("div");
    card.className = "plan-card" + (soldOut ? " sold-out" : "");
    card.innerHTML = `
      <span>${plan.label}</span>
      <b>₹ ${plan.price}</b>
      ${soldOut ? "<em>SOLD OUT</em>" : `<small>${available} keys</small>`}
    `;

    if (!soldOut) {
      card.addEventListener("click", () => {
        document.querySelectorAll(".plan-card").forEach(p => p.classList.remove("active"));
        card.classList.add("active");
        CURRENT_PLAN = plan;
      });
    }

    grid.appendChild(card);
  });
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
    .limit(1)
    .single();

  if (!data) {
    alert("No keys available");
    return;
  }

  await supabase.from("keys").delete().eq("id", data.id);

  alert("Your Key:\n\n" + data.key_value);
  openPlans(CURRENT_APP);
}
