const API = "https://malayali-store-backend.onrender.com";

async function loadApps() {
  const res = await fetch(`${API}/api/apps`);
  const apps = await res.json();

  const box = document.getElementById("apps");
  box.innerHTML = "";

  apps.forEach(app => {
    const div = document.createElement("div");
    div.innerHTML = `
      <b>${app.name}</b> (${app.platform})
      <button onclick="deleteApp('${app.id}')">Delete</button>
    `;
    box.appendChild(div);
  });
}

loadApps();

async function saveApp() {
  const name = document.getElementById("name").value;
  const description = document.getElementById("desc").value;
  const platform = document.getElementById("platform").value;

  await fetch(`${API}/api/admin/app`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, platform })
  });

  document.getElementById("name").value = "";
  document.getElementById("desc").value = "";

  loadApps();
}

async function deleteApp(id) {
  await fetch(`${API}/api/admin/app/${id}`, {
    method: "DELETE"
  });
  loadApps();
}
