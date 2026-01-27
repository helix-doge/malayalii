import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let APPS = [];
let EDIT_ID = null;

/* ---------- NAV ---------- */
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => showPage(btn.dataset.page);
});

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ---------- LOAD APPS ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  APPS = data || [];
  renderApps();
  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s,a)=>s+a.plans.length,0);
}

function renderApps() {
  appsList.innerHTML = "";
  const filter = appFilter.value;

  APPS
    .filter(a => filter === "all" || a.platform === filter)
    .forEach(app => {
      const d = document.createElement("div");
      d.innerHTML = `
        <b>${app.name}</b><br>
        ${app.platform}<br>
        <button>Edit</button>
      `;
      d.querySelector("button").onclick = () => editApp(app);
      appsList.appendChild(d);
    });
}

appFilter.onchange = renderApps;

/* ---------- ADD APP ---------- */
goAddApp.onclick = () => {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteAppBtn.classList.add("hidden");
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
  showPage("appFormPage");
};

/* ---------- EDIT APP ---------- */
function editApp(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteAppBtn.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlanRow(p.label, p.price));
  showPage("appFormPage");
}

/* ---------- PLANS (FIXED) ---------- */
addPlanBtn.onclick = () => addPlanRow();

function addPlanRow(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "plan-row";
  row.innerHTML = `
    <input placeholder="Plan name" value="${label}">
    <input type="number" placeholder="Price" value="${price}">
    <button>✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
}

/* ---------- SAVE APP ---------- */
saveAppBtn.onclick = async () => {
  if (!appName.value) return;

  let app;
  if (EDIT_ID) {
    const res = await supabase
      .from("apps")
      .update({ name: appName.value, platform: platform.value, description: description.value })
      .eq("id", EDIT_ID)
      .select().single();
    app = res.data;
    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  } else {
    const res = await supabase
      .from("apps")
      .insert({ name: appName.value, platform: platform.value, description: description.value })
      .select().single();
    app = res.data;
  }

  for (const row of plans.children) {
    const label = row.children[0].value;
    const price = row.children[1].value;
    if (label && price) {
      await supabase.from("plans").insert({ app_id: app.id, label, price });
    }
  }

  showPage("appsPage");
  loadApps();
};

/* ---------- DELETE ---------- */
deleteAppBtn.onclick = async () => {
  await supabase.from("apps").delete().eq("id", EDIT_ID);
  showPage("appsPage");
  loadApps();
};

/* INIT */
loadApps();
