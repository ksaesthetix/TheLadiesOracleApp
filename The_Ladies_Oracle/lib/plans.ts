/**
 * Membership tiers as the app displays them. The server (backend/plans.js) is the authority for
 * what a tier is allowed to do; this file only needs to agree with it on names and numbers.
 */
export type Tier = 'explorer' | 'inner-explorer' | 'inner-connoisseur' | 'elite';

export interface PlanPrice {
  /** Store product identifier — fill these in when the App Store / Play products exist. */
  productId: string;
  label: string;   // "£2.99"
  period: string;  // "per week"
  badge?: string;  // "Best value"
}

export interface PlanInfo {
  tier: Tier;
  name: string;
  group: 'Free' | 'Premium' | 'VIP';
  tagline: string;
  /** Questions per week; null = unlimited. */
  weeklyLimit: number | null;
  access: string;
  perks: string[];
  prices: PlanPrice[];
  allQuestions: boolean;
  bypassBlockout: boolean;
}

export const BLOCKOUT_DAY_NAME = 'Sunday';
export const RESET_DAY_NAME = 'Monday';

export const PLANS: PlanInfo[] = [
  {
    tier: 'explorer',
    name: 'Explorer',
    group: 'Free',
    tagline: 'Two questions a week, on the house.',
    weeklyLimit: 2,
    access: '2 free questions a week',
    perks: ['Two questions a week', 'Your birth chart, Today and the Journal', 'Twelve questions unveiled each day'],
    prices: [{ productId: '', label: 'Complimentary', period: '' }],
    allQuestions: false,
    bypassBlockout: false,
  },
  {
    tier: 'inner-explorer',
    name: 'Inner Circle Explorer',
    group: 'Premium',
    tagline: 'Double your questions.',
    weeklyLimit: 4,
    access: '2 free + 2 paid questions a week',
    perks: ['Four questions a week', 'Everything in Explorer'],
    prices: [
      { productId: 'tlo_inner_explorer_weekly', label: '£2.99', period: 'per week' },
      { productId: 'tlo_inner_explorer_monthly', label: '£9.99', period: 'per month', badge: 'Save 23%' },
    ],
    allQuestions: false,
    bypassBlockout: false,
  },
  {
    tier: 'inner-connoisseur',
    name: 'Inner Circle Connoisseur',
    group: 'Premium',
    tagline: 'A year with the Oracle.',
    weeklyLimit: 5,
    access: '2 free + 3 paid questions a week',
    perks: ['Five questions a week', 'Everything in Explorer'],
    prices: [{ productId: 'tlo_inner_connoisseur_yearly', label: '£79.99', period: 'per year', badge: 'Best value' }],
    allQuestions: false,
    bypassBlockout: false,
  },
  {
    tier: 'elite',
    name: 'Lifetime Access Elite',
    group: 'VIP',
    tagline: 'Every question, every day, for ever.',
    weeklyLimit: null,
    access: 'All questions, unlimited, for life',
    perks: ['Unlimited questions', 'Every question open every day — nothing veiled', `Ask on ${BLOCKOUT_DAY_NAME}s, when the Oracle rests for everyone else`, 'Exclusive features as they arrive'],
    prices: [{ productId: 'tlo_elite_lifetime', label: '£109.99', period: 'one-time purchase' }],
    allQuestions: true,
    bypassBlockout: true,
  },
];

export const PLAN_BY_TIER: Record<Tier, PlanInfo> = Object.fromEntries(PLANS.map(p => [p.tier, p])) as Record<Tier, PlanInfo>;

export function isTier(v: unknown): v is Tier {
  return typeof v === 'string' && v in PLAN_BY_TIER;
}

/** "3 of 4 questions left this week" / "Unlimited questions" */
export function allowanceLine(remaining: number | null, limit: number | null): string {
  if (limit === null || remaining === null) return 'Unlimited questions';
  if (remaining === 0) return `No questions left this week · back ${RESET_DAY_NAME}`;
  return `${remaining} of ${limit} question${limit === 1 ? '' : 's'} left this week`;
}

/** 'YYYY-MM-DD' → "Monday 28 September" */
export function formatResetDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return iso;
  }
}
