/**
 * The sign-up journey, one screen after another:
 *
 *   Sign Up → /locationdetails → /dateofbirth → /paywall (free is fine) → /welcome → Home
 *
 * Each screen calls `useOnboardingFlow('<its route>')`. While `?onboarding=1` is in the URL,
 * `goNext()` replaces the screen with the next step; without it (the same screens opened from
 * Settings) `goNext()` simply goes back. `router.replace` is used throughout so Back never
 * returns into a half-finished sign-up.
 */
import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const ONBOARDING_STEPS = ['/locationdetails', '/dateofbirth', '/paywall', '/welcome'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * The root layout's auth guard bounces signed-in users off /signup. During sign-up the user
 * becomes signed in *while still on /signup*, so the guard must stand down until the journey
 * has moved on. `beginOnboarding()` raises this flag before the account is created;
 * the last step (or a sign-out) clears it.
 */
let inProgress = false;
export const beginOnboarding = () => { inProgress = true; };
export const endOnboarding = () => { inProgress = false; };
export const isOnboardingInProgress = () => inProgress;

export function useOnboardingFlow(step: OnboardingStep) {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  // Active when the URL says so, or when a sign-up is in flight — so a dropped parameter can't strand the journey.
  const active = onboarding === '1' || isOnboardingInProgress();

  const goNext = useCallback(() => {
    const i = ONBOARDING_STEPS.indexOf(step);
    const next = i >= 0 ? ONBOARDING_STEPS[i + 1] : undefined;
    if (active && next) router.replace({ pathname: next, params: { onboarding: '1' } });
    else if (active) { endOnboarding(); router.replace('/'); }
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [active, router, step]);

  return { active, goNext };
}

/** Call right after a successful sign-up (beginOnboarding() should already have been called). */
export function startOnboarding(router: ReturnType<typeof useRouter>) {
  inProgress = true;
  router.replace({ pathname: ONBOARDING_STEPS[0], params: { onboarding: '1' } });
}
