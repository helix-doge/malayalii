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
    `)
    .order("created_at", { ascending: false });

  if (error) return res.json([]);
  res.json(data);
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
