require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

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

// ✅ MongoDB Connection
const MONGO_URI =
  "mongodb+srv://Admin_theladiesoracle:MQA64yYiSn8PCpTT@theladiesoracle.yfjgelf.mongodb.net/TheLadiesOracle?retryWrites=true&w=majority&appName=TheLadiesOracle";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Models
const Quote = mongoose.model("Quote", { text: String });
const Question = mongoose.model(
  "Question",
  new mongoose.Schema({}, { strict: false }),
  "questions"
);
const Icon = mongoose.model(
  "Icon",
  new mongoose.Schema({}, { strict: false }),
  "icons"
);
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    avatarUri: String,
  }),
  "users"
);

const QuestionAnswerIconMapping = mongoose.model(
  "QuestionAnswerIconMapping",
  new mongoose.Schema({
    question: Number,
    question_id: mongoose.Schema.Types.ObjectId,
    symbols: [String],
    icon_ids: [mongoose.Schema.Types.ObjectId],
    page: [Number],
  }),
  "question_answer_icon_mapping"
);

const Answer = mongoose.model(
  "Answer",
  new mongoose.Schema({
    symbol: String,
    answer: String,
    page: Number,
    icon_id: mongoose.Schema.Types.ObjectId,
  }),
  "answers"
);

// ✅ Health Check
app.get("/", (req, res) => {
  res.json({ message: "The Ladies Oracle API is running", status: "OK" });
});

// ✅ Get all questions
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ✅ Get all icons
app.get("/icons", async (req, res) => {
  try {
    const icons = await Icon.find();
    res.json(icons);
  } catch (error) {
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
    const mapping = await QuestionAnswerIconMapping.findOne({
      question: parseInt(question),
    });
    if (!mapping)
      return res
        .status(404)
        .json({ error: `Mapping not found for question ${question}` });

    // ✅ Fetch icon document
    const iconDoc = await Icon.findById(icon_id);
    if (!iconDoc)
      return res
        .status(404)
        .json({ error: `Icon not found for id ${icon_id}` });

    // ✅ Find index of symbol in mapping
    const symbolIndex = mapping.symbols.findIndex(
      (s) => s === iconDoc.symbol
    );
    if (symbolIndex === -1)
      return res
        .status(404)
        .json({ error: `Symbol ${iconDoc.symbol} not found in mapping` });

    // ✅ Get correct page from symbol index
    const page = mapping.page[symbolIndex];
    if (!page)
      return res
        .status(404)
        .json({ error: `No page found for symbol index ${symbolIndex}` });

    // ✅ Fetch answer by page
    const answerDoc = await Answer.findOne({ page });
    if (!answerDoc)
      return res
        .status(404)
        .json({ error: `No answer found for page ${page}` });

    res.json({
      question,
      icon_id,
      iconSymbol: iconDoc.symbol,
      page,
      answer: answerDoc.answer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch oracle answer" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 The Ladies Oracle API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});