import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

const pages = {
  dashboard,
  apps,
  edit
};

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");
  document.querySelectorAll(".sidebar button").forEach(b => b.classList.remove("active"));
  document.getElementById("nav" + page.charAt(0).toUpperCase() + page.slice(1)).classList.add("active");
}

navDashboard.onclick = () => show("dashboard");
navApps.onclick = () => show("apps");

let ALL_APPS = [];
let CURRENT_APP = null;

/* ---------- LOAD DATA ---------- */
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

/* ---------- APPS LIST ---------- */
function renderApps() {
  appsList.innerHTML = "";
  ALL_APPS.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <b>${app.name}</b><br>
      ${app.platform}<br>
      Plans: ${app.plans.length}
      <button>Edit</button>
    `;
    div.querySelector("button").onclick = () => openEdit(app);
    appsList.appendChild(div);
  });
}

/* ---------- EDIT ---------- */
function openEdit(app) {
  CURRENT_APP = app;
  appName.value = app.name;
  description.value = app.description || "";
  plans.innerHTML = "";
  app.plans.forEach(p => addPlan(p.label, p.price));
  show("edit");
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
saveBtn.onclick = async () => {
  if (!CURRENT_APP) return;

  let iconUrl = CURRENT_APP.icon_url;

  if (iconFile.files[0]) {
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;
    await supabase.storage.from("app-icons").upload(path, file, { upsert:true });
    iconUrl = supabase.storage.from("app-icons").getPublicUrl(path).data.publicUrl;
  }

  await supabase.from("apps")
    .update({
      name: appName.value,
      description: description.value,
      icon_url: iconUrl
    })
    .eq("id", CURRENT_APP.id);

  await supabase.from("plans").delete().eq("app_id", CURRENT_APP.id);

  for (const row of plans.children) {
    await supabase.from("plans").insert({
      app_id: CURRENT_APP.id,
      label: row.children[0].value,
      price: Number(row.children[1].value)
    });
  }

  await loadApps();
  show("apps");
};

/* ---------- DELETE ---------- */
deleteBtn.onclick = async () => {
  if (!confirm("Delete this app?")) return;
  await supabase.from("apps").delete().eq("id", CURRENT_APP.id);
  await loadApps();
  show("apps");
};

/* ---------- REALTIME (SAFE) ---------- */
supabase.channel("admin-safe")
  .on("postgres_changes", { event:"*", schema:"public", table:"apps" }, loadApps)
  .on("postgres_changes", { event:"*", schema:"public", table:"plans" }, loadApps)
  .subscribe();

loadApps();
