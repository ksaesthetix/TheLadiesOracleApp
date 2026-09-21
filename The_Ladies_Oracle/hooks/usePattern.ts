/**
 * "Your Pattern": the one-off personality reading. Cached in Firestore at
 * users/{uid}/pattern/current (written by the backend) and keyed on the birth data,
 * so it is regenerated only when the chart changes. A templated version shows while
 * the server writes the real one, or if the server is unavailable.
 */
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNatalChart } from './useNatalChart';
import { BODY_META, NatalChart, SIGN_META, signOf } from '../lib/astrology/natal';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://theladiesoracleapp.onrender.com';
const TIMEOUT_MS = 90_000; // Sonnet + a sleeping Render instance

export interface PatternSection { id: string; title: string; body: string; placements: string[] }
export interface Pattern { essence: string; sections: PatternSection[] }
export type PatternSource = 'local' | 'claude' | 'cache';

export type PatternState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'needs-chart' }
  | { status: 'ready'; pattern: Pattern; source: PatternSource; refining: boolean }
  | { status: 'error'; message: string };

function chartKey(c: NatalChart) {
  const i = c.input;
  return `${i.date}|${i.time ?? '-'}|${i.latitude.toFixed(4)}|${i.longitude.toFixed(4)}|v${c.version}`;
}

function isPattern(v: any): v is Pattern {
  return v && typeof v.essence === 'string' && Array.isArray(v.sections) && v.sections.length >= 3;
}

const ord = (n: number) => { const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };

/** Placement-by-placement fallback, honest and plain, from the chart alone. */
export function composeLocalPattern(c: NatalChart): Pattern {
  const p = (body: string) => c.placements.find(x => x.body === body)!;
  const line = (body: string) => {
    const x = p(body);
    const where = x.house ? ` in your ${ord(x.house)} house` : '';
    return `${body} in ${x.sign}${where}${x.retrograde && body !== 'North Node' ? ' (retrograde)' : ''}: ${BODY_META[x.body].blurb.toLowerCase()}, in the manner of ${x.sign} — ${SIGN_META[x.sign].element.toLowerCase()}, ${SIGN_META[x.sign].modality.toLowerCase()}.`;
  };
  const rising = c.angles ? signOf(c.angles.ascendant) : null;
  const seventh = c.houses ? signOf(c.houses.cusps[6] + 1) : null;
  return {
    essence: `${c.bigThree.sun} Sun, ${c.bigThree.moon} Moon${rising ? `, ${rising} rising` : ''}.`,
    sections: [
      { id: 'foundation', title: 'Foundation', body: [line('Sun'), line('Moon'), rising ? `Rising sign ${rising}: how you meet the world, and how it first meets you.` : 'Add your birth time to unlock your rising sign and houses.'].join(' '), placements: [`Sun in ${c.bigThree.sun}`, `Moon in ${c.bigThree.moon}`, ...(rising ? [`${rising} rising`] : [])] },
      { id: 'development', title: 'Development', body: [line('Mercury'), line('Mars'), line('Jupiter'), line('Saturn')].join(' '), placements: ['Mercury', 'Mars', 'Jupiter', 'Saturn'].map(b => `${b} in ${p(b).sign}`) },
      { id: 'relationships', title: 'Relationships', body: [line('Venus'), seventh ? `Your 7th house — partnership — is ${seventh}: the kind of other you are drawn to, and the terms you meet them on.` : ''].filter(Boolean).join(' '), placements: [`Venus in ${p('Venus').sign}`, ...(seventh ? [`7th house ${seventh}`] : [])] },
      { id: 'edge', title: 'Your edge', body: [line('Uranus'), line('Neptune'), line('Pluto'), line('North Node')].join(' '), placements: ['Uranus', 'Neptune', 'Pluto', 'North Node'].map(b => `${b} in ${p(b).sign}`) },
    ],
  };
}

export function usePattern() {
  const { state: chart } = useNatalChart();
  const [state, setState] = useState<PatternState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    if (chart.status === 'loading') return;
    if (chart.status === 'signed-out') { setState({ status: 'signed-out' }); return; }
    if (chart.status === 'error') { setState({ status: 'error', message: chart.message }); return; }
    if (chart.status !== 'ready') { setState({ status: 'needs-chart' }); return; }

    const c = chart.chart;
    const key = chartKey(c);
    setState({ status: 'ready', pattern: composeLocalPattern(c), source: 'local', refining: true });

    const settle = (pattern: Pattern, source: PatternSource) => { if (!cancelled) setState(s => s.status === 'ready' ? { ...s, pattern, source, refining: false } : s); };
    const stop = () => { if (!cancelled) setState(s => s.status === 'ready' ? { ...s, refining: false } : s); };

    (async () => {
      const user = auth.currentUser;
      if (!user) { stop(); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'pattern', 'current'));
        const data = snap.exists() ? snap.data() : null;
        if (data?.key === key && isPattern(data.pattern)) { settle(data.pattern, 'cache'); return; }
      } catch (err) { console.warn('[usePattern] cache read skipped:', (err as Error).message); }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/pattern`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ chart: c }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isPattern(data?.pattern)) settle(data.pattern, data.source === 'cache' ? 'cache' : 'claude'); else stop();
      } catch (err) {
        console.warn('[usePattern] keeping local pattern:', (err as Error).message);
        stop();
      } finally { clearTimeout(timer); }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  return state;
}
