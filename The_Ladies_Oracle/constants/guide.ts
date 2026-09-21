import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

/**
 * The single source of truth for "how to use the app". Feeds both the first-launch
 * walkthrough (app/welcome.tsx — uses `tagline`) and the How it works page
 * (app/(tabs)/profile/guide.tsx — uses `body`, `steps`, `route`).
 * Edit the words here and both screens follow.
 */
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface GuideSection {
  id: string;
  icon: IoniconName;
  title: string;
  /** One or two sentences for the walkthrough card. */
  tagline: string;
  /** The fuller explanation on the guide page. */
  body: string;
  /** Optional numbered how-to. */
  steps?: string[];
  /** Where the "Open" button goes. */
  route?: Href;
  cta?: string;
}

export const GUIDE: GuideSection[] = [
  {
    id: 'oracle',
    icon: 'sparkles-outline',
    title: 'Ask the Oracle',
    tagline: 'Choose the question on your mind, let your intuition pick a symbol, and the Oracle answers.',
    body:
      'The Oracle answers the way it did in Victorian parlours: you choose from a set of questions, then a symbol, and the pairing decides the answer. Don’t deliberate over the symbol — the first one your eye rests on is the one. Every answer is kept in your Journal, stamped with the sky at the moment you asked.',
    steps: [
      'Tap Oracle in the tab bar',
      'Choose your question — the chips filter by theme',
      'Let your eye settle on a symbol',
      'Read your answer; find it again in You → Journal',
    ],
    route: '/questionselector',
    cta: 'Ask the Oracle',
  },
  {
    id: 'chart',
    icon: 'planet-outline',
    title: 'Your birth chart',
    tagline: 'The sky at the moment you were born: your Sun, Moon and rising sign, every planet, and how they speak to each other.',
    body:
      'Add your date, time and place of birth and the app draws your chart on your phone. You’ll see your Big Three, the wheel, every placement with its house, and the aspects between planets. If you don’t know your birth time you still get everything except the rising sign and houses — add the time later and the chart redraws.',
    steps: [
      'You → Settings → Date & Time of Birth',
      'You → Settings → Place of Birth',
      'Open the Chart tab',
    ],
    route: '/chart',
    cta: 'Open your chart',
  },
  {
    id: 'pattern',
    icon: 'finger-print-outline',
    title: 'Your Pattern',
    tagline: 'A written portrait of who you are — foundation, development, relationships, and your edge.',
    body:
      'From the Chart screen, Your Pattern is a four-part reading written for your chart alone: how you are at rest, how you think and grow, how you love, and what sets you apart from everyone born the same year. It is written once and kept; it only changes if your birth details do.',
    route: '/chart/pattern',
    cta: 'Read your pattern',
  },
  {
    id: 'today',
    icon: 'sunny-outline',
    title: 'Today',
    tagline: 'Each day the moving planets touch your chart differently. Today reads what they are saying to you.',
    body:
      'Today’s reading comes from the transits to your own chart, so it is yours and not your sign’s. You get a headline, a short reading, a Do and a Don’t, and meters showing where the sky is pressing and where it is helping — self, love, mind, work, body, social. Below that, This week shows the Moon and the loudest day ahead, and on the Chart screen Your seasons shows the long Saturn and Jupiter cycles you are inside. The written reading takes a moment to arrive; an on-device version shows meanwhile.',
    route: '/today',
    cta: 'Read today',
  },
  {
    id: 'journal',
    icon: 'book-outline',
    title: 'Journal & mood',
    tagline: 'Tap how today feels. After a few days the Journal shows which skies suit you.',
    body:
      'A one-tap mood check-in lives on Today. Every Oracle answer, saved affirmation and check-in is stamped with the sky at that moment, and after five check-ins the Journal starts to notice patterns: the Moon signs and houses you do well under, and the days you don’t. Around each New and Full Moon a card appears on Home to set an intention and, a fortnight later, to look back on it.',
    route: '/profile/journal',
    cta: 'Open your journal',
  },
  {
    id: 'friends',
    icon: 'people-outline',
    title: 'Friends & Bonds',
    tagline: 'Follow friends and see how your charts fit together.',
    body:
      'Find friends by name in You → Friends, or invite them. When a friend has turned on “Share my chart with friends” in Settings, tapping their name opens your Bond: the aspects between your two charts, a harmony score, and where each of you lands in the other’s houses. Your birth details themselves are never shown to anyone.',
    steps: [
      'You → Friends → search by name, or Invite a friend',
      'Both of you: Settings → Share my chart with friends',
      'Tap a friend to see your Bond',
    ],
    route: '/profile/friends',
    cta: 'Find friends',
  },
  {
    id: 'share',
    icon: 'share-social-outline',
    title: 'Share',
    tagline: 'Your Big Three and today’s reading as story-sized cards.',
    body:
      'On the Chart screen the Big Three card makes a 9:16 image of your Sun, Moon and rising sign; at the bottom of Today, Share today does the same for the day’s reading. Both open the normal share sheet, so they go to Stories, Messages or wherever you like.',
    route: '/chart',
    cta: 'Make a card',
  },
];

/** Which sections the first-launch walkthrough shows, in order (Welcome is added in front). */
export const WALKTHROUGH_IDS = ['oracle', 'chart', 'today', 'journal', 'friends'] as const;

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'I don’t know my birth time.',
    a: 'Leave it blank. Your chart still works — only the rising sign and houses need the time. If you find it later, add it in Settings and everything redraws.',
  },
  {
    q: 'The reading says it was composed on this device.',
    a: 'The written version is on its way from the Oracle’s server, which can take a minute to wake. The reading on screen is calculated from the same transits; the words are simply plainer.',
  },
  {
    q: 'A friend isn’t showing up.',
    a: 'They need an account, and you need to follow them from You → Friends. Bonds also need both of you to have Share my chart switched on.',
  },
  {
    q: 'Is this prediction?',
    a: 'No. The Oracle, your chart and the daily reading are for reflection — a way of asking better questions of yourself, not a forecast.',
  },
];
