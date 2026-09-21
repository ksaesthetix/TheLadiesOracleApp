/**
 * The journal: everything the user has kept, stamped with the sky at the time.
 *
 *   users/{uid}/journal/{id}
 *     type:      'oracle' | 'affirmation' | 'mood' | 'intention' | 'reflection'
 *     text:      the answer / quote / note / intention
 *     meta:      per type (question + symbol for oracle; score for mood; lunation for rituals)
 *     sky:       { date, moonSign, moonPhase, moonHouse, headline, headlineQuality }
 *     createdAt: server timestamp
 *
 * Deterministic ids keep one entry per day/lunation where that matters:
 *   mood-YYYY-MM-DD · intention-<newMoonId> · reflection-<fullMoonId>
 * Oracle answers and affirmations get auto ids.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { computeSky } from '../lib/astrology/sky';
import { computeDailyFacts, localDateKey, Quality } from '../lib/astrology/transits';
import { NatalChart } from '../lib/astrology/natal';

export type JournalType = 'oracle' | 'affirmation' | 'mood' | 'intention' | 'reflection';

export interface SkyStamp {
  date: string;
  moonSign: string;
  moonPhase: string;
  moonHouse: number | null;
  headline: string | null;
  headlineQuality: Quality | null;
}

export interface JournalEntry {
  id: string;
  type: JournalType;
  text: string;
  meta: Record<string, unknown>;
  sky: SkyStamp;
  createdAt: Date | null;
}

/** Snapshot of the sky right now, with chart-relative details when a chart is available. */
export function stampSky(chart?: NatalChart | null, now: Date = new Date()): SkyStamp {
  if (chart) {
    const f = computeDailyFacts(chart, now);
    return {
      date: f.date, moonSign: f.moon.sign, moonPhase: f.moon.phase, moonHouse: f.moon.house,
      headline: f.headline?.label ?? null, headlineQuality: f.headline?.quality ?? null,
    };
  }
  const s = computeSky(now);
  return { date: localDateKey(now), moonSign: s.moon.sign, moonPhase: s.moon.phase, moonHouse: null, headline: null, headlineQuality: null };
}

function journalRef(uid: string) {
  return collection(db, 'users', uid, 'journal');
}

/** Add an auto-id entry (oracle answers, affirmations). Safe to call from anywhere. */
export async function addJournalEntry(input: { type: JournalType; text: string; meta?: Record<string, unknown>; chart?: NatalChart | null }) {
  const uid = auth.currentUser?.uid;
  if (!uid || !input.text.trim()) return;
  await addDoc(journalRef(uid), {
    type: input.type,
    text: input.text.trim(),
    meta: input.meta ?? {},
    sky: stampSky(input.chart ?? null),
    createdAt: serverTimestamp(),
  });
}

/** Save the Oracle's answer to the journal. Call once the answer page has its answer. */
export function saveOracleAnswer(args: { question: string | number; iconSymbol?: string; answer: string; chart?: NatalChart | null }) {
  return addJournalEntry({
    type: 'oracle',
    text: args.answer,
    meta: { question: String(args.question), iconSymbol: args.iconSymbol ?? null },
    chart: args.chart,
  });
}

/** Upsert an entry with a deterministic id (mood for a day, intention/reflection for a lunation). */
export async function upsertJournalEntry(id: string, input: { type: JournalType; text: string; meta?: Record<string, unknown>; chart?: NatalChart | null }) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(journalRef(uid), id), {
    type: input.type,
    text: input.text.trim(),
    meta: input.meta ?? {},
    sky: stampSky(input.chart ?? null),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

/** Live list of the most recent entries. */
export function useJournal(max = 200) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) { setEntries([]); setLoading(false); return; }
    const q = query(journalRef(uid), orderBy('createdAt', 'desc'), limit(max));
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          type: x.type as JournalType,
          text: String(x.text ?? ''),
          meta: (x.meta ?? {}) as Record<string, unknown>,
          sky: (x.sky ?? {}) as SkyStamp,
          createdAt: x.createdAt?.toDate?.() ?? null,
        };
      }));
      setError(null);
      setLoading(false);
    }, err => { setError(err.message); setLoading(false); });
  }, [uid, max]);

  const byId = useCallback((id: string) => entries.find(e => e.id === id) ?? null, [entries]);
  const insights = useMemo(() => computeInsights(entries), [entries]);

  return { entries, loading, error, byId, insights };
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface Insight {
  /** e.g. "Moon in Leo", "Your 12th house", "Pressure days" */
  label: string;
  average: number;
  count: number;
  /** Compared with your overall average. */
  delta: number;
}

export interface Insights {
  moodCount: number;
  overallAverage: number | null;
  best: Insight[];
  hardest: Insight[];
  /** Consecutive days with a mood check-in, ending today or yesterday. */
  streak: number;
}

const MIN_GROUP = 3;

export function computeInsights(entries: JournalEntry[]): Insights {
  const moods = entries.filter(e => e.type === 'mood' && typeof e.meta.score === 'number' && e.sky?.moonSign);
  if (moods.length === 0) return { moodCount: 0, overallAverage: null, best: [], hardest: [], streak: 0 };

  const overall = moods.reduce((s, e) => s + (e.meta.score as number), 0) / moods.length;
  const groups = new Map<string, number[]>();
  const push = (label: string, score: number) => groups.set(label, [...(groups.get(label) ?? []), score]);
  const ord = (n: number) => { const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };

  for (const e of moods) {
    const s = e.meta.score as number;
    push(`Moon in ${e.sky.moonSign}`, s);
    if (e.sky.moonHouse) push(`Moon in your ${ord(e.sky.moonHouse)} house`, s);
    if (e.sky.headlineQuality) push(`${e.sky.headlineQuality[0].toUpperCase()}${e.sky.headlineQuality.slice(1)} days`, s);
    if (e.sky.moonPhase) push(`${e.sky.moonPhase} days`, s);
  }

  const rows: Insight[] = Array.from(groups.entries())
    .filter(([, v]) => v.length >= MIN_GROUP)
    .map(([label, v]) => {
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      return { label, average: Math.round(avg * 10) / 10, count: v.length, delta: Math.round((avg - overall) * 10) / 10 };
    });

  const best = rows.filter(r => r.delta >= 0.3).sort((a, b) => b.delta - a.delta).slice(0, 3);
  const hardest = rows.filter(r => r.delta <= -0.3).sort((a, b) => a.delta - b.delta).slice(0, 3);

  // Streak of daily check-ins
  const days = new Set(moods.map(e => e.sky.date));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  return { moodCount: moods.length, overallAverage: Math.round(overall * 10) / 10, best, hardest, streak };
}
