import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ---------- SUPABASE ---------- */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- STATE ---------- */
let APPS = [];
let CURRENT_APP = null;

/* ---------- LOAD DATA ---------- */
async function loadAppsWithKeys() {
  const { data: apps } = await supabase
    .from("apps")
    .select("*, plans(*)");

  const { data: keys } = await supabase
    .from("keys")
    .select("app_id, plan_id")
    .eq("is_used", false);

  const keyMap = {};
  keys.forEach(k => {
    const id = `${k.app_id}_${k.plan_id}`;
    keyMap[id] = (keyMap[id] || 0) + 1;
  });

  apps.forEach(app => {
    app.plans.forEach(p => {
      p.availableKeys = keyMap[`${app.id}_${p.id}`] || 0;
    });
  });

  APPS = apps;
}

/* ---------- GLOBAL NAV (FIXED) ---------- */
window.openApps = async function (platform) {
  if (!APPS.length) await loadAppsWithKeys();

  heroPage.classList.remove("active");
  appsPage.classList.add("active");

  appGrid.innerHTML = "";

  APPS
    .filter(a => a.platform === platform)
    .forEach(app => {
      const totalKeys = app.plans.reduce((s,p)=>s+p.availableKeys,0);

      const div = document.createElement("div");
      div.className = "app-card";

      div.innerHTML = `
        <img src="${app.icon_url}">
        <h3>${app.name}</h3>
        <p>${app.description || ""}</p>
        ${
          totalKeys === 0
          ? `<p class="no-keys">❌ No keys available for this app</p>`
          : `<button onclick="openPlans('${app.id}')">View Plans</button>`
        }
      `;
      appGrid.appendChild(div);
    });
};

window.backToHero = function () {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
};

window.backToApps = function () {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
};

/* ---------- PLANS ---------- */
window.openPlans = function (appId) {
  CURRENT_APP = APPS.find(a => a.id === appId);
  if (!CURRENT_APP) return;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.textContent = CURRENT_APP.name;
  plansGrid.innerHTML = "";

  CURRENT_APP.plans.forEach(p => {
    const disabled = p.availableKeys === 0;
    const div = document.createElement("div");
    div.className = `plan-card ${disabled ? "disabled" : ""}`;

    div.innerHTML = `
      <h4>${p.label}</h4>
      <p>${disabled ? `<s>₹${p.price}</s>` : `₹${p.price}`}</p>
      ${
        disabled
          ? `<span class="no-keys-text">No keys available</span>`
          : `<button onclick="buyPlan('${CURRENT_APP.id}','${p.id}')">Buy Key</button>`
      }
    `;
    plansGrid.appendChild(div);
  });
};

/* ---------- BUY (TEST MODE) ---------- */
window.buyPlan = async function (appId, planId) {
  await deliverKey(appId, planId);
};

/* ---------- KEY DELIVERY ---------- */
async function deliverKey(appId, planId) {
  const orderId = "ORD-" + Date.now();

  const { data: key } = await supabase
    .from("keys")
    .select("*")
    .eq("app_id", appId)
    .eq("plan_id", planId)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (!key) {
    alert("No keys available");
    return;
  }

  await supabase.from("keys").update({ is_used: true }).eq("id", key.id);
  await supabase.from("orders").insert({
    order_id: orderId,
    app_id: appId,
    plan_id: planId,
    key_id: key.id
  });

  navigator.clipboard.writeText(key.key_value);

  document.body.innerHTML = `
    <div style="padding:20px">
      <h2>Payment Successful</h2>
      <p><b>Order ID:</b> ${orderId}</p>
      <code>${key.key_value}</code><br><br>
      <button onclick="navigator.clipboard.writeText('${key.key_value}')">Copy Key</button>
      <p style="color:red">Key shown only once</p>
    </div>
  `;
}

/* ---------- INIT ---------- */
loadAppsWithKeys();
