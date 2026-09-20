/**
 * Templated daily reading — the offline fallback, and the text shown while the
 * server's Claude-written version is loading or unavailable. Produces exactly the
 * same shape as the server (`DailyReadingText`), so the UI doesn't care which it got.
 */
import { AspectType, BodyName } from './natal';
import { DailyFacts, LifeArea, NatalPoint, Quality, Transit } from './transits';

export interface DailyReadingText {
  /** ≤ 8 words. */
  headline: string;
  /** 2–3 sentences. */
  reading: string;
  do: string;
  dont: string;
}

// ─── Phrase library ──────────────────────────────────────────────────────────

const TRANSIT_THEME: Record<BodyName, string> = {
  Sun: 'The Sun lights up',
  Moon: 'The Moon stirs',
  Mercury: 'Mercury sharpens',
  Venus: 'Venus softens',
  Mars: 'Mars pushes at',
  Jupiter: 'Jupiter widens',
  Saturn: 'Saturn tests',
  Uranus: 'Uranus unsettles',
  Neptune: 'Neptune blurs',
  Pluto: 'Pluto deepens',
  'North Node': 'The Node turns',
};

const ASPECT_LINK: Record<AspectType, string> = {
  conjunction: 'and lands squarely on',
  trine: 'and flows easily into',
  sextile: 'and quietly supports',
  square: 'and rubs against',
  opposition: 'and pulls against',
};

const NATAL_DOMAIN: Record<NatalPoint, string> = {
  Sun: 'how you see yourself',
  Moon: 'what you need to feel safe',
  Mercury: 'the way you think and speak',
  Venus: 'what you love and want',
  Mars: 'your drive and your temper',
  Jupiter: 'your sense of what is possible',
  Saturn: 'the rules you live by',
  Uranus: 'your need for room to breathe',
  Neptune: 'your dreams and your blind spots',
  Pluto: 'what you cannot let go of',
  'North Node': 'the direction you are growing in',
  Ascendant: 'how you meet the world',
  Midheaven: 'your work and your standing',
};

/** A second sentence that tells the reader what to do with the mood. */
const QUALITY_TURN: Record<Quality, string[]> = {
  power: [
    'Things that usually take effort come more easily; use the ease rather than admiring it.',
    'Doors open a little wider than usual today. Walk through one.',
    'The current is with you; the only mistake is staying on the bank.',
  ],
  pressure: [
    'Friction like this is information, not a verdict. Notice what it is pointing at before you react.',
    'Slow the pace and the pressure has less to push against.',
    'What feels like resistance is often a boundary you had not noticed. Name it.',
  ],
  charged: [
    'The volume is up on everything today; choose carefully what you turn towards.',
    'Strong feeling, uncertain direction: let it settle before you decide anything.',
    'You will feel more than you can explain today. That is allowed.',
  ],
};

const HOUSE_THEME: Record<number, string> = {
  1: 'your own skin, your face to the world',
  2: 'money, comfort and what you value',
  3: 'conversations, errands and the neighbourhood',
  4: 'home, family and the past',
  5: 'pleasure, play and being seen',
  6: 'routines, health and the daily grind',
  7: 'partnership and the people opposite you',
  8: 'intimacy, debts and what is shared',
  9: 'travel, study and the bigger picture',
  10: 'career, reputation and ambition',
  11: 'friends, allies and hopes for the future',
  12: 'rest, solitude and what is unspoken',
};

const MOON_SIGN_MOOD: Record<string, string> = {
  Aries: 'quick to feel and quick to move',
  Taurus: 'slow, sensual and hard to hurry',
  Gemini: 'curious, chatty and easily distracted',
  Cancer: 'tender, protective and close to home',
  Leo: 'warm, proud and wanting to be seen',
  Virgo: 'careful, useful and a little critical',
  Libra: 'gracious, fair-minded and keen to please',
  Scorpio: 'intense, private and all or nothing',
  Sagittarius: 'restless, honest and hungry for more',
  Capricorn: 'steady, dutiful and slow to show feeling',
  Aquarius: 'cool, independent and thinking ahead',
  Pisces: 'soft, dreamy and porous to everyone else',
};

const DO: Record<LifeArea, Record<Quality, string>> = {
  self:   { power: 'Back yourself on the thing you have been hesitating over.', pressure: 'Give yourself ten quiet minutes before the day gets loud.', charged: 'Write down what you are feeling before you act on it.' },
  love:   { power: 'Say the warm thing out loud.', pressure: 'Ask a question instead of making an assumption.', charged: 'Let a conversation run longer than you planned.' },
  mind:   { power: 'Start the piece of writing or the plan you have been circling.', pressure: 'Re-read before you send.', charged: 'Keep a note of the ideas; sort them tomorrow.' },
  work:   { power: 'Ask for the thing you want at work.', pressure: 'Finish one task properly rather than three badly.', charged: 'Clear the small jobs so the big one has room.' },
  body:   { power: 'Move your body somewhere you can breathe.', pressure: 'Eat, sleep, and go easy on the caffeine.', charged: 'Burn off the extra energy on purpose.' },
  social: { power: 'Accept the invitation.', pressure: 'Choose the company that leaves you fuller, not emptier.', charged: 'Reach out to the friend you have been meaning to.' },
};

const DONT: Record<LifeArea, Record<Quality, string>> = {
  self:   { power: 'Waste the confidence on people who will not notice.', pressure: 'Take the first critical voice you hear as the truth.', charged: 'Make a permanent decision on a temporary feeling.' },
  love:   { power: 'Play it cooler than you feel.', pressure: 'Have the big talk when either of you is tired.', charged: 'Read a whole story into a short message.' },
  mind:   { power: 'Argue for sport.', pressure: 'Sign anything you have not read twice.', charged: 'Trust a plan made after midnight.' },
  work:   { power: 'Assume the momentum will last all week.', pressure: 'Reply to the difficult email in the first five minutes.', charged: 'Take on more than you can name.' },
  body:   { power: 'Skip the rest just because you feel invincible.', pressure: 'Push through pain to prove a point.', charged: 'Mistake restlessness for hunger.' },
  social: { power: 'Say yes to everything at once.', pressure: 'Pick a fight in the group chat.', charged: 'Vanish without a word.' },
};

// ─── Composer ────────────────────────────────────────────────────────────────

/** Deterministic pick from a list based on the date, so the fallback varies day to day but not on every render. */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

function sentenceFor(t: Transit): string {
  return `${TRANSIT_THEME[t.transiting]} ${ASPECT_LINK[t.type]} ${NATAL_DOMAIN[t.natal]}.`;
}

function headlineFor(facts: DailyFacts): string {
  const h = facts.headline;
  if (h && h.transiting !== 'Moon') {
    const verb: Record<AspectType, string> = { conjunction: 'meets', trine: 'favours', sextile: 'nudges', square: 'squares', opposition: 'opposes' };
    return `${h.transiting} ${verb[h.type]} your ${h.natal}`;
  }
  if (facts.moon.house) return `Moon in your ${ordinal(facts.moon.house)} house`;
  return `Moon in ${facts.moon.sign}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function composeReading(facts: DailyFacts): DailyReadingText {
  const seed = facts.date;
  const sentences: string[] = [];

  // 1. The Moon — the part that changes every day.
  if (facts.moon.house) {
    sentences.push(`The Moon moves through ${facts.moon.sign} and your ${ordinal(facts.moon.house)} house today, so the day leans towards ${HOUSE_THEME[facts.moon.house]}.`);
  } else {
    sentences.push(`The Moon is in ${facts.moon.sign} today, and the mood is ${MOON_SIGN_MOOD[facts.moon.sign]}.`);
  }

  // 2. The strongest non-Moon transit, if there is one worth naming.
  const lead = facts.transits.find(t => t.transiting !== 'Moon' && t.weight >= 0.9);
  const quality: Quality = lead?.quality ?? facts.headline?.quality ?? 'charged';
  if (lead) {
    sentences.push(`${sentenceFor(lead)} ${pick(QUALITY_TURN[lead.quality], seed + lead.label)}`);
  } else if (facts.headline) {
    sentences.push(`${sentenceFor(facts.headline)} ${pick(QUALITY_TURN[facts.headline.quality], seed + facts.headline.label)}`);
  } else {
    sentences.push('No planet is leaning on your chart today. A quiet sky is a gift; spend it on something of your own choosing.');
  }

  // 3. A closing note for retrogrades that touch daily life.
  if (facts.retrograde.includes('Mercury')) {
    sentences.push('Mercury is retrograde, so let messages sit a moment before they go.');
  } else if (facts.retrograde.includes('Venus')) {
    sentences.push('Venus is retrograde: old feelings may visit. You do not have to open the door.');
  }

  const area: LifeArea = lead?.areas[0] ?? facts.headline?.areas[0] ?? 'self';
  return {
    headline: headlineFor(facts),
    reading: sentences.join(' '),
    do: DO[area][quality],
    dont: DONT[area][quality],
  };
}
