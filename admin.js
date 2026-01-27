import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

/* ---------------- SAVE APP (FIXED) ---------------- */
document.getElementById("saveAppBtn").onclick = async () => {
  try {
    console.log("Saving app...");

    if (!appName.value.trim()) throw "App name required";
    if (!iconFile.files[0]) throw "Icon file required";

    /* 1️⃣ UPLOAD ICON */
    const file = iconFile.files[0];
    const path = `${Date.now()}-${file.name}`;

    const upload = await supabase
      .storage
      .from("app-icons")
      .upload(path, file, { upsert: true });

    if (upload.error) throw upload.error;

    const { data: urlData } = supabase
      .storage
      .from("app-icons")
      .getPublicUrl(path);

    if (!urlData?.publicUrl) throw "Icon URL failed";

    /* 2️⃣ INSERT APP */
    const appInsert = await supabase
      .from("apps")
      .insert({
        name: appName.value.trim(),
        platform: platform.value,
        description: description.value.trim(),
        icon_url: urlData.publicUrl
      })
      .select()
      .single();

    if (appInsert.error) throw appInsert.error;

    const app = appInsert.data;
    if (!app?.id) throw "App ID missing";

    /* 3️⃣ INSERT PLANS */
    for (const row of plansContainer.children) {
      const label = row.children[0].value.trim();
      const price = row.children[1].value;

      if (!label || !price) continue;

      const planInsert = await supabase
        .from("plans")
        .insert({
          app_id: app.id,
          label,
          price: Number(price)
        });

      if (planInsert.error) throw planInsert.error;
    }

    alert("✅ App saved successfully");

    appName.value = "";
    description.value = "";
    plansContainer.innerHTML = "";

  } catch (err) {
    console.error("SAVE APP ERROR:", err);
    alert("❌ Failed to save app\n\nCheck console for details");
  }
};
