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

export function useOnboardingFlow(step: OnboardingStep) {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const active = onboarding === '1';

  const goNext = useCallback(() => {
    const i = ONBOARDING_STEPS.indexOf(step);
    const next = i >= 0 ? ONBOARDING_STEPS[i + 1] : undefined;
    if (active && next) router.replace({ pathname: next, params: { onboarding: '1' } });
    else if (active) router.replace('/');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [active, router, step]);

  return { active, goNext };
}

/** Call right after a successful sign-up. */
export function startOnboarding(router: ReturnType<typeof useRouter>) {
  router.replace({ pathname: ONBOARDING_STEPS[0], params: { onboarding: '1' } });
}
