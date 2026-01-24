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

/* TEST */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* GET ALL APPS */
app.get("/api/apps", async (req, res) => {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return res.json([]);
  }

  res.json(data);
});

/* ADD APP */
app.post("/api/admin/app", async (req, res) => {
  const { name, description, platform } = req.body;

  const { error } = await supabase.from("apps").insert([
    { name, description, platform }
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

/* DELETE APP */
app.delete("/api/admin/app/:id", async (req, res) => {
  await supabase.from("apps").delete().eq("id", req.params.id);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
