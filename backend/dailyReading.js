/**
 * POST /daily-reading — writes the day's reading for a signed-in user with Claude,
 * caching one reading per user per day in Firestore (users/{uid}/daily/{date}).
 *
 * Wire it up in server.js, after `db` is created and before app.listen():
 *
 *     require("./dailyReading")(app, db, admin);
 *
 * Environment (Render → Environment):
 *     ANTHROPIC_API_KEY   required — from console.anthropic.com
 *     ANTHROPIC_MODEL     optional — defaults to claude-haiku-4-5-20251001
 *
 * Request  (Authorization: Bearer <Firebase ID token>)
 *     { date: "YYYY-MM-DD", facts: DailyFacts }      // facts = output of computeDailyFacts() on the device
 * Response
 *     { date, text: { headline, reading, do, dont }, source: "claude" | "cache" }
 *
 * The app already has a templated fallback, so on any failure this returns 502 and
 * the client keeps showing its own text; nothing is cached in that case.
 */
const { FieldValue } = require("firebase-admin/firestore");

const SYSTEM_PROMPT = `You write the daily reading for The Ladies' Oracle, an astrology and divination app with the manner of a Victorian parlour oracle and a modern mind.

Voice: warm, elegant, direct. British English. Second person. Concrete and everyday; no mystical filler, no "the universe", no "energies".

Rules:
- Use only the facts you are given. Name at most two transits, in plain words (e.g. "Saturn squares your Venus", "the Moon moves through your 4th house"). Lead with whatever the facts mark as the headline; use the Moon's sign and house for the day's mood.
- Never predict health outcomes, money, legal results, pregnancy or death. Never give medical or financial advice.
- No emojis. No exclamation marks. No lists. No hedging about astrology itself.
- Do not mention that you are an AI or that this text was generated.

Return ONLY a JSON object with exactly these keys and nothing else:
{"headline": "max 8 words, no full stop", "reading": "2 to 3 sentences, 45 to 75 words in total", "do": "one concrete action for today, max 12 words", "dont": "one concrete thing to avoid today, max 12 words"}`;

module.exports = function registerDailyReading(app, db, admin) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  if (!API_KEY) {
    console.warn("⚠️  ANTHROPIC_API_KEY is not set — /daily-reading will answer 503 and the app will use its templated reading.");
  }

  // ── Firebase auth: the app sends the signed-in user's ID token ──
  async function requireUser(req, res, next) {
    const match = (req.headers.authorization || "").match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing Authorization: Bearer <Firebase ID token>" });
    try {
      const decoded = await admin.auth().verifyIdToken(match[1]);
      req.uid = decoded.uid;
      next();
    } catch (err) {
      console.warn("daily-reading: bad token", err.message);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  // Only today ± 1 day (the device's local date may differ from the server's).
  function dateIsReasonable(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const diffDays = Math.abs((Date.parse(date + "T12:00:00Z") - Date.now()) / 86400000);
    return diffDays <= 1.5;
  }

  // Keep the prompt small and free of anything the model doesn't need.
  function trimFacts(facts) {
    return {
      date: facts.date,
      natal: facts.natal,
      moon: facts.moon,
      sun: facts.sun,
      retrograde: facts.retrograde,
      headline: facts.headline ? pickTransit(facts.headline) : null,
      transits: (facts.transits || []).slice(0, 6).map(pickTransit),
      areas: (facts.areas || []).map(a => ({ area: a.area, state: a.state, intensity: a.intensity })),
    };
  }
  function pickTransit(t) {
    return { label: t.label, orb: t.orb, applying: t.applying, quality: t.quality, areas: t.areas };
  }

  async function generate(facts) {
    const body = {
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's facts for this reader, as JSON:\n${JSON.stringify(trimFacts(facts))}\n\nWrite today's reading. JSON only.`,
        },
      ],
    };
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Anthropic ${response.status}: ${detail.slice(0, 300)}`);
    }
    const data = await response.json();
    const raw = (data.content || []).map(c => c.text || "").join("").trim();
    return parseReading(raw);
  }

  function parseReading(raw) {
    // Tolerate code fences or stray text around the JSON.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in model output");
    const obj = JSON.parse(raw.slice(start, end + 1));
    const text = {
      headline: String(obj.headline || "").trim().replace(/\.$/, ""),
      reading: String(obj.reading || "").trim(),
      do: String(obj.do || "").trim(),
      dont: String(obj.dont || "").trim(),
    };
    if (!text.headline || !text.reading || !text.do || !text.dont) throw new Error("Model output missing fields");
    return text;
  }

  app.post("/daily-reading", requireUser, async (req, res) => {
    try {
      const { date, facts } = req.body || {};
      if (!dateIsReasonable(date || "")) return res.status(400).json({ error: "date must be YYYY-MM-DD and today ± 1 day" });
      if (!facts || typeof facts !== "object" || facts.version !== 1) return res.status(400).json({ error: "facts (v1) required" });
      if (JSON.stringify(facts).length > 20000) return res.status(413).json({ error: "facts too large" });

      const ref = db.collection("users").doc(req.uid).collection("daily").doc(date);
      const snap = await ref.get();
      const cached = snap.exists ? snap.data() : null;
      if (cached && cached.text && cached.source === "claude") {
        return res.json({ date, text: cached.text, source: "cache" });
      }

      if (!API_KEY) return res.status(503).json({ error: "Daily reading is not configured on the server" });

      const text = await generate(facts);
      await ref.set(
        {
          date,
          text,
          facts: trimFacts(facts),
          source: "claude",
          model: MODEL,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      res.json({ date, text, source: "claude" });
    } catch (err) {
      console.error("daily-reading error:", err);
      res.status(502).json({ error: "Could not write today's reading" });
    }
  });

  console.log(`✨ /daily-reading ready (model: ${MODEL})`);
};
