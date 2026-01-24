const API = "https://malayali-store-backend.onrender.com";

const supabase = window.supabase.createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

let PLANS = [];

function addPlan() {
  PLANS.push({ label: "", price: "" });
  renderPlans();
}

function renderPlans() {
  const box = document.getElementById("plans");
  box.innerHTML = "";
  PLANS.forEach((p, i) => {
    box.innerHTML += `
      <input placeholder="1 DAY / 1 WEEK / 1 MONTH"
        oninput="PLANS[${i}].label=this.value">
      <input placeholder="Price"
        oninput="PLANS[${i}].price=this.value">
    `;
  });
}

async function saveApp() {
  const file = document.getElementById("icon").files[0];
  let icon_url = null;

  if (file) {
    const { data } = await supabase.storage
      .from("app-icons")
      .upload(`icons/${Date.now()}-${file.name}`, file, { upsert: true });

    icon_url =
      `https://dytrdmvicireccasxxvj.supabase.co/storage/v1/object/public/app-icons/${data.path}`;
  }

  await fetch(`${API}/api/admin/app`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.value,
      description: desc.value,
      platform: platform.value,
      icon_url,
      plans: PLANS
    })
  });

  PLANS = [];
  loadApps();
}

async function loadApps() {
  const res = await fetch(`${API}/api/apps`);
  const apps = await res.json();

  const box = document.getElementById("apps");
  box.innerHTML = "";

  apps.forEach(a => {
    box.innerHTML += `
      <div>
        <b>${a.name}</b> (${a.platform})
        <button onclick="del('${a.id}')">Delete</button>
      </div>
    `;
  });
}

async function del(id) {
  await fetch(`${API}/api/admin/app/${id}`, { method: "DELETE" });
  loadApps();
}

loadApps();
