import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ================= AUTH CHECK ================= */
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.replace("admin-login.html");
    return false;
  }
  return true;
}

/* ================= STATE ================= */
let EDIT_APP_ID = null;

/* ================= INIT ================= */
checkAuth().then(ok => {
  if (!ok) return;
  initAdmin();
});

/* ================= LOGOUT ================= */
function setupLogout() {
  document.getElementById("logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    window.location.replace("admin-login.html");
  };
}

/* ================= NAVIGATION ================= */
function setupNavigation() {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".bottom-nav button");

  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      pages.forEach(p => p.classList.remove("active"));
      document.getElementById("page-" + btn.dataset.page).classList.add("active");
    };
  });
}

/* ================= DASHBOARD ================= */
async function loadStats() {
  const { data: apps } = await supabase.from("apps").select("id");
  const { data: plans } = await supabase.from("plans").select("id");
  const { data: keys } = await supabase.from("keys").select("id");

  document.getElementById("statApps").textContent = apps.length;
  document.getElementById("statPlans").textContent = plans.length;
  document.getElementById("statKeys").textContent = keys.length;
}

/* ================= LOAD APPS ================= */
async function loadApps() {
  const list = document.getElementById("appsList");
  const filter = document.getElementById("appFilter").value;

  const { data } = await supabase.from("apps").select("*");

  list.innerHTML = "";

  data
    .filter(app => filter === "all" || app.platform === filter)
    .forEach(app => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <b>${app.name}</b><br>
        <small>${app.platform}</small><br>
        <button class="primary editBtn">Edit</button>
      `;

      card.querySelector(".editBtn").onclick = () => openEdit(app);

      list.appendChild(card);
    });
}

document.getElementById("appFilter").onchange = loadApps;

/* ================= EDIT APP ================= */
async function openEdit(app) {
  EDIT_APP_ID = app.id;

  document.querySelector('[data-page="add"]').click();
  document.getElementById("formTitle").textContent = "Edit App";
  document.getElementById("cancelEditBtn").classList.remove("hidden");

  document.getElementById("appName").value = app.name;
  document.getElementById("platform").value = app.platform;
  document.getElementById("description").value = app.description || "";

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("app_id", app.id);

  const plansDiv = document.getElementById("plans");
  plansDiv.innerHTML = "";

  plans.forEach(p => addPlanRow(p.label, p.price));
}

/* ================= PLAN ROW ================= */
function addPlanRow(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "plan-row";

  row.innerHTML = `
    <input placeholder="Plan name" value="${label}">
    <input type="number" placeholder="Price" value="${price}">
    <button type="button">X</button>
  `;

  row.querySelector("button").onclick = () => row.remove();

  document.getElementById("plans").appendChild(row);
}

document.getElementById("addPlanBtn").onclick = () => addPlanRow();

/* ================= SAVE APP ================= */
document.getElementById("saveAppBtn").onclick = async () => {
  const name = document.getElementById("appName").value;
  const platform = document.getElementById("platform").value;
  const description = document.getElementById("description").value;

  if (!name) return alert("Enter app name");

  let appData;

  if (EDIT_APP_ID) {
    const { data } = await supabase
      .from("apps")
      .update({ name, platform, description })
      .eq("id", EDIT_APP_ID)
      .select()
      .single();

    appData = data;

    await supabase.from("plans").delete().eq("app_id", EDIT_APP_ID);

  } else {
    const { data } = await supabase
      .from("apps")
      .insert({ name, platform, description })
      .select()
      .single();

    appData = data;
  }

  const rows = document.querySelectorAll(".plan-row");

  for (const row of rows) {
    const label = row.children[0].value;
    const price = row.children[1].value;

    if (label && price) {
      await supabase.from("plans").insert({
        app_id: appData.id,
        label,
        price
      });
    }
  }

  resetForm();
  loadApps();
  loadStats();
};

/* ================= RESET FORM ================= */
document.getElementById("cancelEditBtn").onclick = resetForm;

function resetForm() {
  EDIT_APP_ID = null;

  document.getElementById("formTitle").textContent = "Add App";
  document.getElementById("cancelEditBtn").classList.add("hidden");

  document.getElementById("appName").value = "";
  document.getElementById("description").value = "";
  document.getElementById("plans").innerHTML = "";
}

/* ================= INIT ================= */
function initAdmin() {
  setupLogout();
  setupNavigation();
  loadStats();
  loadApps();
}
