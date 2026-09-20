/**
 * The week ahead, day by day, against a natal chart — for a calendar strip.
 * Reuses computeDailyFacts (transits) and computeSky (Moon, lunations, stations).
 */
import { BodyName, NatalChart, ZodiacSign } from './natal';
import { computeSky, LunarEvent, MoonPhaseName } from './sky';
import { AreaState, computeDailyFacts, DailyFacts, LifeArea, localDateKey, Transit } from './transits';

export type DayEventKind = 'lunation' | 'moon-sign' | 'station' | 'ingress' | 'exact';

export interface DayEvent {
  kind: DayEventKind;
  /** Short label, e.g. "Full Moon in Aries", "Mercury goes retrograde", "Saturn exact opposite your Ascendant". */
  label: string;
  /** ISO instant when known (lunations, Moon sign changes). */
  at?: string;
  /** For 'exact' events. */
  transit?: Transit;
}

export interface DayOutlook {
  date: string;
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
  moon: { sign: ZodiacSign; phase: MoonPhaseName; house: number | null };
  headline: Transit | null;
  /** The area with the most going on, and its state. */
  busiest: { area: LifeArea; state: AreaState } | null;
  /** Sum of transit weights — how loud the day is. */
  intensity: number;
  dominant: AreaState;
  events: DayEvent[];
  facts: DailyFacts;
}

export interface WeekOutlook {
  start: string;
  days: DayOutlook[];
  /** Max intensity across the week, for scaling bars. */
  maxIntensity: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function atLocalNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function dominantState(facts: DailyFacts): AreaState {
  const active = facts.areas.filter(a => a.state !== 'quiet');
  if (active.length === 0) return 'quiet';
  const power = active.reduce((s, a) => s + a.power, 0);
  const pressure = active.reduce((s, a) => s + a.pressure, 0);
  if (power > pressure * 1.4) return 'power';
  if (pressure > power * 1.4) return 'pressure';
  return 'charged';
}

const STATION_LABEL = (b: BodyName, retro: boolean) => `${b} ${retro ? 'goes retrograde' : 'turns direct'}`;

export function computeWeek(chart: NatalChart, from: Date = new Date(), days = 7): WeekOutlook {
  const todayKey = localDateKey(from);
  const startNoon = atLocalNoon(from);

  // Facts for the day before the range too, so the first day's stations/ingresses/exacts can be judged.
  const series: { date: Date; facts: DailyFacts }[] = [];
  for (let i = -1; i <= days; i++) {
    const d = new Date(startNoon.getTime() + i * 86400_000);
    series.push({ date: d, facts: computeDailyFacts(chart, d) });
  }

  // Lunations across the range (sky at start covers the next ~40 days).
  const sky0 = computeSky(startNoon);
  const rangeEnd = startNoon.getTime() + days * 86400_000;
  const lunations: LunarEvent[] = sky0.upcoming.filter(e => new Date(e.at).getTime() < rangeEnd);

  const out: DayOutlook[] = [];
  for (let i = 1; i <= days; i++) {
    const prev = series[i - 1], cur = series[i], next = series[i + 1];
    const dayStart = new Date(cur.date.getFullYear(), cur.date.getMonth(), cur.date.getDate(), 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400_000);
    const events: DayEvent[] = [];

    // Lunations today
    for (const e of lunations) {
      const t = new Date(e.at).getTime();
      if (t >= dayStart.getTime() && t < dayEnd.getTime()) events.push({ kind: 'lunation', label: `${e.kind} in ${e.sign}`, at: e.at });
    }

    // Moon changes sign today?
    const skyStart = computeSky(dayStart);
    if (new Date(skyStart.moon.leavesSignAt).getTime() < dayEnd.getTime()) {
      events.push({ kind: 'moon-sign', label: `Moon enters ${skyStart.moon.nextSign}`, at: skyStart.moon.leavesSignAt });
    }

    // Stations (retrograde flag flips vs the previous day) and ingresses (planet changes sign)
    const prevSky = computeSky(prev.date), curSky = computeSky(cur.date);
    for (const b of curSky.bodies) {
      if (b.body === 'Moon') continue;
      const pb = prevSky.bodies.find(x => x.body === b.body)!;
      if (b.body !== 'Sun' && pb.retrograde !== b.retrograde) events.push({ kind: 'station', label: STATION_LABEL(b.body, b.retrograde) });
      if (pb.sign !== b.sign) events.push({ kind: 'ingress', label: `${b.body} enters ${b.sign}` });
    }

    // Exact transits: orb is a local minimum today (non-Moon, meaningful weight)
    for (const t of cur.facts.transits) {
      if (t.transiting === 'Moon' || t.weight < 0.8) continue;
      const key = (x: Transit) => `${x.transiting}|${x.natal}|${x.type}`;
      const before = prev.facts.transits.find(x => key(x) === key(t));
      const after = next?.facts.transits.find(x => key(x) === key(t));
      const orbBefore = before?.orb ?? 99, orbAfter = after?.orb ?? 99;
      if (t.orb <= orbBefore && t.orb < orbAfter && t.orb < 0.75) {
        events.push({ kind: 'exact', label: t.label.replace(/^(\S+) /, '$1 exactly '), transit: t });
      }
    }

    const busiestArea = [...cur.facts.areas].sort((a, b) => b.intensity - a.intensity)[0];
    out.push({
      date: cur.facts.date,
      weekday: WEEKDAYS[cur.date.getDay()],
      dayOfMonth: cur.date.getDate(),
      isToday: cur.facts.date === todayKey,
      moon: { sign: cur.facts.moon.sign, phase: cur.facts.moon.phase, house: cur.facts.moon.house },
      headline: cur.facts.headline,
      busiest: busiestArea && busiestArea.state !== 'quiet' ? { area: busiestArea.area, state: busiestArea.state } : null,
      intensity: Math.round(cur.facts.transits.reduce((s, t) => s + t.weight, 0) * 100) / 100,
      dominant: dominantState(cur.facts),
      events,
      facts: cur.facts,
    });
  }

  return { start: out[0]?.date ?? todayKey, days: out, maxIntensity: Math.max(0.001, ...out.map(d => d.intensity)) };
}
