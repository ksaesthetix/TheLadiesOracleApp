/**
 * Loads the signed-in user's birth data from Firestore, computes their natal chart
 * on the device, and caches the result back on the user document so it is only
 * recomputed when the birth data changes.
 *
 * Firestore shape used:
 *   users/{uid}.dateOfBirth   'Sat Jun 15 1990'  (what dateofbirth.tsx writes today) or 'YYYY-MM-DD'
 *   users/{uid}.timeOfBirth   'HH:mm' | null
 *   users/{uid}.<birth location>  — see extractLocation() for the field names it understands
 *   users/{uid}.natalChart    NatalChart (written by this hook)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { syncSharedChart } from '../lib/account';
import { birthDateFromFirestore, computeNatalChart, NatalChart } from '../lib/astrology/natal';

export interface BirthProfile {
  date: string;
  time: string | null;
  latitude: number;
  longitude: number;
  placeName: string | null;
}

export type ChartState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'missing'; needsDate: boolean; needsPlace: boolean; profile: Partial<BirthProfile> }
  | { status: 'ready'; chart: NatalChart; profile: BirthProfile; fromCache: boolean }
  | { status: 'error'; message: string };

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Finds the birthplace coordinates in the user document. Checks the shapes the
 * location screen is likely to have written; add the real field names here if
 * yours differ (see the console warning this hook prints when nothing matches).
 */
function extractLocation(data: Record<string, unknown>): { latitude: number; longitude: number; placeName: string | null } | null {
  const containers: unknown[] = [data, data.birthLocation, data.birthPlace, data.location, data.placeOfBirth, data.geo, data.geoDetails, data.coordinates];
  for (const c of containers) {
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    const lat = num(o.latitude) ?? num(o.lat);
    const lon = num(o.longitude) ?? num(o.lng) ?? num(o.lon) ?? num(o.long);
    if (lat !== null && lon !== null) {
      const nameSource = [o.placeName, o.name, o.formatted, o.formattedAddress, o.city, o.town, data.birthCity, data.city, data.placeOfBirthName]
        .find(v => typeof v === 'string' && v.trim());
      return { latitude: lat, longitude: lon, placeName: (nameSource as string | undefined) ?? null };
    }
  }
  return null;
}

function cacheKey(p: BirthProfile): string {
  return `${p.date}|${p.time ?? '-'}|${p.latitude.toFixed(4)}|${p.longitude.toFixed(4)}|v1`;
}

function keyOfChart(chart: NatalChart): string {
  const i = chart.input;
  return `${i.date}|${i.time ?? '-'}|${i.latitude.toFixed(4)}|${i.longitude.toFixed(4)}|v${chart.version}`;
}

export function useNatalChart() {
  const [state, setState] = useState<ChartState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const forceRef = useRef(false);

  /** Re-read Firestore; `force` ignores the cached chart and recomputes. */
  const refresh = useCallback((force = false) => {
    forceRef.current = force;
    setState({ status: 'loading' });
    setReloadToken(t => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;

    (async () => {
      const user = auth.currentUser;
      if (!user) { if (!cancelled) setState({ status: 'signed-out' }); return; }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const data = (snap.exists() ? snap.data() : {}) as Record<string, unknown>;

        const dateTime = birthDateFromFirestore(data.birthDate ?? data.dateOfBirth, data.timeOfBirth ?? data.birthTime);
        const location = extractLocation(data);
        if (!location) console.warn('[useNatalChart] No birthplace coordinates found on users/' + user.uid + '. Keys present:', Object.keys(data).join(', '));

        if (!dateTime || !location) {
          if (!cancelled) setState({
            status: 'missing',
            needsDate: !dateTime,
            needsPlace: !location,
            profile: { ...(dateTime ?? {}), ...(location ?? {}) },
          });
          return;
        }

        const profile: BirthProfile = { ...dateTime, ...location };
        const cached = data.natalChart as NatalChart | undefined;
        if (!force && cached && cached.version === 1 && keyOfChart(cached) === cacheKey(profile)) {
          if (!cancelled) setState({ status: 'ready', chart: cached, profile, fromCache: true });
          return;
        }

        const chart = computeNatalChart(profile);
        if (!cancelled) setState({ status: 'ready', chart, profile, fromCache: false });
        // Cache best-effort; the screen already has the chart.
        setDoc(ref, { natalChart: chart }, { merge: true }).catch(err => console.warn('[useNatalChart] cache write failed', err));
        // If this person shares their chart with friends, refresh the public copy too.
        syncSharedChart(user.uid, chart).catch(err => console.warn('[useNatalChart] shared copy not updated', err?.message));
      } catch (err: any) {
        console.error('[useNatalChart]', err);
        if (!cancelled) setState({ status: 'error', message: err?.message ?? 'Something went wrong reading your chart.' });
      }
    })();

    return () => { cancelled = true; };
  }, [reloadToken]);

  return { state, refresh };
}
