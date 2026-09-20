import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, IconBubble } from './ui';
import { AreaMeters } from './AreaMeters';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useDailyReading } from '../hooks/useDailyReading';

/**
 * Home card: today's reading at a glance. Tapping opens the full Today screen.
 *   <DailyReadingCard style={styles.readingCard} />
 */
export function DailyReadingCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useDailyReading();

  // Not signed in: the Home screen already shows Login / Sign Up, so stay quiet.
  if (state.status === 'signed-out') return null;

  if (state.status === 'needs-chart') {
    return (
      <Pressable onPress={() => router.push('/chart')} accessibilityRole="button">
        <Card tone="alt" style={[styles.card, style]}>
          <View style={styles.row}>
            <IconBubble name="sparkles-outline" tone="accent" />
            <View style={styles.rowText}>
              <AppText variant="heading">Unlock your daily reading</AppText>
              <AppText variant="caption" tone="secondary">Add your birth details and the sky starts speaking to your chart every day.</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      </Pressable>
    );
  }

  if (state.status !== 'ready') {
    return (
      <Card style={[styles.card, style]}>
        <View style={styles.row}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" tone="secondary" style={styles.rowText}>
            {state.status === 'error' ? state.message : 'Reading today\'s sky…'}
          </AppText>
        </View>
      </Card>
    );
  }

  const { text, facts } = state;
  return (
    <Pressable onPress={() => router.push('/today')} accessibilityRole="button" accessibilityLabel="Open today's reading">
      <Card style={[styles.card, style]}>
        <View style={styles.header}>
          <AppText variant="overline" tone="accent">Your day</AppText>
          {state.refining && <ActivityIndicator size="small" color={colors.textMuted} />}
        </View>
        <AppText variant="heading" style={styles.headline}>{text.headline}</AppText>
        <AppText variant="body" tone="secondary" style={styles.reading}>{text.reading}</AppText>

        <AreaMeters areas={facts.areas} compact />

        <View style={styles.footer}>
          <AppText variant="caption" tone="muted">
            Moon in {facts.moon.sign}{facts.moon.house ? ` · your ${facts.moon.house}${suffix(facts.moon.house)} house` : ''}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

function suffix(n: number) {
  const v = n % 100;
  return ['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th';
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1, marginLeft: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headline: { marginTop: 2 },
  reading: { marginTop: spacing.xs, marginBottom: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
});

export default DailyReadingCard;
