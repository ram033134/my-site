// server.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const basicAuth = require("express-basic-auth");

const app = express();

// ---------- UPLOADS FOLDER ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ---------- BODY PARSER ----------
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

// ---------- CORS ----------
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // allow frontend access
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// ---------- PUBLIC UPLOAD ROUTE ----------
app.post("/upload", (req, res) => {
    const { photo, location } = req.body;
    if (!photo) return res.status(400).json({ error: "Missing photo" });

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
    const filename = `photo_${Date.now()}.png`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFile(filepath, base64Data, "base64", (err) => {
        if (err) return res.status(500).json({ error: "Failed to save image" });

        const timestamp = new Date().toISOString();
        console.log("\n--- New Upload ---");
        console.log("Photo saved:", filename);
        console.log("Location:", location || "Not provided");
        console.log("Time:", timestamp);

        res.json({
            success: true,
            message: "Photo uploaded successfully",
            file: filename,
            timestamp,
            location: location || null
        });
    });
});

// ---------- ADMIN AUTH ----------
const adminAuth = basicAuth({
    users: { "admin": "mypassword" }, // change password
    challenge: true
});

// ---------- ADMIN HOME ----------
app.get("/admin", adminAuth, (req, res) => {
    res.send("Welcome to the admin area! Only authorized users can see this.");
});

// ---------- ADMIN: LIST UPLOADS ----------
app.get("/admin/uploads", adminAuth, (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: "Unable to read uploads folder" });
        res.json({
            count: files.length,
            files: files
        });
    });
});

// ---------- ADMIN: DOWNLOAD SPECIFIC IMAGE ----------
app.get("/admin/uploads/:filename", adminAuth, (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);

    if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found" });

    res.sendFile(filepath);
});

// ---------- TEST ROUTE ----------
app.get("/", (req, res) => {
    res.json({ message: "Backend is running!", timestamp: new Date().toISOString() });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
