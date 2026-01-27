import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- NAV ---------- */
const pages = {
  dashboard: document.getElementById("dashboard"),
  apps: document.getElementById("apps"),
  add: document.getElementById("add")
};

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("show"));
  pages[page].classList.add("show");
}

btnDashboard.onclick = () => show("dashboard");
btnApps.onclick = () => show("apps");
btnAdd.onclick = () => show("add");

/* ---------- PLANS ---------- */
addPlan.onclick = () => {
  const div = document.createElement("div");
  div.className = "plan";
  div.innerHTML = `
    <input placeholder="Label">
    <input type="number" placeholder="Price">
    <button>✕</button>
  `;
  div.querySelector("button").onclick = () => div.remove();
  plans.appendChild(div);
};

/* ---------- SAVE APP ---------- */
saveApp.onclick = async () => {
  try {
    if (!appName.value) return alert("App name required");
    if (!iconFile.files[0]) return alert("Icon required");

    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const upload = await supabase.storage
      .from("app-icons")
      .upload(path, file, { upsert:true });

    if (upload.error) throw upload.error;

    const { data: url } = supabase.storage
      .from("app-icons")
      .getPublicUrl(path);

    const { data: app, error } = await supabase
      .from("apps")
      .insert({
        name: appName.value,
        platform: platform.value,
        description: description.value,
        icon_url: url.publicUrl
      })
      .select()
      .single();

    if (error) throw error;

    for (const row of plans.children) {
      const label = row.children[0].value;
      const price = row.children[1].value;
      if (!label || !price) continue;

      await supabase.from("plans").insert({
        app_id: app.id,
        label,
        price: Number(price)
      });
    }

    alert("App saved successfully");
    loadApps();
    show("apps");

  } catch (e) {
    console.error(e);
    alert("Save failed – check console");
  }
};

/* ---------- LOAD APPS ---------- */
let allApps = [];

async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)");

  allApps = data || [];
  renderApps();
  statTotal.textContent = allApps.length;
  statAndroid.textContent = allApps.filter(a=>a.platform==="android").length;
  statIos.textContent = allApps.filter(a=>a.platform==="ios").length;
}

function renderApps() {
  appsList.innerHTML = "";
  const f = filter.value;
  allApps
    .filter(a => f==="all" || a.platform===f)
    .forEach(app => {
      const d = document.createElement("div");
      d.className = "app";
      d.innerHTML = `<b>${app.name}</b><br>${app.platform}`;
      appsList.appendChild(d);
    });
}

filter.onchange = renderApps;

loadApps();
