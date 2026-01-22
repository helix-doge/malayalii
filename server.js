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

/* Health check */
app.get("/", (req, res) => {
  res.send("Malayali Store Backend Running");
});

/* USER + ADMIN: GET ALL APPS */
app.get("/api/apps", async (req, res) => {
  const { data, error } = await supabase
    .from("apps")
    .select("id,name,description,platform,icon_url,plans(id,label,price)");

  if (error) return res.status(500).json(error);
  res.json(data);
});

/* ADMIN: ADD APP */
app.post("/api/admin/app", async (req, res) => {
  const { name, description, platform, icon_url, plans } = req.body;

  const { data: appRow, error } = await supabase
    .from("apps")
    .insert([{ name, description, platform, icon_url }])
    .select()
    .single();

  if (error) return res.status(500).json(error);

  const planRows = plans.map(p => ({
    app_id: appRow.id,
    label: p.label,
    price: p.price
  }));

  if (planRows.length > 0) {
    await supabase.from("plans").insert(planRows);
  }

  res.json({ success: true });
});

/* ADMIN: UPDATE APP */
app.put("/api/admin/app/:id", async (req, res) => {
  const { name, description, platform, icon_url, plans } = req.body;
  const appId = req.params.id;

  await supabase
    .from("apps")
    .update({ name, description, platform, icon_url })
    .eq("id", appId);

  await supabase.from("plans").delete().eq("app_id", appId);

  if (plans.length > 0) {
    const planRows = plans.map(p => ({
      app_id: appId,
      label: p.label,
      price: p.price
    }));
    await supabase.from("plans").insert(planRows);
  }

  res.json({ success: true });
});

/* ADMIN: DELETE APP */
app.delete("/api/admin/app/:id", async (req, res) => {
  const appId = req.params.id;
  await supabase.from("plans").delete().eq("app_id", appId);
  await supabase.from("apps").delete().eq("id", appId);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Backend running");
});
