/**
 * Today's reading for the signed-in user.
 *
 * Flow: natal chart (useNatalChart) → today's transit facts (on device) → templated
 * text shown immediately → then, in the background, the cached Claude-written text
 * from Firestore or a fresh one from the backend. The UI never waits on the network;
 * `source` tells it which text it is showing and `refining` whether a better one may
 * still arrive.
 *
 * The Render free tier sleeps when idle, so the first request of the day can take
 * 30–60 s to wake it — hence the generous timeout and the fallback-first design.
 */
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNatalChart } from './useNatalChart';
import { computeDailyFacts, DailyFacts, localDateKey } from '../lib/astrology/transits';
import { composeReading, DailyReadingText } from '../lib/astrology/readingText';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://theladiesoracleapp.onrender.com';
const SERVER_TIMEOUT_MS = 60_000;

export type ReadingSource = 'local' | 'claude' | 'cache';

export type DailyReadingState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  /** Birth data incomplete — send the user to the Chart tab to fix it. */
  | { status: 'needs-chart' }
  | { status: 'ready'; date: string; facts: DailyFacts; text: DailyReadingText; source: ReadingSource; refining: boolean }
  | { status: 'error'; message: string };

function isReadingText(v: any): v is DailyReadingText {
  return v && typeof v.headline === 'string' && typeof v.reading === 'string' && typeof v.do === 'string' && typeof v.dont === 'string';
}

export function useDailyReading() {
  const { state: chart } = useNatalChart();
  const [state, setState] = useState<DailyReadingState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    if (chart.status === 'loading') return;
    if (chart.status === 'signed-out') { setState({ status: 'signed-out' }); return; }
    if (chart.status === 'error') { setState({ status: 'error', message: chart.message }); return; }
    if (chart.status !== 'ready') { setState({ status: 'needs-chart' }); return; }

    const now = new Date();
    const date = localDateKey(now);
    let facts: DailyFacts;
    try {
      facts = computeDailyFacts(chart.chart, now);
    } catch (err: any) {
      setState({ status: 'error', message: err?.message ?? 'Could not read today\'s sky.' });
      return;
    }
    const local = composeReading(facts);
    setState({ status: 'ready', date, facts, text: local, source: 'local', refining: true });

    const settle = (text: DailyReadingText, source: ReadingSource) => {
      if (cancelled) return;
      setState(s => (s.status === 'ready' ? { ...s, text, source, refining: false } : s));
    };
    const stopRefining = () => {
      if (cancelled) return;
      setState(s => (s.status === 'ready' ? { ...s, refining: false } : s));
    };

    (async () => {
      const user = auth.currentUser;
      if (!user) { stopRefining(); return; }

      // 1. Cached Claude text already in Firestore? (Rules must allow the owner to read it;
      //    if they don't, this throws and we fall through to the server, which has the cache too.)
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'daily', date));
        const data = snap.exists() ? snap.data() : null;
        if (data?.source === 'claude' && isReadingText(data.text)) { settle(data.text, 'cache'); return; }
      } catch (err) {
        console.warn('[useDailyReading] cache read skipped:', (err as Error).message);
      }

      // 2. Ask the backend to write (or return) today's reading.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/daily-reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date, facts }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isReadingText(data?.text)) settle(data.text, data.source === 'cache' ? 'cache' : 'claude');
        else stopRefining();
      } catch (err) {
        console.warn('[useDailyReading] keeping local text:', (err as Error).message);
        stopRefining();
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  return state;
}
