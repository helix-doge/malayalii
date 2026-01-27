import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- PAGE SWITCH ---------- */
const appsPage = document.getElementById("appsPage");
const addPage = document.getElementById("addPage");

btnApps.onclick = () => {
  appsPage.classList.add("active");
  addPage.classList.remove("active");
};

btnAdd.onclick = () => {
  addPage.classList.add("active");
  appsPage.classList.remove("active");
};

/* ---------- PLANS ---------- */
addPlanBtn.onclick = () => {
  const row = document.createElement("div");
  row.className = "plan";
  row.innerHTML = `
    <input placeholder="Label (1 DAY)">
    <input type="number" placeholder="Price">
    <button type="button">✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plans.appendChild(row);
};

/* ---------- SAVE APP ---------- */
saveAppBtn.onclick = async () => {
  try {
    if (!appName.value.trim()) return alert("App name required");
    if (!iconFile.files[0]) return alert("Icon required");

    // upload icon
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const up = await supabase.storage
      .from("app-icons")
      .upload(path, file, { upsert: true });

    if (up.error) throw up.error;

    const { data: url } = supabase.storage
      .from("app-icons")
      .getPublicUrl(path);

    // insert app
    const { data: app, error } = await supabase
      .from("apps")
      .insert({
        name: appName.value.trim(),
        platform: platform.value,
        description: description.value.trim(),
        icon_url: url.publicUrl
      })
      .select()
      .single();

    if (error) throw error;

    // insert plans
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

    alert("App saved");
    plans.innerHTML = "";
    appName.value = "";
    description.value = "";
    loadApps();
    btnApps.click();

  } catch (err) {
    console.error(err);
    alert("FAILED – open console");
  }
};

/* ---------- LOAD APPS ---------- */
let allApps = [];

async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)")
    .order("created_at", { ascending: false });

  allApps = data || [];
  renderApps();
}

function renderApps() {
  appsList.innerHTML = "";
  const f = filter.value;

  allApps
    .filter(a => f === "all" || a.platform === f)
    .forEach(a => {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `
        <b>${a.name}</b><br>
        ${a.platform}<br>
        Plans: ${a.plans.length}
      `;
      appsList.appendChild(d);
    });
}

filter.onchange = renderApps;

loadApps();
