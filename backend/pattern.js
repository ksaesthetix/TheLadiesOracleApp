/**
 * POST /pattern — "Your Pattern": a one-off personality reading written by Claude from
 * the user's natal chart, cached in Firestore until their birth data changes.
 *
 * Wire it up in server.js next to the daily reading:
 *
 *     require("./pattern")(app, db, admin);
 *
 * Environment (Render → Environment):
 *     ANTHROPIC_API_KEY         required
 *     ANTHROPIC_PATTERN_MODEL   optional — default claude-sonnet-5 (one call per user, worth the better prose;
 *     ANTHROPIC_WORKSPACE_ID    needed if the key isn't scoped to a workspace (Console → Settings → Workspaces)
 *                               set claude-haiku-4-5-20251001 to run it cheaper)
 *
 * Request  (Authorization: Bearer <Firebase ID token>)
 *     { chart: NatalChart }     // the cached chart from the device (users/{uid}.natalChart)
 * Response
 *     { key, pattern: { essence, sections: [{ id, title, body, placements }] }, source: "claude" | "cache" }
 *
 * Cache: users/{uid}/pattern/current — regenerated when `key` (date|time|lat|lon) changes.
 */
const { FieldValue } = require("firebase-admin/firestore");

/** Bump when the prompt changes so cached patterns regenerate. Must match PROMPT_VERSION in hooks/usePattern.ts. */
const PROMPT_VERSION = 2;

const SYSTEM_PROMPT = `You write "Your Pattern" for The Ladies' Oracle, an astrology and divination app with the manner of a Victorian parlour oracle and a modern mind.

Voice: warm, elegant, direct, specific. British English. Second person. Concrete observations about how this person tends to think, love, work and change — never generic horoscope filler, never "the universe", never "energies".

You are given a natal chart as JSON. Write four short sections, each grounded in the placements named. Three or four sentences each, short sentences, no preamble:
1. "Foundation" — who they are at rest: Sun, Moon, Rising (if known). 55–75 words.
2. "Development" — how they think, act and grow: Mercury, Mars, Jupiter, Saturn, and the tightest aspect among them. 55–75 words.
3. "Relationships" — how they love and bond: Venus, Moon, the 7th-house sign if known. 55–75 words.
4. "Your edge" — what makes them unlike the rest of their year group: whichever of Uranus, Neptune, Pluto and the North Node is most telling. 40–55 words.

Also write "essence": one sentence, max 14 words, that a friend would recognise them from. For each section list at most three placements.

Rules: name placements plainly in the text ("your Moon in Scorpio", "Saturn square your Sun"); if the birth time is unknown, do not mention houses or a rising sign; no health, money, legal, pregnancy or death predictions; no emojis, no exclamation marks, no lists inside the bodies; every sentence must say something specific to this chart — cut anything that could be said of anyone; do not mention that you are an AI.

Deliver the result by calling the write_pattern tool — nothing else.`;

/** Forcing a tool call makes the model return structured JSON in content[].input — no parsing of prose. */
const PATTERN_TOOL = {
  name: "write_pattern",
  description: "Deliver the finished Your Pattern reading.",
  input_schema: {
    type: "object",
    properties: {
      essence: { type: "string", description: "One sentence, max 22 words, that a friend would recognise them from." },
      sections: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: ["foundation", "development", "relationships", "edge"] },
            title: { type: "string" },
            body: { type: "string", description: "The section text, plain prose, no lists." },
            placements: { type: "array", items: { type: "string" }, maxItems: 3, description: "Up to three placements this section is grounded in, e.g. 'Moon in Scorpio'." },
          },
          required: ["id", "title", "body", "placements"],
        },
      },
    },
    required: ["essence", "sections"],
  },
};

const ELEMENT = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire", Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air", Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};
const MODALITY = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
};
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

module.exports = function registerPattern(app, db, admin) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  // Keys not scoped to a workspace must name one per request (Claude Console → Settings → Workspaces).
  const WORKSPACE_ID = process.env.ANTHROPIC_WORKSPACE_ID;
  const anthropicHeaders = () => ({
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    ...(WORKSPACE_ID ? { "anthropic-workspace-id": WORKSPACE_ID } : {}),
  });
  const MODEL = process.env.ANTHROPIC_PATTERN_MODEL || "claude-sonnet-5";

  async function requireUser(req, res, next) {
    const match = (req.headers.authorization || "").match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing Authorization: Bearer <Firebase ID token>" });
    try {
      req.uid = (await admin.auth().verifyIdToken(match[1])).uid;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  function chartKey(chart) {
    const i = chart.input;
    return `${i.date}|${i.time ?? "-"}|${Number(i.latitude).toFixed(4)}|${Number(i.longitude).toFixed(4)}|v${chart.version}|p${PROMPT_VERSION}`;
  }

  /** Just what the model needs, in a shape it can't misread. */
  function summarise(chart) {
    const counts = (fn) => {
      const c = {};
      for (const p of chart.placements) {
        if (p.body === "North Node") continue;
        const k = fn(p.sign);
        c[k] = (c[k] || 0) + 1;
      }
      return c;
    };
    const placements = chart.placements.map(p => ({
      body: p.body, sign: p.sign, degree: p.degree,
      house: chart.input.timeKnown ? p.house : null, retrograde: p.retrograde,
    }));
    let seventhHouse = null;
    if (chart.angles && chart.houses) {
      const cusp = chart.houses.cusps[6];
      const sign = SIGNS[Math.floor(cusp / 30) % 12];
      seventhHouse = { sign, planets: placements.filter(p => p.house === 7).map(p => p.body) };
    }
    return {
      timeKnown: !!chart.input.timeKnown,
      bigThree: chart.bigThree,
      rising: chart.angles ? SIGNS[Math.floor(chart.angles.ascendant / 30) % 12] : null,
      midheaven: chart.angles ? SIGNS[Math.floor(chart.angles.midheaven / 30) % 12] : null,
      placements,
      aspects: (chart.aspects || []).slice(0, 10).map(a => `${a.a} ${a.type} ${a.b} (${a.orb}°)`),
      elements: counts(s => ELEMENT[s]),
      modalities: counts(s => MODALITY[s]),
      seventhHouse,
    };
  }

  /** Prefer the forced tool call's input; fall back to JSON inside any text; log the shape if neither is there. */
  function extractJson(data) {
    const content = Array.isArray(data.content) ? data.content : [];
    const tool = content.find(c => c.type === "tool_use" && c.input && typeof c.input === "object");
    if (tool) return tool.input;
    const raw = content.map(c => (c.type === "text" && c.text) || "").join("").trim();
    const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
    }
    console.error("[anthropic] unusable response:", JSON.stringify({ stop_reason: data.stop_reason, types: content.map(c => c.type), preview: raw.slice(0, 300) }));
    throw new Error(`No JSON in model output (stop_reason: ${data.stop_reason || "?"})`);
  }

  async function generate(chart) {
    const t0 = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        tools: [PATTERN_TOOL],
        tool_choice: { type: "tool", name: "write_pattern" },
        messages: [{ role: "user", content: `Natal chart as JSON:\n${JSON.stringify(summarise(chart))}\n\nWrite Your Pattern.` }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic ${response.status}: ${(await response.text().catch(() => "")).slice(0, 300)}`);
    const data = await response.json();
    const usage = data.usage || {};
    console.log(`[pattern] Anthropic OK · ${MODEL} · ${Date.now() - t0} ms · ${usage.input_tokens ?? "?"} in / ${usage.output_tokens ?? "?"} out tokens · stop: ${data.stop_reason}`);
    const obj = extractJson(data);
    const sections = Array.isArray(obj.sections) ? obj.sections
      .filter(s => s && typeof s.body === "string" && s.body.trim())
      .map(s => ({
        id: String(s.id || s.title || "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "") || "section",
        title: String(s.title || "").trim() || "Section",
        body: String(s.body).trim(),
        placements: Array.isArray(s.placements) ? s.placements.map(String).slice(0, 6) : [],
      })) : [];
    if (sections.length < 3 || typeof obj.essence !== "string" || !obj.essence.trim()) throw new Error("Model output incomplete");
    return { essence: obj.essence.trim().replace(/\.$/, ""), sections };
  }

  app.post("/pattern", requireUser, async (req, res) => {
    try {
      const { chart } = req.body || {};
      if (!chart || chart.version !== 1 || !chart.input || !Array.isArray(chart.placements)) {
        return res.status(400).json({ error: "chart (NatalChart v1) required" });
      }
      if (JSON.stringify(chart).length > 40000) return res.status(413).json({ error: "chart too large" });

      const key = chartKey(chart);
      const ref = db.collection("users").doc(req.uid).collection("pattern").doc("current");
      const snap = await ref.get();
      const cached = snap.exists ? snap.data() : null;
      if (cached && cached.key === key && cached.pattern) {
        console.log(`[pattern] cache hit for ${req.uid}`);
        return res.json({ key, pattern: cached.pattern, source: "cache" });
      }
      if (!API_KEY) return res.status(503).json({ error: "Your Pattern is not configured on the server" });

      console.log(`[pattern] cache miss for ${req.uid} — asking Anthropic (${MODEL})`);
      const pattern = await generate(chart);
      await ref.set({ key, pattern, model: MODEL, createdAt: FieldValue.serverTimestamp() });
      console.log(`[pattern] written for ${req.uid} and cached`);
      res.json({ key, pattern, source: "claude" });
    } catch (err) {
      console.error("pattern error:", err);
      res.status(502).json({ error: "Could not write Your Pattern" });
    }
  });

  console.log(`✨ /pattern ready · model ${MODEL} · API key ${API_KEY ? "set (…" + API_KEY.slice(-4) + ")" : "MISSING"}${WORKSPACE_ID ? " · workspace " + WORKSPACE_ID : ""}`);
};
