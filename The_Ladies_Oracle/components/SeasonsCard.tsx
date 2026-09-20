import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, IconBubble } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useCycles } from '../hooks/useWeekAndCycles';
import { useNatalChart } from '../hooks/useNatalChart';
import { ageOn, CycleWindow } from '../lib/astrology/cycles';
import { BODY_META } from '../lib/astrology/natal';

/**
 * "Your seasons": the slow cycles — Saturn return, Jupiter return, nodal return,
 * Uranus opposition… — with the window you're in now and what's coming.
 * Drop `<SeasonsCard />` into the Chart screen. Renders nothing until the chart is ready.
 */
export function SeasonsCard({ upcomingToShow = 4 }: { upcomingToShow?: number }) {
  const { colors } = useTheme();
  const cycles = useCycles();
  const { state } = useNatalChart();
  const [open, setOpen] = useState<string | null>(null);

  if (!cycles || state.status !== 'ready') return null;
  const chart = state.chart;
  const active = cycles.filter(c => c.status === 'active');
  const upcoming = cycles.filter(c => c.status === 'upcoming').slice(0, upcomingToShow);
  const recent = cycles.filter(c => c.status === 'past' && c.days < 365).slice(0, 1);

  const fmt = (iso: string) => {
    const [y, m] = iso.split('-').map(Number);
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
  };
  const months = (days: number) => (days < 45 ? `${Math.max(1, Math.round(days / 7))} weeks` : days < 700 ? `${Math.round(days / 30.4)} months` : `${(days / 365.25).toFixed(1).replace(/\.0$/, '')} years`);

  const Row = ({ w, emphasis }: { w: CycleWindow; emphasis?: boolean }) => {
    const key = `${w.cycle.id}-${w.start}`;
    const expanded = open === key;
    const when =
      w.status === 'active' ? `Now · until ${fmt(w.end)}`
      : w.status === 'upcoming' ? `In ${months(w.days)} · ${fmt(w.start)} – ${fmt(w.end)}`
      : `Ended ${fmt(w.end)}`;
    return (
      <Pressable onPress={() => setOpen(expanded ? null : key)} accessibilityRole="button" style={[styles.row, { borderTopColor: colors.border }]}>
        <View style={[styles.glyphWrap, { backgroundColor: emphasis ? colors.primary : colors.accentSoft }]}>
          <AppText variant="body" style={{ color: emphasis ? colors.onPrimary : colors.primary }}>{BODY_META[w.cycle.body].glyph}</AppText>
        </View>
        <View style={styles.rowText}>
          <AppText variant="label">{w.cycle.name}<AppText variant="caption" tone="muted">  · age {ageOn(chart, w.start)}</AppText></AppText>
          <AppText variant="caption" tone={emphasis ? 'primary' : 'secondary'}>{when}</AppText>
          {expanded && (
            <View style={styles.expanded}>
              <AppText variant="body" tone="secondary">{w.cycle.blurb}</AppText>
              <AppText variant="caption" tone="muted" style={styles.exact}>
                Typical ages {w.cycle.ages}. Exact {w.exact.length === 1 ? 'on' : 'on'} {w.exact.map(fmt).join(', ') || '—'}.
              </AppText>
            </View>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconBubble name="hourglass-outline" tone="primary" />
        <View style={styles.headerText}>
          <AppText variant="heading">Your seasons</AppText>
          <AppText variant="caption" tone="secondary">The slow cycles that mark chapters. Tap one to read it.</AppText>
        </View>
      </View>

      {active.length > 0 ? (
        <>
          <AppText variant="overline" tone="accent" style={styles.sectionLabel}>You are in</AppText>
          {active.map(w => <Row key={`${w.cycle.id}-${w.start}`} w={w} emphasis />)}
        </>
      ) : (
        <AppText variant="body" tone="secondary" style={styles.quiet}>
          No major cycle is active right now — an open stretch between chapters.
        </AppText>
      )}

      {upcoming.length > 0 && (
        <>
          <AppText variant="overline" tone="muted" style={styles.sectionLabel}>Coming up</AppText>
          {upcoming.map(w => <Row key={`${w.cycle.id}-${w.start}`} w={w} />)}
        </>
      )}

      {recent.length > 0 && (
        <>
          <AppText variant="overline" tone="muted" style={styles.sectionLabel}>Just finished</AppText>
          {recent.map(w => <Row key={`${w.cycle.id}-${w.start}`} w={w} />)}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  headerText: { flex: 1, marginLeft: spacing.md },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  quiet: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  glyphWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowText: { flex: 1, marginLeft: spacing.md },
  expanded: { marginTop: spacing.sm },
  exact: { marginTop: spacing.xs },
});

export default SeasonsCard;
