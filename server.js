const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();

// ---------- CORS FIX (100% WORKING) ----------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*"); // Allow all headers

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Respond to preflight
  }

  next();
});

// ---------- BODY PARSER ----------
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

// ---------- CREATE UPLOADS FOLDER ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ---------- UPLOAD ROUTE ----------
app.post("/upload", (req, res) => {
  const { photo, location } = req.body;

  if (!photo) {
    return res.status(400).json({ error: "Missing photo" });
  }

  // Remove base64 prefix
  const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");

  const filename = `photo_${Date.now()}.png`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFile(filepath, base64Data, "base64", (err) => {
    if (err) {
      console.error("File save error:", err);
      return res.status(500).json({ error: "Failed to save image" });
    }

    console.log("\n--- New Upload ---");
    console.log("Photo saved:", filename);
    console.log("Location:", location || "Not provided");

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      file: filename,
    });
  });
});

// ---------- START SERVER ----------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
