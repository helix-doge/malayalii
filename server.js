import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 SUPABASE
const supabaseUrl = "https://dytrdmvicireccasxxvj.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 🟢 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Malayali Store Backend Running");
});

// 🟢 GET APPS + PLANS
app.get("/api/apps", async (req, res) => {
  try {
    const { data: apps, error: appsError } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });

    if (appsError) throw appsError;

    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*");

    if (plansError) throw plansError;

    const result = apps.map(app => ({
      ...app,
      plans: plans.filter(p => p.app_id === app.id)
    }));

    res.setHeader("Cache-Control", "no-store");
    res.json(result);
  } catch (err) {
    console.error("GET /api/apps error:", err);
    res.status(500).json([]);
  }
});

// 🟣 SAVE APP + PLANS
app.post("/api/admin/app", async (req, res) => {
  try {
    const { name, description, platform, icon_url, plans } = req.body;

    const { data: app, error: appError } = await supabase
      .from("apps")
      .insert([{ name, description, platform, icon_url }])
      .select()
      .single();

    if (appError) throw appError;

    if (Array.isArray(plans) && plans.length > 0) {
      const plansData = plans.map(p => ({
        app_id: app.id,
        label: p.label,
        price: p.price
      }));

      const { error: plansError } = await supabase
        .from("plans")
        .insert(plansData);

      if (plansError) throw plansError;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/app error:", err);
    res.status(500).json({ error: "Failed to save app" });
  }
});

// 🟢 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
