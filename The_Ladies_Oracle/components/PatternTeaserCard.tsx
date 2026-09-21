import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, IconBubble } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

/** Entry point to /chart/pattern — drop into the Chart screen under the Big Three. */
export function PatternTeaserCard({ essence }: { essence?: string | null }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => router.push('/chart/pattern')} accessibilityRole="button" style={({ pressed }) => [pressed && styles.pressed]}>
      <Card tone="primary" style={styles.card}>
        <View style={styles.row}>
          <IconBubble name="finger-print-outline" tone="onPrimary" />
          <View style={styles.text}>
            <AppText variant="heading" tone="onPrimary">Your Pattern</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.dim}>
              {essence ?? 'Foundation, development, relationships, and what makes you unlike the rest — written from your chart.'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, marginLeft: spacing.md, marginRight: spacing.sm },
  dim: { opacity: 0.85, marginTop: 2 },
  pressed: { transform: [{ scale: 0.985 }] },
});

export default PatternTeaserCard;
