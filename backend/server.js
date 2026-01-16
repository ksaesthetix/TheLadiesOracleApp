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

// ✅ Get all questions
app.get("/questions", async (req, res) => {
  try {
    const questionsSnapshot = await db.collection("questions").get();
    const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(questions);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ✅ Get all icons
app.get("/icons", async (req, res) => {
  try {
    const iconsSnapshot = await db.collection("icons").get();
    const icons = iconsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(icons);
  } catch (error) {
    console.error("Failed to fetch icons:", error);
    res.status(500).json({ error: "Failed to fetch icons" });
  }
});

// ✅ Get answer based on question + icon_id
app.get("/oracle-answer", async (req, res) => {
  try {
    const { question, icon_id } = req.query;
    if (!question || !icon_id) {
      return res
        .status(400)
        .json({ error: "question and icon_id are required" });
    }

    // ✅ Find mapping for this question
    const mappingSnapshot = await db.collection('question_answer_icon_mapping').where('question', '==', parseInt(question)).limit(1).get();
    if (mappingSnapshot.empty) {
        return res.status(404).json({ error: `Mapping not found for question ${question}` });
    }
    const mapping = mappingSnapshot.docs[0].data();

    // ✅ Fetch icon document
    const iconDocRef = db.collection('icons').doc(icon_id);
    const iconDoc = await iconDocRef.get();
    if (!iconDoc.exists) {
        return res.status(404).json({ error: `Icon not found for id ${icon_id}` });
    }
    const iconData = iconDoc.data();

    // ✅ Find index of symbol in mapping
    const symbolIndex = mapping.symbols.findIndex(
      (s) => s === iconData.symbol
    );
    if (symbolIndex === -1)
      return res
        .status(404)
        .json({ error: `Symbol ${iconData.symbol} not found in mapping` });

    // ✅ Get correct page from symbol index
    const page = mapping.page[symbolIndex];
    if (!page)
      return res
        .status(404)
        .json({ error: `No page found for symbol index ${symbolIndex}` });

    // ✅ Fetch answer by page and icon_id. Assuming icon_id in 'answers' collection is a string reference to the document ID in 'icons' collection.
    const answerSnapshot = await db.collection('answers').where('page', '==', page).where('icon_id', '==', icon_id).limit(1).get();

    if (answerSnapshot.empty) {
         // Fallback: search for answer by page and symbol, if direct icon_id match fails.
         const answerBySymbolSnapshot = await db.collection('answers').where('page', '==', page).where('symbol', '==', iconData.symbol).limit(1).get();
         if(answerBySymbolSnapshot.empty){
            return res.status(404).json({ error: `No answer found for page ${page} and icon_id ${icon_id} or symbol ${iconData.symbol}`});
         }
         const answerDoc = answerBySymbolSnapshot.docs[0].data();
          res.json({
            question,
            icon_id,
            iconSymbol: iconData.symbol,
            page,
            answer: answerDoc.answer,
          });
         return;
    }
    const answerDoc = answerSnapshot.docs[0].data();

    res.json({
      question,
      icon_id,
      iconSymbol: iconData.symbol,
      page,
      answer: answerDoc.answer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch oracle answer" });
  }
});


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

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 The Ladies Oracle API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});