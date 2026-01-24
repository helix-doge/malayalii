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

app.get("/api/apps", async (req, res) => {
  const { data: apps, error } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("APPS FETCH ERROR:", error);
    return res.status(500).json([]);
  }

  // Fetch plans separately (NO JOIN BUGS)
  const { data: plans } = await supabase.from("plans").select("*");

  const appsWithPlans = apps.map(app => ({
    ...app,
    plans: plans.filter(p => p.app_id === app.id)
  }));

  res.setHeader("Cache-Control", "no-store");
  res.json(appsWithPlans);
});

app.post("/api/admin/app", async (req, res) => {
  const { name, description, platform, icon_url, plans } = req.body;

  const { data: appRow } = await supabase
    .from("apps")
    .insert([{ name, description, platform, icon_url }])
    .select()
    .single();

  if (plans?.length) {
    await supabase.from("plans").insert(
      plans.map(p => ({
        app_id: appRow.id,
        label: p.label,
        price: Number(p.price)
      }))
    );
  }

  res.json({ success: true });
});

app.delete("/api/admin/app/:id", async (req, res) => {
  await supabase.from("plans").delete().eq("app_id", req.params.id);
  await supabase.from("apps").delete().eq("id", req.params.id);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
