import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AREA_META, AreaReading, AreaState } from '../lib/astrology/transits';

/**
 * The six life areas as meters — Co-Star's "day at a glance".
 * `compact` renders a single row of small columns (for the Home card);
 * otherwise each area gets a row with its state and a bar (for the Today screen).
 */
export function AreaMeters({ areas, compact = false }: { areas: AreaReading[]; compact?: boolean }) {
  const { colors } = useTheme();

  const tone = (state: AreaState) => {
    switch (state) {
      case 'power': return colors.accent;
      case 'pressure': return colors.primary;
      case 'charged': return colors.textSecondary;
      default: return colors.border;
    }
  };
  const label = (state: AreaState) => (state === 'quiet' ? 'Quiet' : state === 'power' ? 'Power' : state === 'pressure' ? 'Pressure' : 'Charged');

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {areas.map(a => (
          <View key={a.area} style={styles.compactCol}>
            <View style={[styles.compactTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.compactFill,
                  { backgroundColor: tone(a.state), height: `${Math.max(12, Math.round(a.intensity * 100))}%` },
                ]}
              />
            </View>
            <AppText variant="caption" tone="secondary" style={styles.compactLabel}>{AREA_META[a.area].title}</AppText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      {areas.map((a, i) => (
        <View key={a.area} style={[styles.row, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.rowHead}>
            <AppText variant="label">{AREA_META[a.area].title}</AppText>
            <AppText variant="caption" tone="secondary">{AREA_META[a.area].blurb}</AppText>
          </View>
          <View style={styles.rowMeter}>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { backgroundColor: tone(a.state), width: `${Math.max(6, Math.round(a.intensity * 100))}%` }]} />
            </View>
            <AppText variant="caption" style={[styles.state, { color: a.state === 'quiet' ? colors.textMuted : tone(a.state) }]}>
              {label(a.state)}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  compactCol: { flex: 1, alignItems: 'center' },
  compactTrack: { width: '100%', height: 36, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  compactFill: { width: '100%', borderRadius: 6 },
  compactLabel: { marginTop: 4, fontSize: 11 },

  row: { paddingVertical: spacing.sm },
  rowHead: { marginBottom: 6 },
  rowMeter: { flexDirection: 'row', alignItems: 'center' },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  state: { width: 72, textAlign: 'right', marginLeft: spacing.sm },
});

export default AreaMeters;
