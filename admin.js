import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let ALL_APPS = [];
let EDIT_ID = null;

/* ---------- NAV ---------- */
const pages = {
  dashboard: dashboardPage,
  apps: appsPage,
  add: addPage
};

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");

  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("btn" + page.charAt(0).toUpperCase() + page.slice(1)).classList.add("active");
}

btnDashboard.onclick = () => show("dashboard");
btnApps.onclick = () => show("apps");
btnAdd.onclick = () => {
  resetForm();
  show("add");
};

/* ---------- LOAD ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  ALL_APPS = data || [];
  renderApps();
  updateStats();
}

function updateStats() {
  statTotal.textContent = ALL_APPS.length;
  statAndroid.textContent = ALL_APPS.filter(a=>a.platform==="android").length;
  statIos.textContent = ALL_APPS.filter(a=>a.platform==="ios").length;
  statPlans.textContent = ALL_APPS.reduce((s,a)=>s+a.plans.length,0);
}

/* ---------- APPS ---------- */
function renderApps() {
  appsList.innerHTML = "";
  const f = filter.value;

  ALL_APPS
    .filter(a => f === "all" || a.platform === f)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";
      div.innerHTML = `
        <b>${app.name}</b>
        <small>${app.platform}</small><br>
        Plans: ${app.plans.length}
        <button>Edit</button>
      `;
      div.querySelector("button").onclick = () => editApp(app);
      appsList.appendChild(div);
    });
}

filter.onchange = renderApps;

/* ---------- EDIT ---------- */
function editApp(app) {
  EDIT_ID = app.id;
  formTitle.textContent = "Edit App";
  deleteBtn.style.display = "block";

  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";

  plans.innerHTML = "";
  app.plans.forEach(p => addPlan(p.label, p.price));

  show("add");
}

addPlanBtn.onclick = () => addPlan();

function addPlan(label="", price="") {
  const div = document.createElement("div");
  div.className = "plan";
  div.innerHTML = `
    <input value="${label}">
    <input type="number" value="${price}">
    <button>✕</button>
  `;
  div.querySelector("button").onclick = () => div.remove();
  plans.appendChild(div);
}

/* ---------- SAVE ---------- */
saveAppBtn.onclick = async () => {
  if (!appName.value) return alert("Name required");

  let iconUrl = null;

  if (iconFile.files[0]) {
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;
    await supabase.storage.from("app-icons").upload(path, file, { upsert:true });
    iconUrl = supabase.storage.from("app-icons").getPublicUrl(path).data.publicUrl;
  }

  let app;
  if (EDIT_ID) {
    const res = await supabase.from("apps")
      .update({ name: appName.value, platform: platform.value, description: description.value, ...(iconUrl && { icon_url: iconUrl }) })
      .eq("id", EDIT_ID)
      .select().single();
    app = res.data;
    await supabase.from("plans").delete().eq("app_id", EDIT_ID);
  } else {
    const res = await supabase.from("apps")
      .insert({ name: appName.value, platform: platform.value, description: description.value, icon_url: iconUrl })
      .select().single();
    app = res.data;
  }

  for (const row of plans.children) {
    await supabase.from("plans").insert({
      app_id: app.id,
      label: row.children[0].value,
      price: Number(row.children[1].value)
    });
  }

  resetForm();
  loadApps();
  show("apps");
};

/* ---------- DELETE ---------- */
deleteBtn.onclick = async () => {
  if (!confirm("Delete app?")) return;
  await supabase.from("apps").delete().eq("id", EDIT_ID);
  resetForm();
  loadApps();
  show("apps");
};

/* ---------- HELPERS ---------- */
function resetForm() {
  EDIT_ID = null;
  formTitle.textContent = "Add App";
  deleteBtn.style.display = "none";
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
}

supabase.channel("admin-live")
  .on("postgres_changes", { event:"*", schema:"public", table:"apps" }, loadApps)
  .on("postgres_changes", { event:"*", schema:"public", table:"plans" }, loadApps)
  .subscribe();

loadApps();
