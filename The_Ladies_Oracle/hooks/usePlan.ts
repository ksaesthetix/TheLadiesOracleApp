/**
 * Membership on the device.
 *
 *   usePlan()          → { tier, plan, loading }  live from users/{uid}/billing/plan (server-written, read-only)
 *   useOracleStatus()  → what the Oracle will allow right now: allowance used/left, rest day, unveiled questions
 *                        (GET /oracle-status with the Firebase ID token; refreshes whenever the screen regains focus)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { PLAN_BY_TIER, PlanInfo, Tier, isTier } from '../lib/plans';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://theladiesoracleapp.onrender.com';
const TIMEOUT_MS = 60_000;

// ── plan ───────────────────────────────────────────────────────────────────────

export function usePlan(): { tier: Tier; plan: PlanInfo; loading: boolean; signedIn: boolean } {
  const [tier, setTier] = useState<Tier>('explorer');
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(!!auth.currentUser);

  useEffect(() => {
    let unsubPlan: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      unsubPlan?.(); unsubPlan = null;
      setSignedIn(!!user);
      if (!user) { setTier('explorer'); setLoading(false); return; }
      unsubPlan = onSnapshot(
        doc(db, 'users', user.uid, 'billing', 'plan'),
        snap => {
          const data = snap.exists() ? snap.data() : null;
          const exp = data?.expiresAt;
          const expiresMs = !exp ? null : typeof exp.toMillis === 'function' ? exp.toMillis() : typeof exp === 'string' ? Date.parse(exp) : null;
          const expired = expiresMs !== null && !Number.isNaN(expiresMs) && expiresMs < Date.now();
          setTier(data && isTier(data.tier) && !expired ? data.tier : 'explorer');
          setLoading(false);
        },
        err => { console.warn('[usePlan]', err.message); setLoading(false); },
      );
    });
    return () => { unsubAuth(); unsubPlan?.(); };
  }, []);

  return { tier, plan: PLAN_BY_TIER[tier], loading, signedIn };
}

// ── oracle status ─────────────────────────────────────────────────────────────

export interface OracleStatus {
  tier: Tier;
  plan: { name: string; group: string; weeklyLimit: number | null; allQuestions: boolean; bypassBlockout: boolean; expiresAt: string | null };
  today: string;
  weekKey: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsOn: string;
  blockout: boolean;
  blockoutDay: string;
  /** Question numbers available today, or null when every question is open. */
  unveiled: number[] | null;
  unveilPerCategory: number;
}

export type OracleStatusState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; data: OracleStatus }
  | { status: 'error'; message: string };

export function useOracleStatus() {
  const [state, setState] = useState<OracleStatusState>({ status: 'loading' });
  const inFlight = useRef(false);

  const refresh = useCallback(async (quiet = false) => {
    const user = auth.currentUser;
    if (!user) { setState({ status: 'signed-out' }); return; }
    if (inFlight.current) return;
    inFlight.current = true;
    if (!quiet) setState(s => (s.status === 'ready' ? s : { status: 'loading' }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/oracle-status`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OracleStatus;
      setState({ status: 'ready', data });
    } catch (err) {
      const message = (err as Error).name === 'AbortError' ? 'The Oracle is slow to wake. Please try again.' : (err as Error).message;
      setState(s => (s.status === 'ready' && quiet ? s : { status: 'error', message }));
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
    }
  }, []);

  // Re-check every time the screen comes back into view (after an answer, after upgrading).
  useFocusEffect(useCallback(() => { refresh(true); }, [refresh]));

  // Follow sign-in / sign-out.
  useEffect(() => onAuthStateChanged(auth, () => { refresh(); }), [refresh]);

  /** After an answer, fold the returned usage in without a round trip. */
  const applyUsage = useCallback((usage: { used: number; limit: number | null; remaining: number | null }) => {
    setState(s => (s.status === 'ready' ? { ...s, data: { ...s.data, ...usage } } : s));
  }, []);

  return { state, refresh, applyUsage };
}
