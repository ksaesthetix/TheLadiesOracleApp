/**
 * Natal chart calculation — pure TypeScript, runs on the device.
 *
 * Positions come from `astronomy-engine` (MIT): geocentric, apparent (light-time +
 * aberration), true ecliptic of date → i.e. the tropical zodiac longitudes astrology
 * apps use. Angles (Ascendant / Midheaven) use the standard spherical formulae with
 * apparent sidereal time and true obliquity, also from astronomy-engine.
 *
 * Houses: Whole Sign (the sign holding the Ascendant is house 1). It needs only the
 * Ascendant, is unambiguous at every latitude, and is what a growing share of modern
 * apps use. Placidus can be added later without changing the chart shape.
 *
 * No network, no native code — works in Expo Go.
 */
import * as Astronomy from 'astronomy-engine';
import tzlookup from 'tz-lookup';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type BodyName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter'
  | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto' | 'North Node';

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface BirthInput {
  /** Calendar date at the birthplace, 'YYYY-MM-DD'. */
  date: string;
  /** Local wall-clock time at the birthplace, 'HH:mm' (24h). null = unknown. */
  time: string | null;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. 'Europe/London'. Resolved from lat/lon when omitted. */
  timeZone?: string;
}

export interface Placement {
  body: BodyName;
  /** Ecliptic longitude 0–360. */
  longitude: number;
  sign: ZodiacSign;
  /** Degree within the sign, 0–29. */
  degree: number;
  minute: number;
  /** Whole Sign house 1–12, or null when the birth time is unknown. */
  house: number | null;
  retrograde: boolean;
}

export interface Aspect {
  a: BodyName;
  b: BodyName;
  type: AspectType;
  /** Distance from exact, in degrees (always ≥ 0). */
  orb: number;
}

export interface NatalChart {
  version: 1;
  computedAt: string;
  input: {
    date: string;
    time: string | null;
    timeKnown: boolean;
    latitude: number;
    longitude: number;
    timeZone: string;
    utcOffsetMinutes: number;
    /** The instant actually used for the calculation. */
    utc: string;
    /** true when the zone could not be resolved and a longitude-based offset was used. */
    approximateZone: boolean;
  };
  placements: Placement[];
  /** null when the birth time is unknown. */
  angles: { ascendant: number; midheaven: number; descendant: number; imumCoeli: number } | null;
  houses: { system: 'whole-sign'; cusps: number[] } | null;
  aspects: Aspect[];
  bigThree: {
    sun: ZodiacSign;
    moon: ZodiacSign;
    /** Whether the Moon changed sign during the birth day (only relevant when time unknown). */
    moonSignUncertain: boolean;
    rising: ZodiacSign | null;
  };
}

// ─── Reference data ──────────────────────────────────────────────────────────

export const SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_META: Record<ZodiacSign, { glyph: string; element: 'Fire' | 'Earth' | 'Air' | 'Water'; modality: 'Cardinal' | 'Fixed' | 'Mutable'; ruler: BodyName }> = {
  Aries:       { glyph: '♈', element: 'Fire',  modality: 'Cardinal', ruler: 'Mars' },
  Taurus:      { glyph: '♉', element: 'Earth', modality: 'Fixed',    ruler: 'Venus' },
  Gemini:      { glyph: '♊', element: 'Air',   modality: 'Mutable',  ruler: 'Mercury' },
  Cancer:      { glyph: '♋', element: 'Water', modality: 'Cardinal', ruler: 'Moon' },
  Leo:         { glyph: '♌', element: 'Fire',  modality: 'Fixed',    ruler: 'Sun' },
  Virgo:       { glyph: '♍', element: 'Earth', modality: 'Mutable',  ruler: 'Mercury' },
  Libra:       { glyph: '♎', element: 'Air',   modality: 'Cardinal', ruler: 'Venus' },
  Scorpio:     { glyph: '♏', element: 'Water', modality: 'Fixed',    ruler: 'Pluto' },
  Sagittarius: { glyph: '♐', element: 'Fire',  modality: 'Mutable',  ruler: 'Jupiter' },
  Capricorn:   { glyph: '♑', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn' },
  Aquarius:    { glyph: '♒', element: 'Air',   modality: 'Fixed',    ruler: 'Uranus' },
  Pisces:      { glyph: '♓', element: 'Water', modality: 'Mutable',  ruler: 'Neptune' },
};

export const BODY_META: Record<BodyName, { glyph: string; blurb: string }> = {
  Sun:          { glyph: '☉', blurb: 'Identity, vitality, what you are becoming' },
  Moon:         { glyph: '☽', blurb: 'Feelings, instincts, what you need to feel safe' },
  Mercury:      { glyph: '☿', blurb: 'Mind, language, how you think and connect' },
  Venus:        { glyph: '♀', blurb: 'Love, taste, what you find beautiful' },
  Mars:         { glyph: '♂', blurb: 'Drive, desire, how you fight and pursue' },
  Jupiter:      { glyph: '♃', blurb: 'Growth, luck, where you expand' },
  Saturn:       { glyph: '♄', blurb: 'Discipline, limits, what you must master' },
  Uranus:       { glyph: '♅', blurb: 'Change, rebellion, where you break the mould' },
  Neptune:      { glyph: '♆', blurb: 'Dreams, intuition, where the edges blur' },
  Pluto:        { glyph: '♇', blurb: 'Power, transformation, what you cannot keep' },
  'North Node': { glyph: '☊', blurb: 'Direction, the path your life bends towards' },
};

const ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0,   orb: 8 },
  { type: 'sextile',     angle: 60,  orb: 5 },
  { type: 'square',      angle: 90,  orb: 7 },
  { type: 'trine',       angle: 120, orb: 8 },
  { type: 'opposition',  angle: 180, orb: 8 },
];

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

// ─── Small helpers ───────────────────────────────────────────────────────────

const DEG = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

export function signOf(longitude: number): ZodiacSign {
  return SIGNS[Math.floor(norm360(longitude) / 30)];
}

export function formatDegree(longitude: number): string {
  const lon = norm360(longitude);
  const deg = Math.floor(lon % 30);
  const min = Math.floor((lon % 1) * 60);
  return `${deg}°${String(min).padStart(2, '0')}′`;
}

function placementFrom(body: BodyName, longitude: number, retrograde: boolean, ascSignIndex: number | null): Placement {
  const lon = norm360(longitude);
  const signIndex = Math.floor(lon / 30);
  return {
    body,
    longitude: lon,
    sign: SIGNS[signIndex],
    degree: Math.floor(lon % 30),
    minute: Math.floor((lon % 1) * 60),
    house: ascSignIndex === null ? null : ((signIndex - ascSignIndex + 12) % 12) + 1,
    retrograde,
  };
}

// ─── Time zone handling ──────────────────────────────────────────────────────

/** Minutes east of UTC for `zone` at the given UTC instant, via Intl (no tz database shipped). */
function zoneOffsetAt(utcMs: number, zone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((wall - utcMs) / 60000);
}

/** Convert a local wall-clock time in `zone` to a UTC instant (handles DST by iterating once). */
function localToUtc(y: number, m: number, d: number, hh: number, mm: number, zone: string): { utcMs: number; offsetMinutes: number } {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = zoneOffsetAt(guess, zone);
  let utcMs = guess - first * 60000;
  const second = zoneOffsetAt(utcMs, zone);
  if (second !== first) utcMs = guess - second * 60000;
  return { utcMs, offsetMinutes: zoneOffsetAt(utcMs, zone) };
}

function resolveInstant(input: BirthInput): { utcMs: number; zone: string; offsetMinutes: number; approximate: boolean; timeKnown: boolean } {
  const [y, m, d] = input.date.split('-').map(Number);
  const timeKnown = !!input.time;
  const [hh, mm] = timeKnown ? input.time!.split(':').map(Number) : [12, 0]; // unknown → local noon

  let zone = input.timeZone ?? '';
  if (!zone) {
    try { zone = tzlookup(input.latitude, input.longitude); } catch { zone = ''; }
  }
  if (zone) {
    try {
      const r = localToUtc(y, m, d, hh, mm, zone);
      return { ...r, zone, approximate: false, timeKnown };
    } catch {
      // Intl without zone support on this runtime — fall through to the rough offset.
    }
  }
  const offsetMinutes = Math.round((input.longitude / 15) * 60);
  return {
    utcMs: Date.UTC(y, m - 1, d, hh, mm) - offsetMinutes * 60000,
    zone: zone || `UTC${offsetMinutes >= 0 ? '+' : '-'}${Math.abs(offsetMinutes / 60).toFixed(1)}`,
    offsetMinutes, approximate: true, timeKnown,
  };
}

// ─── Astronomy ───────────────────────────────────────────────────────────────

/** Apparent geocentric ecliptic longitude (true ecliptic of date), degrees 0–360. */
function eclipticLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  const vec = Astronomy.GeoVector(body, time, true);
  return norm360(Astronomy.Ecliptic(vec).elon);
}

/** Mean lunar node (Meeus). Julian centuries from J2000 in TT ≈ UT for our purposes. */
function meanNorthNode(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T ** 4) / 60616000);
}

/** Ascendant and Midheaven (tropical longitudes) for an instant and place. */
export function computeAngles(time: Astronomy.AstroTime, latitude: number, longitude: number): { ascendant: number; midheaven: number } {
  const gast = Astronomy.SiderealTime(time);            // hours
  const ramc = norm360(gast * 15 + longitude) * DEG;    // right ascension of the MC (local sidereal time)
  const eps = Astronomy.e_tilt(time).tobl * DEG;         // true obliquity
  const phi = latitude * DEG;

  const midheaven = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG);
  const ascendant = norm360(
    Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / DEG,
  );
  return { ascendant, midheaven };
}

function findAspects(placements: Placement[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i], b = placements[j];
      // Skip Node aspects to the outer planets — they're slow-moving and mostly noise.
      if ((a.body === 'North Node' || b.body === 'North Node') && /Uranus|Neptune|Pluto/.test(a.body + b.body)) continue;
      let sep = Math.abs(a.longitude - b.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) { out.push({ a: a.body, b: b.body, type: asp.type, orb: Math.round(orb * 100) / 100 }); break; }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeNatalChart(input: BirthInput): NatalChart {
  const inst = resolveInstant(input);
  const time = Astronomy.MakeTime(new Date(inst.utcMs));

  // Angles + whole-sign houses need a birth time.
  let angles: NatalChart['angles'] = null;
  let houses: NatalChart['houses'] = null;
  let ascSignIndex: number | null = null;
  if (inst.timeKnown) {
    const { ascendant, midheaven } = computeAngles(time, input.latitude, input.longitude);
    angles = { ascendant, midheaven, descendant: norm360(ascendant + 180), imumCoeli: norm360(midheaven + 180) };
    ascSignIndex = Math.floor(ascendant / 30);
    houses = { system: 'whole-sign', cusps: Array.from({ length: 12 }, (_, i) => norm360((ascSignIndex! + i) * 30)) };
  }

  // Planets, with retrograde from the sign of motion over the next hour.
  const later = Astronomy.MakeTime(new Date(inst.utcMs + 3600_000));
  const placements: Placement[] = PLANETS.map(p => {
    const lon = eclipticLongitude(p.body, time);
    const lonLater = eclipticLongitude(p.body, later);
    let delta = lonLater - lon;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return placementFrom(p.name, lon, p.name !== 'Sun' && p.name !== 'Moon' && delta < 0, ascSignIndex);
  });
  placements.push(placementFrom('North Node', meanNorthNode(time), true, ascSignIndex));

  // If the time is unknown, check whether the Moon changed sign during that day.
  let moonSignUncertain = false;
  if (!inst.timeKnown) {
    const dayStart = Astronomy.MakeTime(new Date(inst.utcMs - 12 * 3600_000));
    const dayEnd = Astronomy.MakeTime(new Date(inst.utcMs + 12 * 3600_000));
    moonSignUncertain = signOf(eclipticLongitude(Astronomy.Body.Moon, dayStart)) !== signOf(eclipticLongitude(Astronomy.Body.Moon, dayEnd));
  }

  const sun = placements.find(p => p.body === 'Sun')!;
  const moon = placements.find(p => p.body === 'Moon')!;

  return {
    version: 1,
    computedAt: new Date().toISOString(),
    input: {
      date: input.date,
      time: input.time,
      timeKnown: inst.timeKnown,
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: inst.zone,
      utcOffsetMinutes: inst.offsetMinutes,
      utc: new Date(inst.utcMs).toISOString(),
      approximateZone: inst.approximate,
    },
    placements,
    angles,
    houses,
    aspects: findAspects(placements),
    bigThree: {
      sun: sun.sign,
      moon: moon.sign,
      moonSignUncertain,
      rising: angles ? signOf(angles.ascendant) : null,
    },
  };
}

/**
 * Parse the strings the Date of Birth screen currently stores in Firestore.
 * `dateOfBirth` is `Date.toDateString()` output like 'Sat Jun 15 1990';
 * `timeOfBirth` is 'HH:mm'. Returns null if the date can't be understood.
 */
export function birthDateFromFirestore(dateOfBirth: unknown, timeOfBirth: unknown): { date: string; time: string | null } | null {
  if (typeof dateOfBirth !== 'string' || !dateOfBirth) return null;
  let iso: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    iso = dateOfBirth;
  } else {
    const parsed = new Date(dateOfBirth);
    if (!Number.isNaN(parsed.getTime())) {
      iso = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  if (!iso) return null;
  const time = typeof timeOfBirth === 'string' && /^\d{1,2}:\d{2}$/.test(timeOfBirth) ? timeOfBirth.padStart(5, '0') : null;
  return { date: iso, time };
}
