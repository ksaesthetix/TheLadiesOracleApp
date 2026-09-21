/**
 * Membership tiers, the weekly allowance, the Oracle's rest day and the daily unveiling —
 * the single source of truth for the server. lib/plans.ts in the app mirrors the tier table
 * for display only; every decision that costs or blocks is made here.
 *
 * Environment (optional):
 *   ORACLE_BLOCKOUT_WEEKDAY   0–6 (0 = Sunday, default) — set to today's weekday to test the rest day
 *   ORACLE_UNVEIL_PER_DAY     questions unveiled per category per day (default 3)
 */
const TIME_ZONE = "Europe/London";
const BLOCKOUT_WEEKDAY = Number.isInteger(Number(process.env.ORACLE_BLOCKOUT_WEEKDAY)) ? Number(process.env.ORACLE_BLOCKOUT_WEEKDAY) : 0;
const UNVEIL_PER_CATEGORY = Number(process.env.ORACLE_UNVEIL_PER_DAY) || 3;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** weeklyLimit null = unlimited. Prices are informational here; the stores are authoritative. */
const TIERS = {
  explorer:            { name: "Explorer",                 group: "Free",    weeklyLimit: 2,    freeQuestions: 2, paidQuestions: 0, allQuestions: false, bypassBlockout: false },
  "inner-explorer":    { name: "Inner Circle Explorer",    group: "Premium", weeklyLimit: 4,    freeQuestions: 2, paidQuestions: 2, allQuestions: false, bypassBlockout: false },
  "inner-connoisseur": { name: "Inner Circle Connoisseur", group: "Premium", weeklyLimit: 5,    freeQuestions: 2, paidQuestions: 3, allQuestions: false, bypassBlockout: false },
  elite:               { name: "Lifetime Access Elite",    group: "VIP",     weeklyLimit: null, freeQuestions: 2, paidQuestions: null, allQuestions: true, bypassBlockout: true },
};
const DEFAULT_TIER = "explorer";

/** Calendar parts of an instant in London: { y, m, d, weekday (0 = Sunday), iso 'YYYY-MM-DD' }. */
function londonParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(date);
  const get = t => parts.find(p => p.type === t)?.value;
  const y = Number(get("year")), m = Number(get("month")), d = Number(get("day"));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { y, m, d, weekday, iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}

/** Whole days since 1970-01-01 for a London calendar date — drives the unveiling rotation. */
function dayIndex(p) {
  return Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
}

/** ISO week (Monday–Sunday) of a London calendar date, e.g. '2026-W39'. The allowance resets with it. */
function weekKey(p) {
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** The London date ('YYYY-MM-DD') of the next Monday — when the allowance comes back. */
function resetsOn(p) {
  const daysToMonday = ((8 - (p.weekday || 7)) % 7) || 7; // Mon → 7 (next Monday), Tue → 6 … Sun → 1
  const next = new Date(Date.UTC(p.y, p.m - 1, p.d + daysToMonday));
  return next.toISOString().slice(0, 10);
}

/** users/{uid}/billing/plan → { tier, ...TIERS[tier], expiresAt } with expiry applied. */
function effectivePlan(planDoc, now = Date.now()) {
  let tier = planDoc && typeof planDoc.tier === "string" && TIERS[planDoc.tier] ? planDoc.tier : DEFAULT_TIER;
  const exp = planDoc && planDoc.expiresAt;
  const expiresMs = !exp ? null : typeof exp.toMillis === "function" ? exp.toMillis() : typeof exp === "string" ? Date.parse(exp) : typeof exp === "number" ? exp : null;
  if (expiresMs !== null && !Number.isNaN(expiresMs) && expiresMs < now) tier = DEFAULT_TIER;
  return { tier, ...TIERS[tier], expiresAt: expiresMs ? new Date(expiresMs).toISOString() : null };
}

/** Is the Oracle resting for this plan on this London day? */
function isBlockout(p, plan) {
  return p.weekday === BLOCKOUT_WEEKDAY && !(plan && plan.bypassBlockout);
}

/**
 * Which question numbers are unveiled today: N per category, rotating one step of N each day
 * through the category's questions sorted by number. Deterministic, so the app can show the
 * same set the server enforces. Questions without a category form their own group.
 */
function unveiledNumbers(questions, p) {
  const groups = new Map();
  for (const q of questions) {
    if (typeof q.number !== "number") continue;
    const cat = (q.category || "Other").toString();
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(q.number);
  }
  const day = dayIndex(p);
  const out = [];
  for (const numbers of groups.values()) {
    numbers.sort((a, b) => a - b);
    const n = numbers.length;
    const start = ((day * UNVEIL_PER_CATEGORY) % n + n) % n;
    for (let k = 0; k < Math.min(UNVEIL_PER_CATEGORY, n); k++) out.push(numbers[(start + k) % n]);
  }
  return out.sort((a, b) => a - b);
}

module.exports = {
  TIME_ZONE, BLOCKOUT_WEEKDAY, BLOCKOUT_DAY_NAME: WEEKDAY_NAMES[BLOCKOUT_WEEKDAY], UNVEIL_PER_CATEGORY, TIERS, DEFAULT_TIER,
  londonParts, dayIndex, weekKey, resetsOn, effectivePlan, isBlockout, unveiledNumbers,
};
