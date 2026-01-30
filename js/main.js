document.addEventListener("DOMContentLoaded", () => {

  const supabaseClient = supabase.createClient(
    "https://dytrdmvicireccasxxvj.supabase.co",
    "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
  );

  let CURRENT_APP = null;
  let CURRENT_PLAN = null;
  let KEY_COUNT = {};

  const pages = {
    home: home,
    apps: apps,
    details: appDetails
  };

  function showPage(p) {
    Object.values(pages).forEach(x => x.classList.remove("show"));
    pages[p].classList.add("show");
  }

  androidBtn.onclick = () => loadApps("android");
  iosBtn.onclick = () => loadApps("ios");
  backBtn.onclick = () => showPage("home");
  detailsBackBtn.onclick = () => showPage("apps");
  buyBtn.onclick = buyKey;

  async function loadApps(platform) {
    const { data } = await supabaseClient
      .from("apps")
      .select("*")
      .eq("platform", platform);

    appGrid.innerHTML = "";
    appsTitle.textContent = platform.toUpperCase() + " APPS";

    data.forEach(app => {
      const d = document.createElement("div");
      d.className = "app-card";
      d.innerHTML = `<img src="${app.icon_url}"><h4>${app.name}</h4>`;
      d.onclick = () => openApp(app);
      appGrid.appendChild(d);
    });

    showPage("apps");
  }

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

  async function openApp(app) {
    CURRENT_APP = app;
    CURRENT_PLAN = null;
    buyBtn.disabled = true;

    detailsIcon.src = app.icon_url;
    detailsName.textContent = app.name;

    await loadKeyCounts();

    const { data: plans } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("app_id", app.id);

    renderPlans(plans);
    showPage("details");
  }

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

  async function buyKey() {
    if (!CURRENT_PLAN) return;

    const { data } = await supabaseClient
      .from("keys")
      .select("*")
      .eq("plan_id", CURRENT_PLAN.id)
      .eq("is_used", false)
      .limit(1)
      .single();

    if (!data) {
      alert("No keys available");
      return;
    }

    await supabaseClient
      .from("keys")
      .update({ is_used: true })
      .eq("id", data.id);

    alert("Your Key:\n\n" + data.key_value);
    openApp(CURRENT_APP);
  }

});
