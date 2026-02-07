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

/* ================= ELEMENTS ================= */
const pages = {
  home: document.getElementById("home"),
  apps: document.getElementById("apps"),
  details: document.getElementById("appDetails"),
  key: document.getElementById("keyPage")
};

const androidBtn = document.getElementById("androidBtn");
const iosBtn = document.getElementById("iosBtn");
const backBtn = document.getElementById("backBtn");
const detailsBackBtn = document.getElementById("detailsBackBtn");

const appGrid = document.getElementById("appGrid");
const appsTitle = document.getElementById("appsTitle");

const detailsIcon = document.getElementById("detailsIcon");
const detailsName = document.getElementById("detailsName");
const planSelect = document.getElementById("planSelect");
const buyBtn = document.getElementById("buyBtn");

const purchasedKeyEl = document.getElementById("purchasedKey");
const copyKeyBtn = document.getElementById("copyKeyBtn");
const keyDoneBtn = document.getElementById("keyDoneBtn");

/* ================= PAGE CONTROL ================= */
function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove("show"));
  pages[name].classList.add("show");
}

/* ================= NAV ================= */
androidBtn.onclick = () => loadApps("android");
iosBtn.onclick = () => loadApps("ios");
backBtn.onclick = () => showPage("home");
detailsBackBtn.onclick = () => showPage("apps");

/* ================= LOAD APPS ================= */
async function loadApps(platform) {
  showPage("apps");
  appsTitle.textContent = platform.toUpperCase() + " APPS";
  appGrid.innerHTML = "Loading...";

  const { data } = await supabase
    .from("apps")
    .select("*")
    .eq("platform", platform);

  appGrid.innerHTML = "";

  data.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.innerHTML = `
      <img src="${app.icon_url || ""}">
      <h4>${app.name}</h4>
      <p>${app.description || ""}</p>
    `;
    card.onclick = () => openApp(app);
    appGrid.appendChild(card);
  });
}

/* ================= KEY COUNT ================= */
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

/* ================= OPEN APP ================= */
async function openApp(app) {
  CURRENT_APP = app;
  CURRENT_PLAN = null;
  buyBtn.disabled = true;

  detailsIcon.src = app.icon_url || "";
  detailsName.textContent = app.name;
  planSelect.innerHTML = "Loading plans...";

  showPage("details");
  await loadKeyCounts();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  planSelect.innerHTML = "";

  plans.forEach(plan => {
    const available = KEY_COUNT[plan.id] || 0;
    const soldOut = available === 0;

    const div = document.createElement("div");
    div.className = "plan-card" + (soldOut ? " sold-out" : "");
    div.innerHTML = `
      <span>${plan.label}</span>
      <span>₹ ${plan.price}</span>
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

/* ================= BUY KEY ================= */
buyBtn.onclick = async () => {
  if (!CURRENT_PLAN) return;

  buyBtn.disabled = true;
  buyBtn.textContent = "Processing...";

  try {
    const orderRes = await fetch(
      "https://malayali-store-backend.onrender.com/api/create-order",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: CURRENT_PLAN.price })
      }
    );

    const order = await orderRes.json();

    const rzp = new Razorpay({
      key: "rzp_live_Rk2oKtZtYbEN4A",
      amount: order.amount,
      currency: "INR",
      order_id: order.id,
      name: CURRENT_APP.name,
      description: CURRENT_PLAN.label,
      redirect: false,

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
          if (!result.success) throw new Error();

          // Save plan temporarily (important if page reloads)
          sessionStorage.setItem("last_plan_id", CURRENT_PLAN.id);

          await deliverKey();

        } catch (err) {
          alert("Payment successful but key delivery failed");
          resetBuyBtn();
        }
      }
    });

    rzp.open();

  } catch (err) {
    alert("Payment failed");
    resetBuyBtn();
  }
};

/* ================= DELIVER KEY ================= */
async function deliverKey() {
  const planId =
    CURRENT_PLAN?.id || sessionStorage.getItem("last_plan_id");

  if (!planId) return;

  const { data, error } = await supabase
    .from("keys")
    .select("*")
    .eq("plan_id", planId)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (error || !data) {
    alert("No keys available");
    resetBuyBtn();
    return;
  }

  await supabase.from("keys")
    .update({ is_used: true })
    .eq("id", data.id);

  purchasedKeyEl.textContent = data.key_value;

  // Auto copy
  navigator.clipboard.writeText(data.key_value);

  // Clear temp storage
  sessionStorage.removeItem("last_plan_id");

  showPage("key");
}

/* ================= KEY PAGE ================= */
copyKeyBtn.onclick = () => {
  navigator.clipboard.writeText(purchasedKeyEl.textContent);
};

keyDoneBtn.onclick = () => {
  resetBuyBtn();
  showPage("home");
};

/* ================= RESET ================= */
function resetBuyBtn() {
  buyBtn.textContent = "Buy Key";
  buyBtn.disabled = true;
}

/* ================= INIT ================= */
showPage("home");
