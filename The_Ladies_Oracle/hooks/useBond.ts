/**
 * The bond between the signed-in user and one friend: both natal charts → synastry.
 *
 * Consent: a chart is only compared when its owner has turned on sharing, which copies
 * their chart to the public `profiles/{uid}` document. Both sides must have it on — yours
 * so friends can see you, theirs so you can see them. `users/*` is never read for a friend.
 */
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { getPublicProfile, setChartSharing } from '../lib/account';
import { useNatalChart } from './useNatalChart';
import { computeBond, Bond } from '../lib/astrology/synastry';
import { NatalChart } from '../lib/astrology/natal';

export interface FriendProfile {
  uid: string;
  name: string;
  photoURL: string | null;
  shareChart: boolean;
  chart: NatalChart | null;
}

export type BondState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'my-chart-missing' }
  | { status: 'my-sharing-off'; friend: FriendProfile }
  | { status: 'their-chart-missing'; friend: FriendProfile }
  | { status: 'their-sharing-off'; friend: FriendProfile }
  | { status: 'ready'; friend: FriendProfile; bond: Bond }
  | { status: 'error'; message: string };

export function useShareChart() {
  const [shareChart, setShareChart] = useState<boolean | null>(null);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) { setShareChart(false); return; }
    getDoc(doc(db, 'profiles', uid))
      .then(snap => setShareChart(snap.exists() && snap.data().shareChart === true))
      .catch(() => setShareChart(false));
  }, [uid]);

  const setSharing = useCallback(async (value: boolean) => {
    if (!uid) return;
    setShareChart(value);
    // The chart copy travels with the switch: on → publish the cached chart, off → remove it.
    let chart: NatalChart | null = null;
    if (value) {
      const me = await getDoc(doc(db, 'users', uid)).catch(() => null);
      const cached = me?.exists() ? me.data().natalChart : null;
      chart = cached && cached.version === 1 ? (cached as NatalChart) : null;
    }
    await setChartSharing(uid, value, chart);
  }, [uid]);

  return { shareChart, setSharing };
}

export function useBond(friendUid: string | undefined) {
  const { state: mine } = useNatalChart();
  const { shareChart: mySharing } = useShareChart();
  const [state, setState] = useState<BondState>({ status: 'loading' });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!friendUid || mine.status === 'loading' || mySharing === null) return;
    if (mine.status === 'signed-out') { setState({ status: 'signed-out' }); return; }

    (async () => {
      try {
        const pub = await getPublicProfile(friendUid);
        const friend: FriendProfile = {
          uid: friendUid,
          name: pub?.name ?? 'Your friend',
          photoURL: pub?.photoURL ?? null,
          shareChart: pub?.shareChart ?? false,
          chart: pub?.chart ?? null,
        };
        if (cancelled) return;
        if (mine.status !== 'ready') { setState({ status: 'my-chart-missing' }); return; }
        if (!mySharing) { setState({ status: 'my-sharing-off', friend }); return; }
        if (!friend.chart) { setState({ status: 'their-chart-missing', friend }); return; }
        if (!friend.shareChart) { setState({ status: 'their-sharing-off', friend }); return; }
        setState({ status: 'ready', friend, bond: computeBond(mine.chart, friend.chart, friend.name.split(' ')[0]) });
      } catch (err: any) {
        console.warn('[useBond]', err?.message);
        if (!cancelled) setState({
          status: 'error',
          message: err?.code === 'permission-denied'
            ? 'Reading a friend’s profile needs the `profiles` Firestore rule — see the accounts INSTALL.md.'
            : err?.message ?? 'Could not load this bond.',
        });
      }
    })();

    return () => { cancelled = true; };
  }, [friendUid, mine, mySharing, reload]);

  return { state, refresh: () => setReload(n => n + 1) };
}
