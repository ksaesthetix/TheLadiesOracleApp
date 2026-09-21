/**
 * The Oracle's routes, now metered by membership.
 *
 *   require("./oracle")(app, db, admin);      // in server.js — and delete the old /questions, /icons, /oracle-answer routes
 *
 *   GET /questions                      public, unchanged
 *   GET /icons                          public, unchanged
 *   GET /oracle-status                  Bearer <Firebase ID token>
 *       → { tier, plan, today, weekKey, used, limit, remaining, resetsOn, blockout, blockoutDay, unveiled }
 *         unveiled: question numbers available today, or null when the plan opens every question
 *   GET /oracle-answer?question&icon_id Bearer <Firebase ID token>
 *       → the answer as before, plus usage: { used, limit, remaining, weekKey, resetsOn }
 *       401 no/bad token · 423 { error: "blockout" } · 403 { error: "locked" } · 402 { error: "limit", used, limit, resetsOn }
 *
 * A question is charged when the answer is delivered (question + symbol chosen), repeats included,
 * in a Firestore transaction on users/{uid}/usage/{weekKey} so two quick taps can't slip past the limit.
 * Plans live at users/{uid}/billing/plan { tier, expiresAt?, source? } — written by the server (or you, in
 * the console) and read-only to clients.
 */
const { FieldValue } = require("firebase-admin/firestore");
const plans = require("./plans");

module.exports = function registerOracle(app, db, admin) {
  // ── helpers ────────────────────────────────────────────────────────────────

  async function requireAuth(req, res, next) {
    const match = (req.headers.authorization || "").match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Log in to ask the Oracle" });
    try {
      req.uid = (await admin.auth().verifyIdToken(match[1])).uid;
      next();
    } catch (err) {
      console.warn("[oracle] bad token:", err.message);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  let questionsCache = { at: 0, list: [] };
  async function loadQuestions() {
    if (questionsCache.list.length && Date.now() - questionsCache.at < 5 * 60 * 1000) return questionsCache.list;
    const snap = await db.collection("questions").get();
    questionsCache = { at: Date.now(), list: snap.docs.map(d => ({ _id: d.id, ...d.data() })) };
    return questionsCache.list;
  }

  async function loadPlan(uid) {
    const snap = await db.collection("users").doc(uid).collection("billing").doc("plan").get();
    return plans.effectivePlan(snap.exists ? snap.data() : null);
  }

  async function usedThisWeek(uid, weekKey) {
    const snap = await db.collection("users").doc(uid).collection("usage").doc(weekKey).get();
    return snap.exists ? Number(snap.data().count) || 0 : 0;
  }

  function usageSummary(plan, p, used) {
    const limit = plan.weeklyLimit;
    return { used, limit, remaining: limit === null ? null : Math.max(0, limit - used), weekKey: plans.weekKey(p), resetsOn: plans.resetsOn(p) };
  }

  /** Charge one question inside a transaction; throws { code: "limit" } when the allowance is spent. */
  async function charge(uid, plan, p, meta) {
    const weekKey = plans.weekKey(p);
    const ref = db.collection("users").doc(uid).collection("usage").doc(weekKey);
    return db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : {};
      const count = Number(data.count) || 0;
      if (plan.weeklyLimit !== null && count >= plan.weeklyLimit) {
        const err = new Error("Weekly allowance used");
        err.code = "limit"; err.count = count;
        throw err;
      }
      const asks = Array.isArray(data.asks) ? data.asks.slice(-19) : [];
      asks.push({ at: new Date().toISOString(), ...meta });
      tx.set(ref, { weekKey, count: count + 1, tier: plan.tier, asks, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return count + 1;
    });
  }

  // ── public ─────────────────────────────────────────────────────────────────

  app.get("/questions", async (req, res) => {
    try {
      res.json(await loadQuestions());
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/icons", async (req, res) => {
    try {
      const iconsSnapshot = await db.collection("icons").get();
      res.json(iconsSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Failed to fetch icons:", error);
      res.status(500).json({ error: "Failed to fetch icons" });
    }
  });

  // ── metered ────────────────────────────────────────────────────────────────

  app.get("/oracle-status", requireAuth, async (req, res) => {
    try {
      const p = plans.londonParts();
      const [plan, questions] = await Promise.all([loadPlan(req.uid), loadQuestions()]);
      const used = await usedThisWeek(req.uid, plans.weekKey(p));
      res.json({
        tier: plan.tier,
        plan: { name: plan.name, group: plan.group, weeklyLimit: plan.weeklyLimit, allQuestions: plan.allQuestions, bypassBlockout: plan.bypassBlockout, expiresAt: plan.expiresAt },
        today: p.iso,
        ...usageSummary(plan, p, used),
        blockout: plans.isBlockout(p, plan),
        blockoutDay: plans.BLOCKOUT_DAY_NAME,
        unveiled: plan.allQuestions ? null : plans.unveiledNumbers(questions, p),
        unveilPerCategory: plans.UNVEIL_PER_CATEGORY,
      });
    } catch (err) {
      console.error("[oracle-status] error:", err);
      res.status(500).json({ error: "Could not load your Oracle status" });
    }
  });

  app.get("/oracle-answer", requireAuth, async (req, res) => {
    try {
      const { question, icon_id } = req.query;
      if (!question || !icon_id) return res.status(400).json({ error: "question and icon_id are required" });
      const questionNumber = parseInt(question, 10);

      const p = plans.londonParts();
      const plan = await loadPlan(req.uid);

      if (plans.isBlockout(p, plan)) {
        return res.status(423).json({ error: "blockout", day: plans.BLOCKOUT_DAY_NAME, message: `The Oracle rests on ${plans.BLOCKOUT_DAY_NAME}s. Read your birth chart or today's sky instead.` });
      }
      if (!plan.allQuestions) {
        const unveiled = plans.unveiledNumbers(await loadQuestions(), p);
        if (!unveiled.includes(questionNumber)) {
          return res.status(403).json({ error: "locked", message: "This question is not unveiled today. It comes round again soon — or Lifetime Elite opens every question." });
        }
      }

      // ✅ Find mapping for this question
      const mappingSnapshot = await db.collection("question_answer_icon_mapping").where("question", "==", questionNumber).limit(1).get();
      if (mappingSnapshot.empty) return res.status(404).json({ error: `Mapping not found for question ${question}` });
      const mapping = mappingSnapshot.docs[0].data();

      // ✅ Fetch icon document
      const iconDoc = await db.collection("icons").doc(icon_id).get();
      if (!iconDoc.exists) return res.status(404).json({ error: `Icon not found for id ${icon_id}` });
      const iconData = iconDoc.data();

      // ✅ Find index of symbol in mapping → page
      const symbolIndex = mapping.symbols.findIndex(s => s === iconData.symbol);
      if (symbolIndex === -1) return res.status(404).json({ error: `Symbol ${iconData.symbol} not found in mapping` });
      const page = mapping.page[symbolIndex];
      if (!page) return res.status(404).json({ error: `No page found for symbol index ${symbolIndex}` });

      // ✅ Fetch answer by page + icon_id, falling back to page + symbol
      let answerSnapshot = await db.collection("answers").where("page", "==", page).where("icon_id", "==", icon_id).limit(1).get();
      if (answerSnapshot.empty) {
        answerSnapshot = await db.collection("answers").where("page", "==", page).where("symbol", "==", iconData.symbol).limit(1).get();
        if (answerSnapshot.empty) return res.status(404).json({ error: `No answer found for page ${page} and icon_id ${icon_id} or symbol ${iconData.symbol}` });
      }
      const answerDoc = answerSnapshot.docs[0].data();

      // 💷 Charge the question now that there is an answer to give
      let used;
      try {
        used = await charge(req.uid, plan, p, { question: questionNumber, icon_id, symbol: iconData.symbol, page });
      } catch (err) {
        if (err.code === "limit") {
          const u = usageSummary(plan, p, err.count);
          console.log(`[oracle] limit reached for ${req.uid} (${plan.tier}: ${u.used}/${u.limit})`);
          return res.status(402).json({ error: "limit", ...u, tier: plan.tier, message: `You have asked your ${u.limit} questions this week. The Oracle returns on Monday.` });
        }
        throw err;
      }
      const usage = usageSummary(plan, p, used);
      console.log(`[oracle] ${req.uid} · ${plan.tier} · Q${questionNumber} ${iconData.symbol} · ${usage.used}/${usage.limit ?? "∞"} this week`);

      res.json({ question, icon_id, iconSymbol: iconData.symbol, page, answer: answerDoc.answer, usage });
    } catch (error) {
      console.error("[oracle-answer] error:", error);
      res.status(500).json({ error: "Failed to fetch oracle answer" });
    }
  });

  console.log(`🔮 Oracle routes ready · rest day ${plans.BLOCKOUT_DAY_NAME} · ${plans.UNVEIL_PER_CATEGORY} questions per category unveiled daily`);
};
