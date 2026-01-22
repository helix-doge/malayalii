const SUPABASE_URL = "YOUR_URL";
const SUPABASE_KEY = "YOUR_ANON_KEY";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

let plans = [];

function addPlan() {
  const label = prompt("1 DAY / 1 WEEK / 1 MONTH");
  const price = prompt("Price");
  plans.push({ label, price });
  renderPlans();
}

function renderPlans() {
  plansDiv.innerHTML = plans.map(p => `${p.label} - ₹${p.price}`).join("<br>");
}

async function saveApp() {
  const file = icon.files[0];
  const { data } = await supabase.storage
    .from("app-icons")
    .upload(Date.now() + file.name, file);

  const icon_url = `${SUPABASE_URL}/storage/v1/object/public/app-icons/${data.path}`;

  await fetch("/api/admin/app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.value,
      description: desc.value,
      platform: platform.value,
      icon_url,
      plans
    })
  });

  alert("Saved");
  location.reload();
}
