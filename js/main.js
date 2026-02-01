const keyPage = document.getElementById("keyPage");
const purchasedKeyEl = document.getElementById("purchasedKey");
const copyKeyBtn = document.getElementById("copyKeyBtn");
const keyDoneBtn = document.getElementById("keyDoneBtn");

document.addEventListener("DOMContentLoaded", () => {

  const supabaseClient = supabase.createClient(
    "https://dytrdmvicireccasxxvj.supabase.co",
    "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
  );

  let CURRENT_APP = null;
  let CURRENT_PLAN = null;
  let KEY_COUNT = {};

  const pages = {
    home,
    apps,
    details: appDetails,
    key: keyPage
  };

  function showPage(p) {
    Object.values(pages).forEach(x => x.classList.remove("show"));
    pages[p].classList.add("show");
  }

  /* ================= NAV ================= */
  androidBtn.onclick = () => loadApps("android");
  iosBtn.onclick = () => loadApps("ios");
  backBtn.onclick = () => showPage("home");
  detailsBackBtn.onclick = () => showPage("apps");
  buyBtn.onclick = buyKey;

  /* ================= LOAD APPS ================= */
  async function loadApps(platform) {
    appGrid.innerHTML = "<p>Loading apps...</p>";

    const { data, error } = await supabaseClient
      .from("apps")
      .select("*")
      .eq("platform", platform);

    if (error) {
      appGrid.innerHTML = "<p>Failed to load apps</p>";
      return;
    }

    appGrid.innerHTML = "";
    appsTitle.textContent = platform.toUpperCase() + " APPS";

    data.forEach(app => {
      const d = document.createElement("div");
      d.className = "app-card";
      d.innerHTML = `
        <img src="${app.icon_url || ""}" alt="${app.name}">
        <h4>${app.name}</h4>
        <p class="app-desc">${app.description || ""}</p>
      `;
      d.onclick = () => openApp(app);
      appGrid.appendChild(d);
    });

    showPage("apps");
  }

  /* ================= LOAD KEY COUNTS ================= */
  async function loadKeyCounts() {
    KEY_COUNT = {};
    const { data } = await supabaseClient
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

    detailsIcon.src = app.icon_url;
    detailsName.textContent = app.name;

    planSelect.innerHTML = "<p>Loading plans...</p>";
    buyBtn.disabled = true;
    buyBtn.textContent = "Buy Key";

    showPage("details");

    await loadKeyCounts();

    const { data: plans } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("app_id", app.id);

    renderPlans(plans || []);
  }

  /* ================= RENDER PLANS ================= */
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
          ${soldOut
            ? "<small>SOLD OUT</small>"
            : `<small>${available} keys</small>`}
        </div>
        <div class="plan-price">₹ ${plan.price}</div>
      `;

      if (!soldOut) {
        div.onclick = () => {
          document
            .querySelectorAll(".plan-card")
            .forEach(p => p.classList.remove("active"));

          div.classList.add("active");
          CURRENT_PLAN = plan;
          buyBtn.disabled = false;
        };
      }

      planSelect.appendChild(div);
    });
  }

  /* ================= BUY KEY ================= */
  async function buyKey() {
    if (!CURRENT_PLAN) return;

    buyBtn.disabled = true;
    buyBtn.textContent = "Processing...";
    buyBtn.classList.add("loading");

    const { data, error } = await supabaseClient
      .from("keys")
      .select("*")
      .eq("plan_id", CURRENT_PLAN.id)
      .eq("is_used", false)
      .limit(1)
      .single();

    if (error || !data) {
      alert("No keys available");
      buyBtn.disabled = false;
      buyBtn.textContent = "Buy Key";
      buyBtn.classList.remove("loading");
      return;
    }

    await supabaseClient
      .from("keys")
      .update({ is_used: true })
      .eq("id", data.id);

    purchasedKeyEl.textContent = data.key_value;
    navigator.clipboard.writeText(data.key_value);

    buyBtn.classList.remove("loading");
    showPage("key");
  }

  /* ================= KEY PAGE ================= */
  copyKeyBtn.onclick = () => {
    navigator.clipboard.writeText(purchasedKeyEl.textContent);
    copyKeyBtn.textContent = "Copied ✔";
  };

  keyDoneBtn.onclick = () => {
    copyKeyBtn.textContent = "Copy Key";
    buyBtn.textContent = "Buy Key";
    buyBtn.disabled = true;
    openApp(CURRENT_APP);
  };

});
