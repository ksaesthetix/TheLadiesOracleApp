import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, IconBubble } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useWeek } from '../hooks/useWeekAndCycles';
import { MOON_PHASE_GLYPH } from '../lib/astrology/sky';
import { SIGN_META } from '../lib/astrology/natal';
import { AREA_META, AreaState } from '../lib/astrology/transits';
import { DayEvent } from '../lib/astrology/week';

/**
 * "This week": seven day columns (Moon phase, sign, a bar for how loud the day is,
 * coloured by its dominant quality), and the selected day's headline and events.
 * Drop `<WeekStrip />` into the Today screen. Renders nothing until the chart is ready.
 */
export function WeekStrip() {
  const { colors } = useTheme();
  const week = useWeek();
  const [selected, setSelected] = useState<number | null>(null);

  if (!week) return null;
  const idx = selected ?? Math.max(0, week.days.findIndex(d => d.isToday));
  const day = week.days[idx];

  const tone = (state: AreaState) =>
    state === 'power' ? colors.accent : state === 'pressure' ? colors.primary : state === 'charged' ? colors.textSecondary : colors.border;

  const ordinal = (n: number) => { const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconBubble name="calendar-outline" tone="primary" />
        <View style={styles.headerText}>
          <AppText variant="heading">This week</AppText>
          <AppText variant="caption" tone="secondary">Tap a day. Bars show how much the sky is touching your chart.</AppText>
        </View>
      </View>

      {/* Day columns */}
      <View style={styles.strip}>
        {week.days.map((d, i) => {
          const active = i === idx;
          const h = Math.max(6, Math.round((d.intensity / week.maxIntensity) * 36));
          return (
            <Pressable
              key={d.date}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityLabel={`${d.weekday} ${d.dayOfMonth}`}
              style={[styles.col, active && { backgroundColor: colors.accentSoft, borderColor: colors.accent }, { borderColor: active ? colors.accent : 'transparent' }]}
            >
              <AppText variant="caption" tone={d.isToday ? 'primary' : 'secondary'} style={styles.weekday}>{d.weekday}</AppText>
              <AppText variant="label" style={d.isToday && { color: colors.primary }}>{d.dayOfMonth}</AppText>
              <Text style={styles.phase}>{MOON_PHASE_GLYPH[d.moon.phase]}</Text>
              <View style={[styles.track, { backgroundColor: colors.border }]}>
                <View style={[styles.bar, { height: h, backgroundColor: tone(d.dominant) }]} />
              </View>
              {d.events.some(e => e.kind === 'lunation') && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* Selected day */}
      <View style={[styles.detail, { borderTopColor: colors.border }]}>
        <AppText variant="overline" tone="accent">
          {day.isToday ? 'Today' : `${day.weekday} ${day.dayOfMonth}`}
        </AppText>
        <AppText variant="bodyStrong" style={styles.detailLine}>
          <Text style={{ color: colors.primary }}>{SIGN_META[day.moon.sign].glyph}</Text> Moon in {day.moon.sign}
          {day.moon.house ? ` · your ${ordinal(day.moon.house)} house` : ''} · {day.moon.phase}
        </AppText>
        {day.headline && (
          <AppText variant="body" tone="secondary" style={styles.detailLine}>
            Leading transit: {day.headline.label}
          </AppText>
        )}
        {day.busiest && (
          <AppText variant="body" tone="secondary" style={styles.detailLine}>
            Busiest area: {AREA_META[day.busiest.area].title} ({day.busiest.state})
          </AppText>
        )}
        {day.events.length > 0 && (
          <View style={styles.events}>
            {day.events.map((e, i) => <EventRow key={`${e.kind}-${e.label}-${i}`} event={e} />)}
          </View>
        )}
      </View>
    </Card>
  );
}

function EventRow({ event: e }: { event: DayEvent }) {
  const { colors } = useTheme();
  const icon: Record<DayEvent['kind'], React.ComponentProps<typeof Ionicons>['name']> = {
    lunation: 'moon-outline', 'moon-sign': 'swap-horizontal-outline', station: 'refresh-outline', ingress: 'arrow-forward-outline', exact: 'locate-outline',
  };
  const time = e.at ? new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <View style={styles.eventRow}>
      <Ionicons name={icon[e.kind]} size={16} color={e.kind === 'lunation' ? colors.accent : colors.primary} style={styles.eventIcon} />
      <AppText variant="caption" style={styles.eventText}>{e.label}{time ? `  ·  ${time}` : ''}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerText: { flex: 1, marginLeft: spacing.md },
  strip: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  col: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1 },
  weekday: { fontSize: 11 },
  phase: { fontSize: 14, marginVertical: 2 },
  track: { width: 8, height: 36, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
  detail: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  detailLine: { marginTop: 4 },
  events: { marginTop: spacing.sm, gap: 6 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { marginRight: spacing.sm },
  eventText: { flex: 1 },
});

export default WeekStrip;
