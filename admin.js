import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------------- TABS ---------------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("show"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.page).classList.add("show");
  };
});

/* ---------------- PLANS ---------------- */
const plansContainer = document.getElementById("plansContainer");

document.getElementById("addPlanBtn").onclick = () => {
  const row = document.createElement("div");
  row.className = "plan-row";
  row.innerHTML = `
    <input placeholder="Label (1 DAY)">
    <input type="number" placeholder="Price">
    <button type="button">✕</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  plansContainer.appendChild(row);
};

/* ---------------- SAVE APP ---------------- */
document.getElementById("saveAppBtn").onclick = async () => {
  try {
    if (!appName.value.trim()) return alert("App name required");
    if (!iconFile.files[0]) return alert("Icon required");

    // Upload icon
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase
      .storage.from("app-icons")
      .upload(path, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase
      .storage.from("app-icons")
      .getPublicUrl(path);

    // Insert app
    const { data: app, error: appError } = await supabase
      .from("apps")
      .insert({
        name: appName.value,
        platform: platform.value,
        description: description.value,
        icon_url: urlData.publicUrl
      })
      .select()
      .single();

    if (appError) throw appError;

    // Insert plans
    for (const row of plansContainer.children) {
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

    appName.value = description.value = "";
    plansContainer.innerHTML = "";

  } catch (err) {
    console.error(err);
    alert("Failed to save app");
  }
};

/* ---------------- LOAD APPS ---------------- */
let ALL_APPS = [];

async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)")
    .order("created_at", { ascending: false });

  ALL_APPS = data || [];
  renderApps();
  updateStats();
}

function renderApps() {
  const filter = platformFilter.value;
  appsList.innerHTML = "";

  ALL_APPS
    .filter(app => filter === "all" || app.platform === filter)
    .forEach(app => {
      const div = document.createElement("div");
      div.className = "app-card";
      div.innerHTML = `
        <img src="${app.icon_url}">
        <b>${app.name}</b><br>
        <small>${app.platform}</small>
      `;
      appsList.appendChild(div);
    });
}

platformFilter.onchange = renderApps;

function updateStats() {
  statTotal.textContent = ALL_APPS.length;
  statAndroid.textContent = ALL_APPS.filter(a => a.platform === "android").length;
  statIos.textContent = ALL_APPS.filter(a => a.platform === "ios").length;
}

/* ---------------- REALTIME ---------------- */
supabase.channel("live")
  .on("postgres_changes", { event: "*", schema: "public", table: "apps" }, loadApps)
  .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, loadApps)
  .subscribe();

loadApps();
