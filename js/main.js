import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ---------------- SUPABASE ---------------- */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------------- STATE ---------------- */
let APPS = [];
let CURRENT_APP = null;

/* ---------------- LOAD DATA ---------------- */
async function loadAppsWithKeys() {
  // 1. Fetch apps + plans
  const { data: apps, error: appErr } = await supabase
    .from("apps")
    .select("*, plans(*)");

  if (appErr) {
    console.error("Failed to load apps", appErr);
    return;
  }

  // 2. Fetch all unused keys
  const { data: keys, error: keyErr } = await supabase
    .from("keys")
    .select("app_id, plan_id")
    .eq("is_used", false);

  if (keyErr) {
    console.error("Failed to load keys", keyErr);
    return;
  }

  // 3. Count keys per plan
  const keyCount = {};
  keys.forEach(k => {
    const id = `${k.app_id}_${k.plan_id}`;
    keyCount[id] = (keyCount[id] || 0) + 1;
  });

  // 4. Attach availability to plans
  apps.forEach(app => {
    app.plans.forEach(plan => {
      plan.availableKeys =
        keyCount[`${app.id}_${plan.id}`] || 0;
    });
  });

  APPS = apps;
}

/* ---------------- NAVIGATION ---------------- */
window.openApps = async function (platform) {
  if (!APPS.length) await loadAppsWithKeys();

  document.getElementById("heroPage").classList.remove("active");
  document.getElementById("appsPage").classList.add("active");

  const grid = document.getElementById("appGrid");
  grid.innerHTML = "";

  APPS
    .filter(app => app.platform === platform)
    .forEach(app => {
      const totalKeys = app.plans.reduce(
        (sum, p) => sum + p.availableKeys,
        0
      );

      const card = document.createElement("div");
      card.className = "app-card";

      card.innerHTML = `
        <img src="${app.icon_url}" alt="${app.name}">
        <h3>${app.name}</h3>
        <p>${app.description || ""}</p>
        ${
          totalKeys === 0
            ? `<p class="no-keys-app">❌ No keys available for this app</p>`
            : `<button onclick="openPlans('${app.id}')">
                 View Plans
               </button>`
        }
      `;

      grid.appendChild(card);
    });
};

window.backToHero = function () {
  document.getElementById("appsPage").classList.remove("active");
  document.getElementById("heroPage").classList.add("active");
};

window.backToApps = function () {
  document.getElementById("plansPage").classList.remove("active");
  document.getElementById("appsPage").classList.add("active");
};

/* ---------------- PLANS ---------------- */
window.openPlans = function (appId) {
  CURRENT_APP = APPS.find(a => a.id === appId);
  if (!CURRENT_APP) return;

  document.getElementById("appsPage").classList.remove("active");
  document.getElementById("plansPage").classList.add("active");

  document.getElementById("plansTitle").textContent = CURRENT_APP.name;

  const grid = document.getElementById("plansGrid");
  grid.innerHTML = "";

  CURRENT_APP.plans.forEach(plan => {
    const disabled = plan.availableKeys === 0;

    const card = document.createElement("div");
    card.className = `plan-card ${disabled ? "disabled" : ""}`;

    card.innerHTML = `
      <h4>${plan.label}</h4>

      <p class="price">
        ${
          disabled
            ? `<s>₹${plan.price}</s>`
            : `₹${plan.price}`
        }
      </p>

      ${
        disabled
          ? `<span class="no-keys-plan">No keys available</span>`
          : `<button onclick="buyPlan('${CURRENT_APP.id}', '${plan.id}')">
               Buy Key
             </button>`
      }
    `;

    grid.appendChild(card);
  });
};

/* ---------------- BUY (TEST MODE) ---------------- */
window.buyPlan = async function (appId, planId) {
  // This is TEST MODE – replace with payment success later
  await deliverKey(appId, planId);
};

/* ---------------- KEY DELIVERY ---------------- */
async function deliverKey(appId, planId) {
  const orderId = "ORD-" + Date.now();

  // 1. Get one unused key
  const { data: key, error } = await supabase
    .from("keys")
    .select("*")
    .eq("app_id", appId)
    .eq("plan_id", planId)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (error || !key) {
    alert("No keys available");
    return;
  }

  // 2. Mark key as used
  await supabase
    .from("keys")
    .update({
      is_used: true,
      used_at: new Date()
    })
    .eq("id", key.id);

  // 3. Create order
  await supabase.from("orders").insert({
    order_id: orderId,
    app_id: appId,
    plan_id: planId,
    key_id: key.id
  });

  // 4. Auto-copy
  navigator.clipboard.writeText(key.key_value);

  // 5. Show ONCE
  document.body.innerHTML = `
    <div style="padding:20px;font-family:Poppins">
      <h2>✅ Payment Successful</h2>
      <p><b>Order ID:</b> ${orderId}</p>

      <p>Your Key (shown only once):</p>
      <div style="background:#111;padding:14px;border-radius:8px">
        <code>${key.key_value}</code>
      </div>

      <br>
      <button onclick="navigator.clipboard.writeText('${key.key_value}')">
        Copy Key
      </button>

      <p style="color:#ff4d4d;margin-top:10px">
        ⚠ Save this key now. It will not be shown again.
      </p>
    </div>
  `;
}

/* ---------------- INIT ---------------- */
loadAppsWithKeys();
