import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------- TABS ---------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("show"));
    document.getElementById(tab.dataset.page).classList.add("show");
  };
});

/* ---------- PLANS UI ---------- */
const plansContainer = document.getElementById("plansContainer");
document.getElementById("addPlanBtn").onclick = () => {
  const div = document.createElement("div");
  div.className = "plan-row";
  div.innerHTML = `
    <input placeholder="Label (1 DAY)">
    <input type="number" placeholder="Price">
  `;
  plansContainer.appendChild(div);
};

/* ---------- SAVE APP ---------- */
document.getElementById("saveAppBtn").onclick = async () => {
  const file = iconFile.files[0];
  if (!file) return alert("Upload icon");

  const filePath = `${Date.now()}-${file.name}`;
  await supabase.storage.from("app-icons").upload(filePath, file);

  const { data: url } = supabase
    .storage.from("app-icons")
    .getPublicUrl(filePath);

  const { data: app } = await supabase
    .from("apps")
    .insert({
      name: appName.value,
      platform: platform.value,
      description: description.value,
      icon_url: url.publicUrl
    })
    .select()
    .single();

  const planRows = [...plansContainer.children];
  for (const row of planRows) {
    await supabase.from("plans").insert({
      app_id: app.id,
      label: row.children[0].value,
      price: Number(row.children[1].value)
    });
  }

  alert("App saved");
};

/* ---------- LOAD APPS ---------- */
async function loadApps() {
  const { data } = await supabase
    .from("apps")
    .select("*, plans(*)");

  appsList.innerHTML = "";
  data.forEach(app => {
    const div = document.createElement("div");
    div.className = "app-card";
    div.innerHTML = `
      <img src="${app.icon_url}">
      <b>${app.name}</b><br>
      <small>${app.platform}</small>
    `;
    appsList.appendChild(div);
  });

  statTotal.textContent = data.length;
  statAndroid.textContent = data.filter(a=>a.platform==="android").length;
  statIos.textContent = data.filter(a=>a.platform==="ios").length;
}

/* ---------- REALTIME ---------- */
supabase.channel("live")
  .on("postgres_changes", { event:"*", schema:"public", table:"apps" }, loadApps)
  .on("postgres_changes", { event:"*", schema:"public", table:"plans" }, loadApps)
  .subscribe();

loadApps();
