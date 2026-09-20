import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useSky } from '../hooks/useSky';
import { MOON_PHASE_GLYPH, describeLunarEvent, hoursUntil } from '../lib/astrology/sky';
import { BODY_META, SIGN_META } from '../lib/astrology/natal';

type Props = {
  /** Optional tap target, e.g. () => router.push('/chart'). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Home-screen card: the Moon right now, what's retrograde, and the next New / Full Moon.
 * Drop `<TodaySkyCard onPress={() => router.push('/chart')} />` into app/(tabs)/index.tsx.
 */
export function TodaySkyCard({ onPress, style }: Props) {
  const { colors } = useTheme();
  const sky = useSky();
  const { moon } = sky;
  const hrs = hoursUntil(moon.leavesSignAt);
  const mercuryRx = sky.retrograde.includes('Mercury');

  const body = (
    <Card style={[styles.card, style]}>
      {/* Moon */}
      <View style={styles.row}>
        <Text style={styles.phaseGlyph}>{MOON_PHASE_GLYPH[moon.phase]}</Text>
        <View style={styles.grow}>
          <AppText variant="overline" tone="secondary">Today's sky</AppText>
          <AppText variant="heading">
            Moon in {moon.sign} <Text style={{ color: colors.primary }}>{SIGN_META[moon.sign].glyph}</Text>
          </AppText>
          <AppText variant="caption" tone="secondary">
            {moon.phase} · {Math.round(moon.illumination * 100)}% lit · enters {moon.nextSign} {hrs < 1 ? 'within the hour' : `in ${hrs}h`}
          </AppText>
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>

      {/* Retrogrades */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      {sky.retrograde.length === 0 ? (
        <AppText variant="caption" tone="secondary">No planets retrograde — the sky is moving forward.</AppText>
      ) : (
        <View style={styles.chips}>
          {sky.retrograde.map(b => (
            <View
              key={b}
              style={[
                styles.chip,
                { backgroundColor: b === 'Mercury' ? colors.primary : colors.accentSoft, borderColor: b === 'Mercury' ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: b === 'Mercury' ? colors.surface : colors.primary }]}>
                {BODY_META[b].glyph} {b} ℞
              </Text>
            </View>
          ))}
        </View>
      )}
      {mercuryRx && (
        <AppText variant="caption" tone="secondary" style={styles.note}>
          Mercury is retrograde: re-read before you send, and give plans room to change.
        </AppText>
      )}

      {/* Upcoming lunations */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.lunations}>
        <View style={styles.lunation}>
          <Text style={styles.lunationGlyph}>🌕</Text>
          <AppText variant="caption" tone="secondary">{describeLunarEvent(sky.nextFullMoon)}</AppText>
        </View>
        <View style={styles.lunation}>
          <Text style={styles.lunationGlyph}>🌑</Text>
          <AppText variant="caption" tone="secondary">{describeLunarEvent(sky.nextNewMoon)}</AppText>
        </View>
      </View>
    </Card>
  );

  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Today's sky">
      {body}
    </Pressable>
  ) : body;
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1, marginLeft: spacing.md },
  phaseGlyph: { fontSize: 40, lineHeight: 48 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  note: { marginTop: spacing.sm },
  lunations: { gap: 4 },
  lunation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lunationGlyph: { fontSize: 16 },
});

export default TodaySkyCard;
