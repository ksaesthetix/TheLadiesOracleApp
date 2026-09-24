require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const app = express();

// ✅ Allowed Origins
const allowedOrigins = [
  "https://congenial-tribble-4rqj6wr7vwv27wqj-3000.app.github.dev",
  "https://theladiesoracleapp.onrender.com",
  "http://localhost:3000",
  "exp://",
  "http://localhost:19000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o)))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Firebase Admin Details
// Make sure you have the firebase-admin-key.json file in the backend directory
const serviceAccount = require("./firebase-admin-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore(admin.app(), "default");

// Firestore connection check
(async () => {
    try {
        await db.collection("answers").doc("ping").set({ ok: true });
        console.log("✅ Firestore connection OK to database: default");
    } catch (e) {
        console.error("❌ Firestore connection failed:", e);
    }
})();


// ✅ Health Check
app.get("/", (req, res) => {
  res.json({ message: "The Ladies Oracle API is running", status: "OK" });
});

// 🔮 The Oracle: /questions, /icons, /oracle-status, /oracle-answer (metered by membership — see oracle.js)
require("./oracle")(app, db, admin);

// 🌍 Get Geo Details (Latitude & Longitude from location)
const ASTROLOGY_API_KEY = process.env.ASTROLOGY_API;
app.post("/astrology/geo-details", async (req, res) => {
  try {
    const { location } = req.body;
    console.log("Received request for geo details with location:", location);

    if (!location) {
      return res.status(400).json({ error: "location is required" });
    }

    const response = await fetch("https://json.freeastrologyapi.com/geo-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ASTROLOGY_API_KEY,
      },
      body: JSON.stringify({ location }),
    });

    const data = await response.json();
    console.log("Successfully fetched geo details:", data);
    res.json(data);
  } catch (error) {
    console.error("Geo details error:", error);
    res.status(500).json({ error: "Failed to fetch geo details" });
  }
});

// ✨ Astrology readings written by Claude (see dailyReading.js / pattern.js)
require("./account")(app, db, admin);
require("./dailyReading")(app, db, admin);
require("./pattern")(app, db, admin);

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 The Ladies Oracle API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});
