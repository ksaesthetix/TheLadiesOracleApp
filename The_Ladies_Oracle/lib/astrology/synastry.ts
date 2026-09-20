/**
 * Synastry — two natal charts compared. Cross-aspects between the planets and angles
 * of chart A and chart B, house overlays (where B's planets fall in A's houses), and a
 * templated reading of the bond. Pure TypeScript, symmetric in the maths, written from
 * A's point of view ("you" = A, "they" = B).
 */
import { AspectType, BodyName, NatalChart, SIGN_META, ZodiacSign, signOf } from './natal';
import { NatalPoint } from './transits';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BondArea = 'attraction' | 'communication' | 'support' | 'friction' | 'growth';
export type BondQuality = 'harmony' | 'tension' | 'charged';

export interface CrossAspect {
  /** Point in A's chart. */
  mine: NatalPoint;
  /** Point in B's chart. */
  theirs: NatalPoint;
  type: AspectType;
  orb: number;
  weight: number;
  quality: BondQuality;
  areas: BondArea[];
  label: string;
}

export interface Overlay {
  /** B's planet … */
  theirs: BodyName;
  /** … falls in this whole-sign house of A's chart. */
  house: number;
}

export interface BondAreaScore {
  area: BondArea;
  harmony: number;
  tension: number;
  /** 0–100, how much this area is activated between the two charts. */
  intensity: number;
  /** -1 (all tension) … +1 (all harmony). */
  balance: number;
}

export interface Bond {
  version: 1;
  computedAt: string;
  aspects: CrossAspect[];
  overlays: Overlay[];
  areas: BondAreaScore[];
  /** 0–100 overall harmony weighting; not a compatibility verdict, a texture. */
  harmonyScore: number;
  elements: { mine: string; theirs: string; note: string };
  text: { headline: string; reading: string; strengths: string[]; watchOuts: string[] };
}

// ─── Reference data ──────────────────────────────────────────────────────────

export const BOND_AREA_META: Record<BondArea, { title: string; blurb: string }> = {
  attraction:    { title: 'Attraction',    blurb: 'chemistry, desire, warmth' },
  communication: { title: 'Communication', blurb: 'how you talk and understand each other' },
  support:       { title: 'Support',       blurb: 'steadiness, loyalty, being there' },
  friction:      { title: 'Friction',      blurb: 'where you rub, and what it teaches' },
  growth:        { title: 'Growth',        blurb: 'how you change each other' },
};

const POINT_WEIGHT: Record<NatalPoint, number> = {
  Sun: 1.3, Moon: 1.3, Ascendant: 1.2, Venus: 1.2, Mars: 1.1, Mercury: 0.9, Midheaven: 0.7,
  Jupiter: 0.8, Saturn: 0.9, Uranus: 0.5, Neptune: 0.5, Pluto: 0.6, 'North Node': 0.7,
};

const ORB: Record<AspectType, number> = { conjunction: 7, opposition: 6, trine: 6, square: 5, sextile: 4 };
const ASPECT_FACTOR: Record<AspectType, number> = { conjunction: 1.2, opposition: 1.0, trine: 0.9, square: 1.0, sextile: 0.6 };
const ASPECT_ANGLE: Record<AspectType, number> = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
const ASPECT_WORD: Record<AspectType, string> = { conjunction: 'conjunct', sextile: 'sextile', square: 'square', trine: 'trine', opposition: 'opposite' };

/** Which bond areas a pair of points speaks to. */
function areasFor(a: NatalPoint, b: NatalPoint, type: AspectType): BondArea[] {
  const set = new Set<BondArea>();
  const pair = [a, b];
  const has = (...pts: NatalPoint[]) => pts.some(p => pair.includes(p));
  if (has('Venus', 'Mars') || (has('Moon') && has('Venus', 'Mars', 'Sun'))) set.add('attraction');
  if (has('Mercury') || (has('Moon') && has('Mercury', 'Sun'))) set.add('communication');
  if (has('Saturn') || has('Jupiter') || (has('Sun') && has('Moon'))) set.add(type === 'square' || type === 'opposition' ? 'friction' : 'support');
  if (has('Uranus', 'Neptune', 'Pluto', 'North Node')) set.add('growth');
  if (type === 'square' || type === 'opposition') set.add('friction');
  if (has('Ascendant', 'Midheaven')) set.add('attraction');
  if (set.size === 0) set.add(type === 'trine' || type === 'sextile' ? 'support' : 'growth');
  return Array.from(set).slice(0, 3);
}

/** Conjunctions read by what's meeting; the rest by geometry. */
function qualityFor(a: NatalPoint, b: NatalPoint, type: AspectType): BondQuality {
  if (type === 'trine' || type === 'sextile') return 'harmony';
  if (type === 'square' || type === 'opposition') return 'tension';
  const hard: NatalPoint[] = ['Saturn', 'Mars', 'Pluto', 'Uranus'];
  const soft: NatalPoint[] = ['Venus', 'Jupiter', 'Sun', 'Moon'];
  if (hard.includes(a) || hard.includes(b)) return (soft.includes(a) || soft.includes(b)) ? 'charged' : 'tension';
  return 'harmony';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const sep = (a: number, b: number) => { const d = Math.abs(norm360(a) - norm360(b)) % 360; return d > 180 ? 360 - d : d; };
const round1 = (x: number) => Math.round(x * 10) / 10;

function points(chart: NatalChart): { point: NatalPoint; longitude: number }[] {
  const pts: { point: NatalPoint; longitude: number }[] = chart.placements.map(p => ({ point: p.body, longitude: p.longitude }));
  if (chart.angles) {
    pts.push({ point: 'Ascendant', longitude: chart.angles.ascendant });
    pts.push({ point: 'Midheaven', longitude: chart.angles.midheaven });
  }
  return pts;
}

function ordinal(n: number): string {
  const v = n % 100;
  return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th');
}

// ─── Text ────────────────────────────────────────────────────────────────────

const POINT_THEME: Record<NatalPoint, string> = {
  Sun: 'sense of self', Moon: 'feelings', Mercury: 'way of thinking', Venus: 'way of loving', Mars: 'drive',
  Jupiter: 'optimism', Saturn: 'seriousness', Uranus: 'need for freedom', Neptune: 'dreaminess', Pluto: 'intensity',
  'North Node': 'direction', Ascendant: 'way of meeting the world', Midheaven: 'ambitions',
};

const HOUSE_OVERLAY: Record<number, string> = {
  1: 'you feel them as soon as they walk in', 2: 'they touch what you value and how secure you feel',
  3: 'they get you talking', 4: 'they feel like home, or like family, for better and worse',
  5: 'they bring out your playful, creative side', 6: 'they show up in your routines and the daily grind',
  7: 'they land in your partnership house: this is the mirror', 8: 'they reach the private, intense parts of you',
  9: 'they widen your world', 10: 'they touch your ambitions and how you are seen',
  11: 'they feel like an ally, a friend among friends', 12: 'they reach something in you that is hard to put into words',
};

const ELEMENT_NOTES: Record<string, string> = {
  'Fire-Fire': 'Two fires: fast, warm, and occasionally a bonfire.',
  'Fire-Earth': 'Fire meets Earth: one of you starts things, the other finishes them.',
  'Fire-Air': 'Fire and Air feed each other; ideas catch quickly between you.',
  'Fire-Water': 'Fire and Water: steam. Passionate, and prone to misreadings.',
  'Earth-Earth': 'Two Earth signs: steady, loyal, and in need of the occasional shake-up.',
  'Earth-Air': 'Earth and Air: practicality meets ideas. You keep each other honest.',
  'Earth-Water': 'Earth and Water: nourishing. Roots and rain.',
  'Air-Air': 'Two Air signs: endless conversation, if someone remembers to book the table.',
  'Air-Water': 'Air and Water: thinking meets feeling; translation is the work.',
  'Water-Water': 'Two Water signs: deep, intuitive, and easily swept up in each other’s weather.',
};

function elementNote(mine: ZodiacSign, theirs: ZodiacSign): { mine: string; theirs: string; note: string } {
  const a = SIGN_META[mine].element, b = SIGN_META[theirs].element;
  const key = [a, b].sort((x, y) => ['Fire', 'Earth', 'Air', 'Water'].indexOf(x) - ['Fire', 'Earth', 'Air', 'Water'].indexOf(y)).join('-');
  return { mine: a, theirs: b, note: ELEMENT_NOTES[key] ?? '' };
}

function describeAspect(x: CrossAspect, theirName: string): string {
  const verb: Record<AspectType, string> = {
    conjunction: 'sits right on', trine: 'flows easily with', sextile: 'quietly supports', square: 'pushes against', opposition: 'faces off with',
  };
  return `Your ${x.mine} ${verb[x.type]} ${theirName}’s ${x.theirs}: your ${POINT_THEME[x.mine]} and their ${POINT_THEME[x.theirs]} ${x.quality === 'harmony' ? 'understand each other without trying' : x.quality === 'tension' ? 'want different things, and both will need to give' : 'meet with real intensity'}.`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeBond(mine: NatalChart, theirs: NatalChart, theirName = 'they'): Bond {
  const A = points(mine), B = points(theirs);

  // Cross-aspects
  const aspects: CrossAspect[] = [];
  for (const a of A) {
    for (const b of B) {
      const d = sep(a.longitude, b.longitude);
      for (const type of Object.keys(ASPECT_ANGLE) as AspectType[]) {
        let maxOrb = ORB[type];
        if (a.point === 'Sun' || a.point === 'Moon' || b.point === 'Sun' || b.point === 'Moon') maxOrb += 1;
        const orb = Math.abs(d - ASPECT_ANGLE[type]);
        if (orb > maxOrb) continue;
        const closeness = 0.4 + 0.6 * (1 - orb / maxOrb);
        const weight = POINT_WEIGHT[a.point] * POINT_WEIGHT[b.point] * ASPECT_FACTOR[type] * closeness;
        aspects.push({
          mine: a.point, theirs: b.point, type, orb: round1(orb), weight: Math.round(weight * 1000) / 1000,
          quality: qualityFor(a.point, b.point, type), areas: areasFor(a.point, b.point, type),
          label: `Your ${a.point} ${ASPECT_WORD[type]} their ${b.point}`,
        });
        break;
      }
    }
  }
  aspects.sort((x, y) => y.weight - x.weight);

  // Overlays: their planets in my whole-sign houses
  const overlays: Overlay[] = [];
  if (mine.angles) {
    const ascIdx = Math.floor(mine.angles.ascendant / 30);
    for (const p of theirs.placements) {
      if (p.body === 'North Node') continue;
      overlays.push({ theirs: p.body, house: ((Math.floor(p.longitude / 30) - ascIdx + 12) % 12) + 1 });
    }
  }

  // Area scores
  const totals: Record<BondArea, { h: number; t: number }> = {
    attraction: { h: 0, t: 0 }, communication: { h: 0, t: 0 }, support: { h: 0, t: 0 }, friction: { h: 0, t: 0 }, growth: { h: 0, t: 0 },
  };
  for (const x of aspects) {
    x.areas.forEach((area, i) => {
      const share = x.weight * (i === 0 ? 1 : 0.5);
      if (x.quality === 'harmony') totals[area].h += share;
      else if (x.quality === 'tension') totals[area].t += share;
      else { totals[area].h += share / 2; totals[area].t += share / 2; }
    });
  }
  const maxTotal = Math.max(0.001, ...Object.values(totals).map(v => v.h + v.t));
  const areas: BondAreaScore[] = (Object.keys(totals) as BondArea[]).map(area => {
    const { h, t } = totals[area];
    const total = h + t;
    return {
      area, harmony: round1(h), tension: round1(t),
      intensity: Math.round((total / maxTotal) * 100),
      balance: total === 0 ? 0 : Math.round(((h - t) / total) * 100) / 100,
    };
  });
  const allH = aspects.filter(a => a.quality !== 'tension').reduce((s, a) => s + a.weight * (a.quality === 'charged' ? 0.5 : 1), 0);
  const allT = aspects.filter(a => a.quality !== 'harmony').reduce((s, a) => s + a.weight * (a.quality === 'charged' ? 0.5 : 1), 0);
  const harmonyScore = allH + allT === 0 ? 50 : Math.round((allH / (allH + allT)) * 100);

  // Text
  const lead = aspects[0];
  const bestHarmony = aspects.find(a => a.quality === 'harmony');
  const bestTension = aspects.find(a => a.quality === 'tension');
  const sunOverlay = overlays.find(o => o.theirs === 'Sun');
  const moonOverlay = overlays.find(o => o.theirs === 'Moon');
  const elements = elementNote(mine.bigThree.sun, theirs.bigThree.sun);

  const sentences: string[] = [];
  if (elements.note) sentences.push(elements.note);
  if (lead) sentences.push(describeAspect(lead, theirName));
  if (sunOverlay) sentences.push(`Their Sun falls in your ${ordinal(sunOverlay.house)} house, so ${HOUSE_OVERLAY[sunOverlay.house]}.`);
  else if (moonOverlay) sentences.push(`Their Moon falls in your ${ordinal(moonOverlay.house)} house, so ${HOUSE_OVERLAY[moonOverlay.house]}.`);
  if (bestTension && bestTension !== lead) sentences.push(`The place to be careful: ${describeAspect(bestTension, theirName).replace(/^Your/, 'your')}`);

  const strengths = aspects.filter(a => a.quality === 'harmony').slice(0, 3).map(a => a.label);
  const watchOuts = aspects.filter(a => a.quality === 'tension').slice(0, 3).map(a => a.label);

  const headline = lead
    ? `${lead.mine} ${ASPECT_WORD[lead.type]} ${lead.theirs}`
    : `${elements.mine} meets ${elements.theirs}`;

  return {
    version: 1,
    computedAt: new Date().toISOString(),
    aspects, overlays, areas, harmonyScore, elements,
    text: {
      headline,
      reading: sentences.join(' ') || 'Your charts barely touch: an easy, low-drama connection that runs on choice rather than gravity.',
      strengths, watchOuts,
    },
  };
}

export { signOf, ordinal };
