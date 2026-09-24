import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../components/ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { usePlan } from '../hooks/usePlan';
import { usePurchases } from '../hooks/usePurchases';
import { BLOCKOUT_DAY_NAME, PLANS, PlanInfo, RESET_DAY_NAME } from '../lib/plans';
import { PRIVACY_URL, TERMS_URL } from '../constants/links';

/**
 * /paywall — the four circles. Register in the root Stack as
 *   <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
 * Opened from Settings → Membership, from a locked question, and when the week's allowance is spent.
 */
const TIER_ICON: Record<PlanInfo['tier'], React.ComponentProps<typeof IconBubble>['name']> = {
  explorer: 'compass-outline',
  'inner-explorer': 'key-outline',
  'inner-connoisseur': 'diamond-outline',
  elite: 'infinite-outline',
};

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tier: current, plan: currentPlan, signedIn } = usePlan();
  const { purchase, restore } = usePurchases();

  return (
    <Screen scroll edges={['top', 'bottom']} decor>
      <View style={styles.topBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </Pressable>
      </View>

      <PageHeader
        eyebrow="Membership"
        title="Choose your circle"
        subtitle={signedIn ? `You are ${currentPlan.group === 'Free' ? 'an' : 'in the'} ${currentPlan.name}.` : 'Log in to join a circle.'}
        align="center"
      />

      {PLANS.map(plan => {
        const isCurrent = plan.tier === current;
        const primary = plan.tier === 'elite';
        return (
          <Card key={plan.tier} tone={primary ? 'primary' : undefined} style={styles.card}>
            <View style={styles.head}>
              <IconBubble name={TIER_ICON[plan.tier]} tone={primary ? 'onPrimary' : plan.group === 'Free' ? 'neutral' : 'primary'} />
              <View style={styles.headText}>
                <AppText variant="overline" tone={primary ? 'onPrimary' : 'accent'} style={primary && styles.dim}>{plan.group}</AppText>
                <AppText variant="heading" tone={primary ? 'onPrimary' : undefined}>{plan.name}</AppText>
              </View>
              {isCurrent && (
                <View style={[styles.currentPill, { backgroundColor: primary ? 'rgba(255,255,255,0.18)' : colors.accentSoft }]}>
                  <AppText variant="caption" tone={primary ? 'onPrimary' : 'primary'}>Current</AppText>
                </View>
              )}
            </View>

            <AppText variant="body" tone={primary ? 'onPrimary' : 'secondary'} style={styles.access}>{plan.access}</AppText>

            {plan.perks.map(perk => (
              <View key={perk} style={styles.perk}>
                <Ionicons name="checkmark" size={16} color={primary ? colors.onPrimary : colors.accent} />
                <AppText variant="caption" tone={primary ? 'onPrimary' : undefined} style={styles.perkText}>{perk}</AppText>
              </View>
            ))}

            <View style={styles.prices}>
              {plan.prices.map(price =>
                plan.tier === 'explorer' ? (
                  <AppText key="free" variant="label" tone="secondary" style={styles.free}>{price.label}</AppText>
                ) : (
                  <Button
                    key={price.productId}
                    title={`${price.label} ${price.period}${price.badge ? `  ·  ${price.badge}` : ''}`}
                    variant={primary ? 'secondary' : 'outline'}
                    onPress={() => purchase(plan, price)}
                    disabled={isCurrent || !signedIn}
                    style={styles.priceButton}
                  />
                ),
              )}
            </View>
          </Card>
        );
      })}

      <Button title="Restore purchases" variant="ghost" onPress={restore} style={styles.restore} />

      <AppText variant="caption" tone="muted" align="center" style={styles.small}>
        A question counts when you choose it, repeats included. Allowances reset every {RESET_DAY_NAME}. The Oracle rests on {BLOCKOUT_DAY_NAME}s.
        Subscriptions renew automatically until cancelled in your App Store or Google Play settings.
      </AppText>
      <View style={styles.legalRow}>
        <AppText variant="caption" tone="primary" onPress={() => Linking.openURL(TERMS_URL)}>Terms of Use</AppText>
        <AppText variant="caption" tone="muted">  ·  </AppText>
        <AppText variant="caption" tone="primary" onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.xs },
  card: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center' },
  headText: { flex: 1, marginLeft: spacing.md },
  dim: { opacity: 0.85 },
  currentPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  access: { marginTop: spacing.sm },
  perk: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  perkText: { marginLeft: spacing.sm, flex: 1 },
  prices: { marginTop: spacing.md },
  priceButton: { marginTop: spacing.xs },
  free: { textAlign: 'center' },
  restore: { marginTop: spacing.sm },
  small: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
});
