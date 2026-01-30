document.addEventListener("DOMContentLoaded", () => {

  /* ================= SUPABASE ================= */
  const supabaseClient = supabase.createClient(
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
    details: document.getElementById("appDetails")
  };

  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");
  const backBtn = document.getElementById("backBtn");
  const detailsBackBtn = document.getElementById("detailsBackBtn");
  const buyBtn = document.getElementById("buyBtn");

  const appGrid = document.getElementById("appGrid");
  const appsTitle = document.getElementById("appsTitle");

  const detailsIcon = document.getElementById("detailsIcon");
  const detailsName = document.getElementById("detailsName");
  const planSelect = document.getElementById("planSelect");

  /* ================= PAGE SWITCH ================= */
  function showPage(name) {
    Object.values(pages).forEach(p => p.classList.remove("show"));
    pages[name].classList.add("show");
  }

  /* ================= BUTTONS ================= */
  androidBtn.onclick = () => loadApps("android");
  iosBtn.onclick = () => loadApps("ios");
  backBtn.onclick = () => showPage("home");
  detailsBackBtn.onclick = () => showPage("apps");
  buyBtn.onclick = buyKey;

  /* ================= LOAD APPS ================= */
  async function loadApps(platform) {
    const { data, error } = await supabaseClient
      .from("apps")
      .select("*")
      .eq("platform", platform);

    if (error) {
      alert("Failed to load apps");
      return;
    }

    appsTitle.textContent = platform.toUpperCase() + " APPS";
    appGrid.innerHTML = "";

    if (!data.length) {
      appGrid.innerHTML = "<p style='opacity:.6'>No apps available</p>";
    }

    data.forEach(app => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <img src="${app.icon_url || ""}">
        <h4>${app.name}</h4>
      `;
      card.onclick = () => openApp(app);
      appGrid.appendChild(card);
    });

    showPage("apps");
  }

  /* ================= LOAD KEY COUNTS ================= */
  async function loadKeyCounts() {
    KEY_COUNT = {};
    const { data } = await supabaseClient.from("keys").select("plan_id");
    data.forEach(k => {
      if (!k.plan_id) return;
      KEY_COUNT[k.plan_id] = (KEY_COUNT[k.plan_id] || 0) + 1;
    });
  }

  /* ================= OPEN APP ================= */
  async function openApp(app) {
    CURRENT_APP = app;
    CURRENT_PLAN = null;

    detailsIcon.src = app.icon_url || "";
    detailsName.textContent = app.name;

    await loadKeyCounts();

    const { data: plans } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("app_id", app.id);

    renderPlans(plans || []);
    showPage("details");
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
        <span>${plan.label}</span>
        <b>₹ ${plan.price}</b>
        ${soldOut ? "<em>SOLD OUT</em>" : `<small>${available} keys</small>`}
      `;

      if (!soldOut) {
        div.onclick = () => {
          document.querySelectorAll(".plan-card")
            .forEach(p => p.classList.remove("active"));
          div.classList.add("active");
          CURRENT_PLAN = plan;
        };
      }

      planSelect.appendChild(div);
    });
  }

  /* ================= BUY KEY ================= */
  async function buyKey() {
    if (!CURRENT_PLAN) {
      alert("Please select a plan");
      return;
    }

    const { data } = await supabaseClient
      .from("keys")
      .select("*")
      .eq("plan_id", CURRENT_PLAN.id)
      .limit(1)
      .single();

    if (!data) {
      alert("No keys available");
      return;
    }

    await supabaseClient.from("keys").delete().eq("id", data.id);

    alert("Your Key:\n\n" + data.key_value);
    openApp(CURRENT_APP);
  }

});
