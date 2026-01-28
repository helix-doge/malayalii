/* ================= SUPABASE ================= */
/* uses your existing supabase client */
const supabase = window.supabaseClient;

/* ================= STATE ================= */
let APPS = [];
let CURRENT_APP = null;

/* ================= TOAST ================= */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ================= LOAD DATA ================= */
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

/* ================= ANDROID / IOS ================= */
function openApps(platform) {
  heroPage.classList.remove("active");
  appsPage.classList.add("active");
  plansPage.classList.remove("active");

  appsTitle.innerText = platform.toUpperCase();
  appGrid.innerHTML = "";

  APPS
    .filter(app => app.platform === platform)
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
}

/* ================= PLANS ================= */
function openPlans(appId) {
  CURRENT_APP = APPS.find(a => a.id === appId);
  if (!CURRENT_APP) return;

  appsPage.classList.remove("active");
  plansPage.classList.add("active");

  plansTitle.innerText = CURRENT_APP.name;
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
}

/* ================= BUY ================= */
async function buyPlan(appId, planId) {
  const { data: key } = await supabase
    .from("keys")
    .select("*")
    .eq("app_id", appId)
    .eq("plan_id", planId)
    .eq("is_used", false)
    .limit(1)
    .single();

  if (!key) {
    showToast("No keys available");
    return;
  }

  await supabase.from("keys").update({ is_used: true }).eq("id", key.id);
  navigator.clipboard.writeText(key.key_value);
  showToast("Key copied to clipboard");

  document.body.innerHTML = `
    <div style="padding:20px;font-family:Poppins">
      <h2>Payment Successful</h2>
      <p><b>Key:</b></p>
      <code>${key.key_value}</code>
      <p style="color:red">Shown only once</p>
    </div>
  `;
}

/* ================= BACK ================= */
function backToHero() {
  appsPage.classList.remove("active");
  heroPage.classList.add("active");
}

function backToApps() {
  plansPage.classList.remove("active");
  appsPage.classList.add("active");
}

/* ================= INIT ================= */
loadAppsWithKeys();
