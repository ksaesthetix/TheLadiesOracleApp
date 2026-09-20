/**
 * Life cycles ("Your seasons"): the slow transits that mark chapters — Saturn return,
 * Jupiter return, nodal return, Uranus opposition and the like. For each, the windows
 * in which the transiting body sits within orb of the natal point, with exact dates.
 * Pure TypeScript on astronomy-engine; a few hundred position samples, well under a
 * second on a phone.
 */
import * as Astronomy from 'astronomy-engine';
import { BodyName, NatalChart } from './natal';

export interface CycleDef {
  id: string;
  body: BodyName;
  /** Aspect angle to the natal position of the same body (0 = return, 90 = square, 180 = opposition). */
  angle: number;
  name: string;
  /** Typical ages, for the blurb. */
  ages: string;
  blurb: string;
}

export interface CycleWindow {
  cycle: CycleDef;
  /** First day within orb. */
  start: string;
  /** Last day within orb. */
  end: string;
  /** Exact hits inside the window (retrograde loops give up to three). */
  exact: string[];
  status: 'active' | 'upcoming' | 'past';
  /** Days until start (upcoming), days until end (active), or days since end (past). */
  days: number;
}

export const CYCLES: CycleDef[] = [
  { id: 'saturn-return', body: 'Saturn', angle: 0, name: 'Saturn return', ages: '29–30, 58–60', blurb: 'The great audit. What was built on sand goes; what was built well gets its foundations checked and passed. The first one is where adulthood stops being theoretical.' },
  { id: 'saturn-opposition', body: 'Saturn', angle: 180, name: 'Saturn opposition', ages: '14–15, 44–45', blurb: 'Halfway round the Saturn cycle: your structures are tested from the outside. Responsibilities press; what you commit to now sets the tone of the next fifteen years.' },
  { id: 'saturn-square', body: 'Saturn', angle: 90, name: 'Saturn square', ages: '7, 21–22, 36–37, 51–52', blurb: 'A pinch point. Something has to be made more solid or let go. Uncomfortable, useful, and it passes.' },
  { id: 'jupiter-return', body: 'Jupiter', angle: 0, name: 'Jupiter return', ages: 'every 12 years', blurb: 'A new twelve-year chapter of growth opens. Say yes to the bigger version of the plan; plant things you’ll be glad of in a decade.' },
  { id: 'nodal-return', body: 'North Node', angle: 0, name: 'Nodal return', ages: '18–19, 37, 55–56, 74', blurb: 'The direction you were born to grow in comes back into focus. Decisions made now tend to be the ones you look back on as turning points.' },
  { id: 'nodal-reversal', body: 'North Node', angle: 180, name: 'Nodal reversal', ages: '9, 27–28, 46–47, 65', blurb: 'The tension between comfort and calling peaks. What you’ve outgrown is suddenly obvious.' },
  { id: 'uranus-opposition', body: 'Uranus', angle: 180, name: 'Uranus opposition', ages: '40–43', blurb: 'The famous midlife reckoning: the parts of you that were never allowed out start knocking. Change comes whether or not you schedule it; better to choose it.' },
  { id: 'uranus-square', body: 'Uranus', angle: 90, name: 'Uranus square', ages: '20–22, 61–63', blurb: 'A restless season. Breaking with something expected of you, and finding out who you are without it.' },
  { id: 'neptune-square', body: 'Neptune', angle: 90, name: 'Neptune square', ages: '40–42', blurb: 'The dreams you had for this age meet the life you actually have. Disillusionment first, then a truer kind of faith.' },
  { id: 'pluto-square', body: 'Pluto', angle: 90, name: 'Pluto square', ages: '36–45 (varies by generation)', blurb: 'Something is dying so something else can live: a role, a relationship, a version of ambition. Don’t cling.' },
];

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const DEG_ORB = 2.5;

const BODY: Partial<Record<BodyName, Astronomy.Body>> = {
  Saturn: Astronomy.Body.Saturn, Jupiter: Astronomy.Body.Jupiter, Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune, Pluto: Astronomy.Body.Pluto,
};

function longitudeOf(body: BodyName, time: Astronomy.AstroTime): number {
  if (body === 'North Node') {
    const T = time.tt / 36525;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T ** 4) / 60616000);
  }
  return norm360(Astronomy.Ecliptic(Astronomy.GeoVector(BODY[body]!, time, true)).elon);
}

/** Signed angular distance from the target (transit longitude − natal − angle), in (−180, 180]. */
function offset(body: BodyName, natalLon: number, angle: number, time: Astronomy.AstroTime): number {
  const d = norm360(longitudeOf(body, time) - natalLon - angle);
  return d > 180 ? d - 360 : d;
}

function bisectZero(body: BodyName, natalLon: number, angle: number, t0: Astronomy.AstroTime, t1: Astronomy.AstroTime): Astronomy.AstroTime {
  let a = t0, b = t1;
  let fa = offset(body, natalLon, angle, a);
  for (let i = 0; i < 40; i++) {
    const m = a.AddDays((b.ut - a.ut) / 2);
    const fm = offset(body, natalLon, angle, m);
    if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else { b = m; }
  }
  return b;
}

const iso = (t: Astronomy.AstroTime) => t.date.toISOString().slice(0, 10);

/**
 * Windows for every cycle between `from - lookBackYears` and `from + lookAheadYears`.
 * A window is the span during which the body stays within DEG_ORB of the target,
 * merged across retrograde loops.
 */
export function computeCycles(chart: NatalChart, from: Date = new Date(), lookBackYears = 2, lookAheadYears = 12): CycleWindow[] {
  const results: CycleWindow[] = [];
  const nowUt = Astronomy.MakeTime(from).ut;
  const t0 = Astronomy.MakeTime(new Date(from.getTime() - lookBackYears * 365.25 * 86400_000));
  const t1 = Astronomy.MakeTime(new Date(from.getTime() + lookAheadYears * 365.25 * 86400_000));
  const stepDays = 10;

  for (const cycle of CYCLES) {
    const natal = chart.placements.find(p => p.body === cycle.body);
    if (!natal) continue;

    // Sample the signed offset; note zero crossings (exact hits) and in-orb spans.
    let prevT = t0, prevF = offset(cycle.body, natal.longitude, cycle.angle, t0);
    const exact: Astronomy.AstroTime[] = [];
    const inOrb: [number, number][] = [];   // [startUt, endUt]
    let spanStart: number | null = Math.abs(prevF) <= DEG_ORB ? t0.ut : null;

    for (let t = t0.AddDays(stepDays); t.ut <= t1.ut + stepDays; t = t.AddDays(stepDays)) {
      const f = offset(cycle.body, natal.longitude, cycle.angle, t);
      // Zero crossing (ignore the ±180 wrap, where |f| jumps)
      if ((prevF < 0) !== (f < 0) && Math.abs(f - prevF) < 90) exact.push(bisectZero(cycle.body, natal.longitude, cycle.angle, prevT, t));
      const within = Math.abs(f) <= DEG_ORB;
      if (within && spanStart === null) spanStart = prevT.ut;
      if (!within && spanStart !== null) { inOrb.push([spanStart, t.ut]); spanStart = null; }
      prevT = t; prevF = f;
    }
    if (spanStart !== null) inOrb.push([spanStart, t1.ut]);

    // Merge spans separated by less than ~14 months (retrograde loops of one pass).
    const merged: [number, number][] = [];
    for (const span of inOrb) {
      const last = merged[merged.length - 1];
      if (last && span[0] - last[1] < 425) last[1] = span[1]; else merged.push([...span] as [number, number]);
    }

    for (const [s, e] of merged) {
      const hits = exact.filter(x => x.ut >= s - 30 && x.ut <= e + 30).map(iso);
      const status: CycleWindow['status'] = nowUt < s ? 'upcoming' : nowUt > e ? 'past' : 'active';
      results.push({
        cycle,
        start: iso(Astronomy.MakeTime(s)), end: iso(Astronomy.MakeTime(e)),
        exact: hits,
        status,
        days: Math.round(status === 'upcoming' ? s - nowUt : status === 'active' ? e - nowUt : nowUt - e),
      });
    }
  }

  // Active first (soonest to end), then upcoming (soonest first), then recent past.
  const order = { active: 0, upcoming: 1, past: 2 };
  return results.sort((a, b) => order[a.status] - order[b.status] || a.days - b.days);
}

/** Age in whole years on a given ISO date, for "at 29". */
export function ageOn(chart: NatalChart, isoDate: string): number {
  const [by, bm, bd] = chart.input.date.split('-').map(Number);
  const [y, m, d] = isoDate.split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}
