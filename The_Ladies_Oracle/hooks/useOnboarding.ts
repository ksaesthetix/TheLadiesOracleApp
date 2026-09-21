import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Has this device seen the first-launch walkthrough?
 * Stored on the device (not the account), so a fresh install sees it again.
 *
 *   const { seen, markSeen, reset } = useOnboarding();
 *   // seen: null while loading, then true/false
 */
const KEY = '@tlo/onboarding-seen:v1';

export function useOnboarding() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then(v => { if (!cancelled) setSeen(v === '1'); })
      .catch(() => { if (!cancelled) setSeen(true); }); // if storage fails, don't nag
    return () => { cancelled = true; };
  }, []);

  const markSeen = useCallback(async () => {
    setSeen(true);
    try { await AsyncStorage.setItem(KEY, '1'); } catch {}
  }, []);

  const reset = useCallback(async () => {
    setSeen(false);
    try { await AsyncStorage.removeItem(KEY); } catch {}
  }, []);

  return { seen, markSeen, reset };
}

export default useOnboarding;
