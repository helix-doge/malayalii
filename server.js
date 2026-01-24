import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* Health */
app.get("/", (_, res) => res.send("Backend OK"));

/* GET APPS (USER + ADMIN) */
app.get("/api/apps", async (_, res) => {
  const { data, error } = await supabase
    .from("apps")
    .select(`
      id,
      name,
      description,
      platform,
      icon_url,
      plans (
        id,
        label,
        price
      )
    `);

  if (error) return res.status(500).json(error);
  res.json(data);
});

/* ADD APP */
app.post("/api/admin/app", async (req, res) => {
  const { name, description, platform, icon_url, plans } = req.body;

  const { data: appRow, error } = await supabase
    .from("apps")
    .insert([{ name, description, platform, icon_url }])
    .select()
    .single();

  if (error) return res.status(500).json(error);

  if (plans?.length) {
    const planRows = plans.map(p => ({
      app_id: appRow.id,
      label: p.label,
      price: Number(p.price)
    }));
    await supabase.from("plans").insert(planRows);
  }

  res.json({ success: true, app: appRow });
});

/* UPDATE APP */
app.put("/api/admin/app/:id", async (req, res) => {
  const appId = req.params.id;
  const { name, description, platform, icon_url, plans } = req.body;

  await supabase
    .from("apps")
    .update({ name, description, platform, icon_url })
    .eq("id", appId);

  await supabase.from("plans").delete().eq("app_id", appId);

  if (plans?.length) {
    const planRows = plans.map(p => ({
      app_id: appId,
      label: p.label,
      price: Number(p.price)
    }));
    await supabase.from("plans").insert(planRows);
  }

  res.json({ success: true });
});

/* DELETE APP */
app.delete("/api/admin/app/:id", async (req, res) => {
  const appId = req.params.id;
  await supabase.from("plans").delete().eq("app_id", appId);
  await supabase.from("apps").delete().eq("id", appId);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
