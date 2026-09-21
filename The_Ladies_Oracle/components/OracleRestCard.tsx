import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { LuckyColourCard } from './LuckyColourCard';

/**
 * Shown in place of the question list on the Oracle's rest day: what to do instead.
 *   <OracleRestCard day="Sunday" />
 */
export function OracleRestCard({ day }: { day: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View>
      <Card tone="primary" style={styles.card}>
        <View style={styles.row}>
          <IconBubble name="moon-outline" tone="onPrimary" size={48} />
          <View style={styles.text}>
            <AppText variant="heading" tone="onPrimary">The Oracle rests on {day}s</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.dim}>
              No questions today. The sky, though, never rests — read your chart, or see what today holds.
            </AppText>
          </View>
        </View>
      </Card>

      <LuckyColourCard />

      <Button
        title="Read your birth chart"
        variant="outline"
        icon={<Ionicons name="planet-outline" size={18} color={colors.primary} />}
        onPress={() => router.push('/chart')}
      />
      <Button
        title="Today's sky"
        variant="ghost"
        icon={<Ionicons name="sunny-outline" size={18} color={colors.textSecondary} />}
        onPress={() => router.push('/today')}
        style={styles.second}
      />
      <AppText variant="caption" tone="muted" align="center" style={styles.foot}>
        Lifetime Elite members may ask on any day.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, marginLeft: spacing.md },
  dim: { opacity: 0.85, marginTop: 2 },
  second: { marginTop: spacing.sm },
  foot: { marginTop: spacing.lg },
});

export default OracleRestCard;
