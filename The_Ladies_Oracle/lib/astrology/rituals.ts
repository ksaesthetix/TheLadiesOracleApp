/**
 * Moon rituals: is it New Moon time (set an intention) or Full Moon time (reflect)?
 * A ritual window opens 36 hours before the exact lunation and stays open 60 hours after.
 */
import * as Astronomy from 'astronomy-engine';
import { ZodiacSign, signOf } from './natal';

export type RitualKind = 'new' | 'full';

export interface Lunation {
  kind: RitualKind;
  /** Exact instant, ISO. */
  at: string;
  /** YYYY-MM-DD of the exact instant (UTC) — used as a stable id. */
  id: string;
  sign: ZodiacSign;
}

export interface RitualWindow {
  kind: RitualKind;
  lunation: Lunation;
  /** Hours from now to the exact moment (negative = already happened). */
  hoursToExact: number;
  /** The New Moon that preceded a Full Moon window — where the intention would have been set. */
  previousNewMoon: Lunation | null;
}

const BEFORE_H = 36;
const AFTER_H = 60;

function moonLon(t: Astronomy.AstroTime): number {
  return ((Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Moon, t, true)).elon % 360) + 360) % 360;
}

function lunationAt(kind: RitualKind, t: Astronomy.AstroTime): Lunation {
  const iso = t.date.toISOString();
  return { kind, at: iso, id: iso.slice(0, 10), sign: signOf(moonLon(t)) };
}

/** Nearest New and Full Moons either side of `now`. */
export function nearbyLunations(now: Date = new Date()) {
  const find = (angle: number, dir: 1 | -1) => Astronomy.SearchMoonPhase(angle, now, dir * 40);
  const prevNew = find(0, -1), nextNew = find(0, 1), prevFull = find(180, -1), nextFull = find(180, 1);
  return {
    prevNew: prevNew ? lunationAt('new', prevNew) : null,
    nextNew: nextNew ? lunationAt('new', nextNew) : null,
    prevFull: prevFull ? lunationAt('full', prevFull) : null,
    nextFull: nextFull ? lunationAt('full', nextFull) : null,
  };
}

/** The ritual window we're in right now, or null between lunations. */
export function currentRitual(now: Date = new Date()): RitualWindow | null {
  const { prevNew, nextNew, prevFull, nextFull } = nearbyLunations(now);
  const hours = (l: Lunation) => (new Date(l.at).getTime() - now.getTime()) / 3600_000;

  const candidates: Lunation[] = [prevNew, nextNew, prevFull, nextFull].filter((l): l is Lunation => !!l);
  for (const l of candidates) {
    const h = hours(l);
    if (h <= BEFORE_H && h >= -AFTER_H) {
      // For a Full Moon, the matching intention was set at the New Moon ~2 weeks before.
      const previousNewMoon = l.kind === 'full'
        ? (prevNew && new Date(prevNew.at) < new Date(l.at) ? prevNew : null)
        : null;
      return { kind: l.kind, lunation: l, hoursToExact: Math.round(h), previousNewMoon };
    }
  }
  return null;
}

/** Next ritual after now (for "come back on Saturday"). */
export function nextRitual(now: Date = new Date()): Lunation | null {
  const { nextNew, nextFull } = nearbyLunations(now);
  const list = [nextNew, nextFull].filter((l): l is Lunation => !!l).sort((a, b) => a.at.localeCompare(b.at));
  return list[0] ?? null;
}
