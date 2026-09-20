/**
 * "Today's sky" — the current state of the heavens, independent of any birth chart.
 * Pure TypeScript on top of `astronomy-engine`; runs on the device in Expo Go.
 *
 *   const sky = computeSky();            // now
 *   const sky = computeSky(new Date(…)); // any instant
 */
import * as Astronomy from 'astronomy-engine';
import { BodyName, ZodiacSign, SIGN_META, signOf } from './natal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoonPhaseName =
  | 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
  | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';

export interface SkyBody {
  body: BodyName;
  longitude: number;
  sign: ZodiacSign;
  degree: number;
  retrograde: boolean;
}

export interface LunarEvent {
  kind: 'New Moon' | 'Full Moon' | 'First Quarter' | 'Last Quarter';
  /** ISO instant. */
  at: string;
  /** Sign the Moon is in at that instant. */
  sign: ZodiacSign;
}

export interface SkySnapshot {
  at: string;
  moon: {
    sign: ZodiacSign;
    degree: number;
    /** 0–360: 0 new, 90 first quarter, 180 full, 270 last quarter. */
    phaseAngle: number;
    phase: MoonPhaseName;
    /** 0–1 fraction of the disc that is lit. */
    illumination: number;
    waxing: boolean;
    /** Approximate age of the Moon in days since the last New Moon. */
    ageDays: number;
    /** When the Moon leaves its current sign. ISO. */
    leavesSignAt: string;
    nextSign: ZodiacSign;
  };
  bodies: SkyBody[];
  retrograde: BodyName[];
  /** Upcoming New/Full Moons (and quarters) in time order, starting from `at`. */
  upcoming: LunarEvent[];
  nextNewMoon: LunarEvent;
  nextFullMoon: LunarEvent;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const SYNODIC_MONTH_DAYS = 29.530588853;

const PLANETS: { name: BodyName; body: Astronomy.Body }[] = [
  { name: 'Sun',     body: Astronomy.Body.Sun },
  { name: 'Moon',    body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus',   body: Astronomy.Body.Venus },
  { name: 'Mars',    body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn',  body: Astronomy.Body.Saturn },
  { name: 'Uranus',  body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto',   body: Astronomy.Body.Pluto },
];

function lon(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  return norm360(Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true)).elon);
}

export function moonPhaseName(phaseAngle: number): MoonPhaseName {
  const a = norm360(phaseAngle);
  // ±~11° windows around the four principal phases, roughly a day either side.
  if (a < 11 || a >= 349) return 'New Moon';
  if (a < 79) return 'Waxing Crescent';
  if (a < 101) return 'First Quarter';
  if (a < 169) return 'Waxing Gibbous';
  if (a < 191) return 'Full Moon';
  if (a < 259) return 'Waning Gibbous';
  if (a < 281) return 'Last Quarter';
  return 'Waning Crescent';
}

export const MOON_PHASE_GLYPH: Record<MoonPhaseName, string> = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓', 'Waxing Gibbous': '🌔',
  'Full Moon': '🌕', 'Waning Gibbous': '🌖', 'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

/** Find when the Moon next crosses a given ecliptic longitude (next sign boundary). */
function searchMoonLongitude(target: number, start: Astronomy.AstroTime): Astronomy.AstroTime {
  // The Moon moves ~13°/day. Step forward in 6-hour increments until the target is crossed,
  // then bisect. `l` is how far past the target the Moon is: while approaching it sits just
  // below 360 and wraps to ~0 once the target is crossed, so a drop in `l` marks the crossing.
  let t0 = start;
  let l0 = norm360(lon(Astronomy.Body.Moon, t0) - target);
  let t1 = t0;
  for (let i = 0; i < 20; i++) {
    t1 = t0.AddDays(0.25);
    const l1 = norm360(lon(Astronomy.Body.Moon, t1) - target);
    if (l1 < l0) break; // wrapped past the target
    t0 = t1; l0 = l1;
  }
  // Bisect between t0 (before) and t1 (after).
  for (let i = 0; i < 40; i++) {
    const mid = t0.AddDays((t1.ut - t0.ut) / 2);
    const lm = norm360(lon(Astronomy.Body.Moon, mid) - target);
    if (lm > 180) t0 = mid; else t1 = mid; // >180 means still before the target (just short of it)
  }
  return t1;
}

function lunarEvent(kind: LunarEvent['kind'], time: Astronomy.AstroTime): LunarEvent {
  return { kind, at: time.date.toISOString(), sign: signOf(lon(Astronomy.Body.Moon, time)) };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeSky(date: Date = new Date()): SkySnapshot {
  const time = Astronomy.MakeTime(date);
  const later = time.AddDays(1 / 24);

  const bodies: SkyBody[] = PLANETS.map(p => {
    const l = lon(p.body, time);
    let delta = lon(p.body, later) - l;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return {
      body: p.name,
      longitude: l,
      sign: signOf(l),
      degree: Math.floor(l % 30),
      retrograde: p.name !== 'Sun' && p.name !== 'Moon' && delta < 0,
    };
  });

  const moon = bodies.find(b => b.body === 'Moon')!;
  const phaseAngle = Astronomy.MoonPhase(time);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, time);
  const nextSignStart = norm360((Math.floor(moon.longitude / 30) + 1) * 30);
  const leaves = searchMoonLongitude(nextSignStart, time);

  // Upcoming principal phases within the next synodic month, in time order.
  const targets: [number, LunarEvent['kind']][] = [[0, 'New Moon'], [90, 'First Quarter'], [180, 'Full Moon'], [270, 'Last Quarter']];
  const upcoming: LunarEvent[] = targets
    .map(([angle, kind]) => {
      const t = Astronomy.SearchMoonPhase(angle, time, 40);
      return t ? lunarEvent(kind, t) : null;
    })
    .filter((e): e is LunarEvent => !!e)
    .sort((a, b) => a.at.localeCompare(b.at));

  const nextNewMoon = upcoming.find(e => e.kind === 'New Moon')!;
  const nextFullMoon = upcoming.find(e => e.kind === 'Full Moon')!;

  return {
    at: date.toISOString(),
    moon: {
      sign: moon.sign,
      degree: moon.degree,
      phaseAngle,
      phase: moonPhaseName(phaseAngle),
      illumination: illum.phase_fraction,
      waxing: phaseAngle < 180,
      ageDays: (phaseAngle / 360) * SYNODIC_MONTH_DAYS,
      leavesSignAt: leaves.date.toISOString(),
      nextSign: signOf(nextSignStart + 1),
    },
    bodies,
    retrograde: bodies.filter(b => b.retrograde).map(b => b.body),
    upcoming,
    nextNewMoon,
    nextFullMoon,
  };
}

/** e.g. "Full Moon in Aries · Tue 6 Oct" */
export function describeLunarEvent(e: LunarEvent, locale = 'en-GB'): string {
  const d = new Date(e.at);
  let when: string;
  try {
    when = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    when = d.toDateString();
  }
  return `${e.kind} in ${e.sign} · ${when}`;
}

/** Hours until an ISO instant, floored; used for "Moon enters Sagittarius in 9h". */
export function hoursUntil(iso: string, from: Date = new Date()): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - from.getTime()) / 3600_000));
}

export { SIGN_META };
