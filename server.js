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

/* GET ALL APPS + PLANS (USER SIDE) */
app.get("/api/apps", async (req, res) => {
  const { data, error } = await supabase
    .from("apps")
    .select("*, plans(*)");

  if (error) return res.status(500).json(error);
  res.json(data);
});

/* ADMIN: ADD APP */
app.post("/api/admin/app", async (req, res) => {
  const { name, description, platform, icon_url, plans } = req.body;

  const { data: appData, error } = await supabase
    .from("apps")
    .insert([{ name, description, platform, icon_url }])
    .select()
    .single();

  if (error) return res.status(500).json(error);

  const planRows = plans.map(p => ({
    app_id: appData.id,
    label: p.label,
    price: p.price
  }));

  await supabase.from("plans").insert(planRows);

  res.json({ success: true });
});

/* ADMIN: DELETE APP */
app.delete("/api/admin/app/:id", async (req, res) => {
  await supabase.from("plans").delete().eq("app_id", req.params.id);
  await supabase.from("apps").delete().eq("id", req.params.id);
  res.json({ success: true });
});

app.listen(3000, () => console.log("Backend running"));
