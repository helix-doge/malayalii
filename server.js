const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const DATA_FILE = "./data/apps.json";

/* Ensure data file exists */
if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ android: [], ios: [] }, null, 2));
}

/* Multer config */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* Helpers */
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

/* Get apps (user side) */
app.get("/api/apps", (req, res) => {
  res.json(readData());
});

/* Add app */
app.post("/api/apps", upload.single("icon"), (req, res) => {
  const { name, description, platform, plans } = req.body;
  const data = readData();

  data[platform].push({
    id: Date.now(),
    name,
    description,
    icon: req.file ? `/uploads/${req.file.filename}` : "",
    plans: JSON.parse(plans)
  });

  saveData(data);
  res.json({ success: true });
});

/* Update app */
app.put("/api/apps/:id", (req, res) => {
  const { platform, name, description, plans } = req.body;
  const data = readData();

  const appItem = data[platform].find(a => a.id == req.params.id);
  if (!appItem) return res.status(404).end();

  appItem.name = name;
  appItem.description = description;
  appItem.plans = plans;

  saveData(data);
  res.json({ success: true });
});

/* Delete app */
app.delete("/api/apps/:platform/:id", (req, res) => {
  const data = readData();
  data[req.params.platform] =
    data[req.params.platform].filter(a => a.id != req.params.id);

  saveData(data);
  res.json({ success: true });
});

app.listen(PORT, () => console.log("Server running on", PORT));
