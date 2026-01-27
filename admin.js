import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

const pages = document.querySelectorAll(".page");
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
showPage("apps");

/* ---------- PLANS ---------- */
window.addPlan = () => {
  const div = document.createElement("div");
  div.className = "plan";
  div.innerHTML = `
    <input placeholder="Label">
    <input type="number" placeholder="Price">
    <button onclick="this.parentElement.remove()">X</button>
  `;
  plans.appendChild(div);
};

/* ---------- SAVE APP ---------- */
saveApp.onclick = async () => {
  try {
    if (!appName.value) return alert("Name required");
    if (!iconFile.files[0]) return alert("Icon required");

    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const upload = await supabase
      .storage.from("app-icons")
      .upload(path, file, { upsert: true });

    if (upload.error) throw upload.error;

    const { data: url } = supabase
      .storage.from("app-icons")
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
        price
      });
    }

    alert("App saved");
    plans.innerHTML = "";
    loadApps();
    showPage("apps");

  } catch (e) {
    console.error(e);
    alert("FAILED – open console");
  }
};

/* ---------- LOAD APPS ---------- */
let allApps = [];

async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)");

  allApps = data || [];
  render();
}

function render() {
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

filter.onchange = render;

loadApps();
