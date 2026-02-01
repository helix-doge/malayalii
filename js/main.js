/* ================== SUPABASE ================== */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================== STATE ================== */
let CURRENT_APP = null;
let CURRENT_PLAN = null;
let KEY_COUNT = {};

/* ================== ELEMENTS ================== */
const home = document.getElementById("home");
const apps = document.getElementById("apps");
const appDetails = document.getElementById("appDetails");
const keyPage = document.getElementById("keyPage");

const androidBtn = document.getElementById("androidBtn");
const iosBtn = document.getElementById("iosBtn");
const backBtn = document.getElementById("backBtn");
const detailsBackBtn = document.getElementById("detailsBackBtn");

const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

const detailsIcon = document.getElementById("detailsIcon");
const detailsName = document.getElementById("detailsName");
const planSelect = document.querySelector(".plan-select");
const buyBtn = document.getElementById("buyBtn");

const purchasedKeyEl = document.getElementById("purchasedKey");
const copyKeyBtn = document.getElementById("copyKeyBtn");
const keyDoneBtn = document.getElementById("keyDoneBtn");

/* ================== PAGE CONTROL ================== */
const pages = { home, apps, appDetails, keyPage };

function showPage(page) {
  Object.values(pages).forEach(p => p.classList.remove("show"));
  pages[page].classList.add("show");
}

/* ================== NAVIGATION ================== */
androidBtn.onclick = () => loadApps("android");
iosBtn.onclick = () => loadApps("ios");
backBtn.onclick = () => showPage("home");
detailsBackBtn.onclick = () => showPage("apps");

/* ================== LOAD APPS ================== */
async function loadApps(platform) {
  showPage("apps");
  appsTitle.textContent = platform.toUpperCase() + " APPS";
  appGrid.innerHTML = "<p class='loading'>Loading apps...</p>";

  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  if (error) {
    appGrid.innerHTML = "<p>Error loading apps</p>";
    return;
  }

  appGrid.innerHTML = "";

  data.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";

    card.innerHTML = `
      <img src="${app.icon_url || ""}">
      <h4>${app.name}</h4>
      <p class="app-desc">${app.description || ""}</p>
    `;

    card.onclick = () => openApp(app);
    appGrid.appendChild(card);
  });
}

/* ================== LOAD KEY COUNTS ================== */
async function loadKeyCounts() {
  KEY_COUNT = {};
  const { data } = await supabase
    .from("keys")
    .select("plan_id")
    .eq("is_used", false);

  data.forEach(k => {
    KEY_COUNT[k.plan_id] = (KEY_COUNT[k.plan_id] || 0) + 1;
  });
}

/* ================== OPEN APP ================== */
async function openApp(app) {
  CURRENT_APP = app;
  CURRENT_PLAN = null;
  buyBtn.disabled = true;

  detailsIcon.src = app.icon_url || "";
  detailsName.textContent = app.name;

  planSelect.innerHTML = "<p class='loading'>Loading plans...</p>";
  showPage("appDetails");

  await loadKeyCounts();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  renderPlans(plans);
}

/* ================== RENDER PLANS ================== */
function renderPlans(plans) {
  planSelect.innerHTML = "<h3>Select Plan</h3>";

  plans.forEach(plan => {
    const available = KEY_COUNT[plan.id] || 0;
    const soldOut = available === 0;

    const div = document.createElement("div");
    div.className = "plan-card" + (soldOut ? " sold-out" : "");

    div.innerHTML = `
      <div>
        ${plan.label}
        ${soldOut ? "<small>SOLD OUT</small>" : `<small>${available} keys</small>`}
      </div>
      <div class="plan-price">₹ ${plan.price}</div>
    `;

    if (!soldOut) {
      div.onclick = () => {
        document.querySelectorAll(".plan-card").forEach(p => p.classList.remove("active"));
        div.classList.add("active");
        CURRENT_PLAN = plan;
        buyBtn.disabled = false;
      };
    }

    planSelect.appendChild(div);
  });
}

/* ================== BUY KEY (RAZORPAY) ================== */
buyBtn.onclick = async () => {
  if (!CURRENT_PLAN) return;

  buyBtn.disabled = true;
  buyBtn.textContent = "Processing...";

  const res = await fetch(
    "https://malayali-store-backend.onrender.com/api/create-order",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: CURRENT_PLAN.price })
    }
  );

  const order = await res.json();

  const rzp = new Razorpay({
    key: "rzp_live_Rk2oKtZtYbEN4A", // PUBLIC KEY
    amount: order.amount,
    currency: "INR",
    order_id: order.id,
    name: CURRENT_APP.name,
    description: CURRENT_PLAN.label,
    handler: async function (response) {
      try {
        const verify = await fetch(
          "https://malayali-store-backend.onrender.com/api/verify-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          }
        );

        const result = await verify.json();
        if (!result.success) throw "verify-failed";

        await deliverKey();

      } catch {
        alert("Payment verified but key delivery failed");
        resetBuyBtn();
      }
    }
  });

  rzp.open();
};

/* ================== DELIVER KEY ================== */
async function deliverKey() {
  const { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("plan_id", CURRENT_PLAN.id)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (error || !data) {
    alert("No keys available");
    resetBuyBtn();
    return;
  }

  await supabase
    .from("keys")
    .update({ is_used: true })
    .eq("id", data.id);

  purchasedKeyEl.textContent = data.key_value;
  navigator.clipboard.writeText(data.key_value);

  showPage("keyPage");
}

/* ================== KEY PAGE ================== */
copyKeyBtn.onclick = () => {
  navigator.clipboard.writeText(purchasedKeyEl.textContent);
  copyKeyBtn.textContent = "Copied ✔";
};

keyDoneBtn.onclick = () => {
  copyKeyBtn.textContent = "Copy Key";
  resetBuyBtn();
  openApp(CURRENT_APP);
};

/* ================== HELPERS ================== */
function resetBuyBtn() {
  buyBtn.textContent = "Buy Key";
  buyBtn.disabled = true;
}

/* ================== INIT ================== */
showPage("home");
