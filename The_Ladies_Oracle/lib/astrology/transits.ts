/**
 * Daily transits: today's sky measured against a natal chart, reduced to the
 * structured facts a daily reading is written from. Pure TypeScript; runs on the
 * device. Deterministic for a given (chart, instant), so it can be cached per day.
 */
import { AspectType, BodyName, NatalChart, ZodiacSign } from './natal';
import { computeSky, MoonPhaseName, SkyBody } from './sky';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LifeArea = 'self' | 'love' | 'mind' | 'work' | 'body' | 'social';
export type NatalPoint = BodyName | 'Ascendant' | 'Midheaven';
export type Quality = 'power' | 'pressure' | 'charged';
export type AreaState = 'power' | 'pressure' | 'charged' | 'quiet';

export interface Transit {
  transiting: BodyName;
  natal: NatalPoint;
  type: AspectType;
  /** Degrees from exact. */
  orb: number;
  /** true while the transiting body is still closing in on exactness. */
  applying: boolean;
  /** Relative importance, ~0.2–3. */
  weight: number;
  quality: Quality;
  areas: LifeArea[];
  /** Plain-English label, e.g. "Saturn square Venus". */
  label: string;
}

export interface AreaReading {
  area: LifeArea;
  power: number;
  pressure: number;
  /** 0–1 relative to the busiest area today. */
  intensity: number;
  state: AreaState;
}

export interface DailyFacts {
  version: 1;
  /** Local calendar date the reading is for, YYYY-MM-DD. */
  date: string;
  utc: string;
  moon: {
    sign: ZodiacSign;
    degree: number;
    phase: MoonPhaseName;
    illumination: number;
    /** Natal whole-sign house the Moon is moving through, or null without a birth time. */
    house: number | null;
    /** Natal planets the Moon is with today (same sign). */
    withNatal: BodyName[];
  };
  sun: { sign: ZodiacSign; degree: number };
  retrograde: BodyName[];
  /** All transits within orb, heaviest first. */
  transits: Transit[];
  /** The one to lead with. */
  headline: Transit | null;
  areas: AreaReading[];
  natal: { sun: ZodiacSign; moon: ZodiacSign; rising: ZodiacSign | null; timeKnown: boolean };
}

// ─── Reference data ──────────────────────────────────────────────────────────

export const AREA_META: Record<LifeArea, { title: string; blurb: string }> = {
  self:   { title: 'Self',   blurb: 'identity, mood, confidence' },
  love:   { title: 'Love',   blurb: 'romance, desire, closeness' },
  mind:   { title: 'Mind',   blurb: 'thinking, talking, ideas' },
  work:   { title: 'Work',   blurb: 'ambition, duty, money' },
  body:   { title: 'Body',   blurb: 'energy, health, appetite' },
  social: { title: 'Social', blurb: 'friends, plans, community' },
};

export const ALL_AREAS: LifeArea[] = ['self', 'love', 'mind', 'work', 'body', 'social'];

/** Orb (degrees) allowed for each transiting body — faster bodies get wider orbs. */
const TRANSIT_ORB: Record<BodyName, number> = {
  Moon: 4, Sun: 3, Mercury: 3, Venus: 3, Mars: 3,
  Jupiter: 2.5, Saturn: 2.5, Uranus: 2, Neptune: 2, Pluto: 2, 'North Node': 0,
};

/** How much a transit from this body matters (slow = rare = important). */
const TRANSIT_WEIGHT: Record<BodyName, number> = {
  Moon: 0.6, Sun: 1.0, Mercury: 0.8, Venus: 0.9, Mars: 1.1,
  Jupiter: 1.3, Saturn: 1.6, Uranus: 1.5, Neptune: 1.4, Pluto: 1.7, 'North Node': 0,
};

/** How sensitive the natal point is. */
const NATAL_WEIGHT: Record<NatalPoint, number> = {
  Sun: 1.2, Moon: 1.2, Ascendant: 1.2, Midheaven: 1.0,
  Mercury: 1.0, Venus: 1.0, Mars: 1.0,
  Jupiter: 0.9, Saturn: 0.9, Uranus: 0.7, Neptune: 0.7, Pluto: 0.7, 'North Node': 0.7,
};

const ASPECTS: { type: AspectType; angle: number; factor: number }[] = [
  { type: 'conjunction', angle: 0,   factor: 1.2 },
  { type: 'opposition',  angle: 180, factor: 1.1 },
  { type: 'square',      angle: 90,  factor: 1.0 },
  { type: 'trine',       angle: 120, factor: 0.9 },
  { type: 'sextile',     angle: 60,  factor: 0.7 },
];

/** What a conjunction from each transiting body feels like. */
const CONJUNCTION_QUALITY: Record<BodyName, Quality> = {
  Sun: 'power', Venus: 'power', Jupiter: 'power',
  Mars: 'pressure', Saturn: 'pressure', Pluto: 'pressure', Uranus: 'pressure',
  Moon: 'charged', Mercury: 'charged', Neptune: 'charged', 'North Node': 'charged',
};

/** Life areas a natal point speaks to (first is primary). */
const NATAL_AREAS: Record<NatalPoint, LifeArea[]> = {
  Sun: ['self', 'work'],
  Moon: ['self', 'body'],
  Mercury: ['mind', 'social'],
  Venus: ['love', 'social'],
  Mars: ['body', 'work'],
  Jupiter: ['work', 'social'],
  Saturn: ['work', 'self'],
  Uranus: ['mind'],
  Neptune: ['self', 'love'],
  Pluto: ['self'],
  'North Node': ['self'],
  Ascendant: ['self', 'body'],
  Midheaven: ['work'],
};

/** Extra area coloured in by the transiting body. */
const TRANSIT_AREA: Partial<Record<BodyName, LifeArea>> = {
  Venus: 'love', Mars: 'body', Mercury: 'mind', Moon: 'self', Saturn: 'work', Jupiter: 'social', Sun: 'self',
};

const ASPECT_LABEL: Record<AspectType, string> = {
  conjunction: 'conjunct', sextile: 'sextile', square: 'square', trine: 'trine', opposition: 'opposite',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const sep = (a: number, b: number) => { const d = Math.abs(norm360(a) - norm360(b)) % 360; return d > 180 ? 360 - d : d; };

export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function natalPoints(chart: NatalChart): { point: NatalPoint; longitude: number }[] {
  const pts: { point: NatalPoint; longitude: number }[] = chart.placements.map(p => ({ point: p.body, longitude: p.longitude }));
  if (chart.angles) {
    pts.push({ point: 'Ascendant', longitude: chart.angles.ascendant });
    pts.push({ point: 'Midheaven', longitude: chart.angles.midheaven });
  }
  return pts;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeDailyFacts(chart: NatalChart, date: Date = new Date()): DailyFacts {
  const sky = computeSky(date);
  const skyLater = computeSky(new Date(date.getTime() + 3600_000));
  const byName = (list: SkyBody[], name: BodyName) => list.find(b => b.body === name)!;
  const points = natalPoints(chart);

  // ── Transits ──
  const transits: Transit[] = [];
  for (const t of sky.bodies) {
    const maxOrb = TRANSIT_ORB[t.body];
    if (!maxOrb) continue;
    const tLater = byName(skyLater.bodies, t.body);
    for (const n of points) {
      const distance = sep(t.longitude, n.longitude);
      for (const asp of ASPECTS) {
        const orb = Math.abs(distance - asp.angle);
        if (orb > maxOrb) continue;
        const orbLater = Math.abs(sep(tLater.longitude, n.longitude) - asp.angle);
        const closeness = 0.4 + 0.6 * (1 - orb / maxOrb);
        const weight = TRANSIT_WEIGHT[t.body] * NATAL_WEIGHT[n.point] * asp.factor * closeness;
        const quality: Quality =
          asp.type === 'square' || asp.type === 'opposition' ? 'pressure'
          : asp.type === 'trine' || asp.type === 'sextile' ? 'power'
          : CONJUNCTION_QUALITY[t.body];
        const areas = Array.from(new Set<LifeArea>([...NATAL_AREAS[n.point], ...(TRANSIT_AREA[t.body] ? [TRANSIT_AREA[t.body]!] : [])])).slice(0, 3);
        transits.push({
          transiting: t.body, natal: n.point, type: asp.type,
          orb: Math.round(orb * 100) / 100, applying: orbLater < orb,
          weight: Math.round(weight * 1000) / 1000, quality, areas,
          label: `${t.body} ${ASPECT_LABEL[asp.type]} ${n.point}`,
        });
        break; // one aspect per pair
      }
    }
  }
  transits.sort((a, b) => b.weight - a.weight);

  // ── Life areas ──
  const totals: Record<LifeArea, { power: number; pressure: number }> = {
    self: { power: 0, pressure: 0 }, love: { power: 0, pressure: 0 }, mind: { power: 0, pressure: 0 },
    work: { power: 0, pressure: 0 }, body: { power: 0, pressure: 0 }, social: { power: 0, pressure: 0 },
  };
  for (const tr of transits) {
    tr.areas.forEach((area, i) => {
      const share = tr.weight * (i === 0 ? 1 : 0.5); // primary area gets the full weight
      if (tr.quality === 'power') totals[area].power += share;
      else if (tr.quality === 'pressure') totals[area].pressure += share;
      else { totals[area].power += share / 2; totals[area].pressure += share / 2; }
    });
  }
  const maxTotal = Math.max(0.001, ...ALL_AREAS.map(a => totals[a].power + totals[a].pressure));
  const areas: AreaReading[] = ALL_AREAS.map(area => {
    const { power, pressure } = totals[area];
    const total = power + pressure;
    const intensity = total / maxTotal;
    let state: AreaState = 'quiet';
    if (total >= 0.5) {
      if (power > pressure * 1.4) state = 'power';
      else if (pressure > power * 1.4) state = 'pressure';
      else state = 'charged';
    }
    return { area, power: round2(power), pressure: round2(pressure), intensity: round2(intensity), state };
  });

  // ── Moon in the natal chart ──
  const moon = byName(sky.bodies, 'Moon');
  const sun = byName(sky.bodies, 'Sun');
  const moonSignIndex = Math.floor(moon.longitude / 30);
  const ascSignIndex = chart.angles ? Math.floor(chart.angles.ascendant / 30) : null;
  const moonHouse = ascSignIndex === null ? null : ((moonSignIndex - ascSignIndex + 12) % 12) + 1;
  const withNatal = chart.placements.filter(p => Math.floor(p.longitude / 30) === moonSignIndex).map(p => p.body);

  // ── Headline: heaviest non-Moon transit if there is a meaningful one, else the Moon's ──
  const headline = transits.find(t => t.transiting !== 'Moon' && t.weight >= 0.9) ?? transits[0] ?? null;

  return {
    version: 1,
    date: localDateKey(date),
    utc: date.toISOString(),
    moon: {
      sign: moon.sign, degree: moon.degree, phase: sky.moon.phase,
      illumination: round2(sky.moon.illumination), house: moonHouse, withNatal,
    },
    sun: { sign: sun.sign, degree: sun.degree },
    retrograde: sky.retrograde,
    transits,
    headline,
    areas,
    natal: { sun: chart.bigThree.sun, moon: chart.bigThree.moon, rising: chart.bigThree.rising, timeKnown: chart.input.timeKnown },
  };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
