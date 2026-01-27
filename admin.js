import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let APPS = [];
let EDIT_ID = null;

/* -------- NAV -------- */
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");
  };
});

/* -------- LOAD APPS -------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  APPS = data || [];

  appsList.innerHTML = "";
  APPS.forEach(app => {
    const d = document.createElement("div");
    d.innerHTML = `
      <b>${app.name}</b><br>
      ${app.platform}<br>
      <button>Edit</button>
    `;
    d.querySelector("button").onclick = () => editApp(app);
    appsList.appendChild(d);
  });

  statApps.textContent = APPS.length;
  statPlans.textContent = APPS.reduce((s,a)=>s+a.plans.length,0);

  loadKeyDropdowns();
}

/* -------- APP FORM -------- */
openAdd.onclick = () => {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteApp.classList.add("hidden");
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
  showPage("appForm");
};

function editApp(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteApp.classList.remove("hidden");

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";
  plans.innerHTML = "";

  app.plans.forEach(p => addPlan(p.label, p.price));
  showPage("appForm");
}

addPlan.onclick = () => addPlan();

function addPlan(label="", price="") {
  const d = document.createElement("div");
  d.innerHTML = `
    <input placeholder="Plan" value="${label}">
    <input type="number" placeholder="Price" value="${price}">
  `;
  plans.appendChild(d);
}

saveApp.onclick = async () => {
  if (!appName.value) return;

  let app;
  if (EDIT_ID) {
    const res = await supabase.from("apps")
      .update({ name: appName.value, platform: platform.value, description: description.value })
      .eq("id", EDIT_ID)
      .select().single();
    app = res.data;
    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  } else {
    const res = await supabase.from("apps")
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

  showPage("apps");
  loadApps();
};

deleteApp.onclick = async () => {
  await supabase.from("apps").delete().eq("id", EDIT_ID);
  showPage("apps");
  loadApps();
};

/* -------- KEYS -------- */
function loadKeyDropdowns() {
  keyApp.innerHTML = "";
  APPS.forEach(a => {
    const o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    keyApp.appendChild(o);
  });
  loadKeyPlans();
}

function loadKeyPlans() {
  keyPlan.innerHTML = "";
  const app = APPS.find(a => a.id === keyApp.value);
  if (!app) return;
  app.plans.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    keyPlan.appendChild(o);
  });
}

keyApp.onchange = loadKeyPlans;

saveKeys.onclick = async () => {
  const lines = keyInput.value.split("\n").map(l=>l.trim()).filter(Boolean);
  for (const k of lines) {
    await supabase.from("keys").insert({
      app_id: keyApp.value,
      plan_id: keyPlan.value,
      key_value: k
    });
  }
  keyInput.value = "";
  keyInfo.textContent = "Keys saved successfully";
};

/* -------- UTIL -------- */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* INIT */
loadApps();
