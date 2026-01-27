import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- STATE ---------- */
let ALL_APPS = [];
let EDITING_ID = null;

/* ---------- NAV ---------- */
const pages = {
  dashboard: dashboardPage,
  apps: appsPage,
  add: addPage
};

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");
}

btnDashboard.onclick = () => show("dashboard");
btnApps.onclick = () => show("apps");
btnAdd.onclick = () => {
  resetForm();
  show("add");
};

/* ---------- PLANS UI ---------- */
addPlanBtn.onclick = () => addPlan();

function addPlan(label="", price="") {
  const div = document.createElement("div");
  div.className = "plan";
  div.innerHTML = `
    <input value="${label}" placeholder="Label">
    <input type="number" value="${price}" placeholder="Price">
    <button type="button">✕</button>
  `;
  div.querySelector("button").onclick = () => div.remove();
  plans.appendChild(div);
}

/* ---------- SAVE APP ---------- */
saveAppBtn.onclick = async () => {
  try {
    if (!appName.value) return alert("Name required");

    let iconUrl = null;

    if (iconFile.files[0]) {
      const file = iconFile.files[0];
      const path = `${Date.now()}-${file.name}`;
      await supabase.storage.from("app-icons").upload(path, file, { upsert:true });
      iconUrl = supabase.storage.from("app-icons").getPublicUrl(path).data.publicUrl;
    }

    let app;
    if (EDITING_ID) {
      const res = await supabase.from("apps")
        .update({ name: appName.value, platform: platform.value, description: description.value, ...(iconUrl && { icon_url: iconUrl }) })
        .eq("id", EDITING_ID)
        .select().single();
      app = res.data;
      await supabase.from("plans").delete().eq("app_id", EDITING_ID);
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
    await loadApps();
    show("apps");

  } catch (e) {
    console.error(e);
    alert("Save failed – console");
  }
};

/* ---------- LOAD & RENDER ---------- */
async function loadApps() {
  const { data } = await supabase.from("apps").select("*, plans(*)");
  ALL_APPS = data || [];
  renderApps();
  updateStats();
}

function renderApps() {
  appsList.innerHTML = "";
  const f = filter.value;

  ALL_APPS
    .filter(a => f==="all" || a.platform===f)
    .forEach(a => {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `
        <b>${a.name}</b><br>${a.platform}<br>
        Plans: ${a.plans.length}
        <div class="actions">
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      `;
      d.querySelector(".edit").onclick = () => editApp(a);
      d.querySelector(".delete").onclick = () => deleteApp(a.id);
      appsList.appendChild(d);
    });
}

function updateStats() {
  statTotal.textContent = ALL_APPS.length;
  statAndroid.textContent = ALL_APPS.filter(a=>a.platform==="android").length;
  statIos.textContent = ALL_APPS.filter(a=>a.platform==="ios").length;
  statPlans.textContent = ALL_APPS.reduce((s,a)=>s+a.plans.length,0);
}

/* ---------- EDIT / DELETE ---------- */
function editApp(app) {
  EDITING_ID = app.id;
  appName.value = app.name;
  platform.value = app.platform;
  description.value = app.description || "";
  plans.innerHTML = "";
  app.plans.forEach(p => addPlan(p.label, p.price));
  formTitle.textContent = "Edit App";
  show("add");
}

async function deleteApp(id) {
  if (!confirm("Delete app?")) return;
  await supabase.from("apps").delete().eq("id", id);
  loadApps();
}

/* ---------- HELPERS ---------- */
function resetForm() {
  EDITING_ID = null;
  appName.value = "";
  description.value = "";
  plans.innerHTML = "";
  formTitle.textContent = "Add App";
}

filter.onchange = renderApps;

/* ---------- REALTIME (SAFE) ---------- */
let refreshTimeout = null;
supabase.channel("safe-realtime")
  .on("postgres_changes", { event:"*", schema:"public", table:"apps" }, () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(loadApps, 500);
  })
  .on("postgres_changes", { event:"*", schema:"public", table:"plans" }, () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(loadApps, 500);
  })
  .subscribe();

/* ---------- INIT ---------- */
loadApps();
