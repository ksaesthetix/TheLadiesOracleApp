import { useEffect, useState } from 'react';
import { computeSky, SkySnapshot } from '../lib/astrology/sky';

/**
 * The current sky, recomputed every `refreshMinutes` while the component is mounted.
 * The Moon moves about half a degree an hour, so 30 minutes keeps the card honest
 * without doing any work worth noticing.
 */
export function useSky(refreshMinutes = 30): SkySnapshot {
  const [sky, setSky] = useState<SkySnapshot>(() => computeSky());

  useEffect(() => {
    const id = setInterval(() => setSky(computeSky()), refreshMinutes * 60_000);
    return () => clearInterval(id);
  }, [refreshMinutes]);

  return sky;
}
