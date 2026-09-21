import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../../../components/ui';
import { BackBar } from '../../../components/BackBar';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { JournalEntry, JournalType, useJournal } from '../../../hooks/useJournal';
import { SIGN_META, ZodiacSign } from '../../../lib/astrology/natal';
import { auth } from '../../../firebaseConfig';

/**
 * /profile/journal — everything you've kept: Oracle answers, affirmations, moods,
 * New Moon intentions and Full Moon reflections, each stamped with the sky at the time.
 * Once there are enough mood check-ins, the top card shows which skies suit you.
 */

const TYPE_META: Record<JournalType, { title: string; icon: React.ComponentProps<typeof Ionicons>['name']; tone: 'primary' | 'accent' | 'neutral' }> = {
  oracle:     { title: 'Oracle',       icon: 'sparkles-outline', tone: 'primary' },
  affirmation:{ title: 'Affirmation',  icon: 'heart-outline',    tone: 'accent' },
  mood:       { title: 'Mood',         icon: 'sunny-outline',    tone: 'accent' },
  intention:  { title: 'Intention',    icon: 'moon-outline',     tone: 'primary' },
  reflection: { title: 'Reflection',   icon: 'book-outline',     tone: 'neutral' },
};
const MOOD_GLYPH = ['', '☁️', '🌧️', '⛅', '🌤️', '☀️'];
const FILTERS: (JournalType | 'all')[] = ['all', 'oracle', 'mood', 'affirmation'];

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { entries, loading, error, insights } = useJournal(300);
  const [filter, setFilter] = useState<JournalType | 'all'>('all');

  if (!auth.currentUser) {
    return (
      <Screen centered edges={['top']} decor>
        <Ionicons name="book-outline" size={64} color={colors.textMuted} />
        <AppText variant="heading" align="center" style={styles.stateTitle}>Log in to keep a journal.</AppText>
        <Button title="Go to Login" fullWidth={false} onPress={() => router.replace('/login')} style={styles.stateAction} />
      </Screen>
    );
  }

  const visible = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  // Group by day
  const groups: { date: string; items: JournalEntry[] }[] = [];
  for (const e of visible) {
    const key = e.sky?.date ?? (e.createdAt ? e.createdAt.toISOString().slice(0, 10) : 'Undated');
    const g = groups[groups.length - 1];
    if (g && g.date === key) g.items.push(e); else groups.push({ date: key, items: [e] });
  }

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Profile" />
      <PageHeader eyebrow="Kept" title="Journal" subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}${insights.streak >= 2 ? ` · ${insights.streak}-day check-in streak` : ''}`} />

      {/* Insights */}
      <InsightsCard insights={insights} />

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} accessibilityRole="button" style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
              <AppText variant="caption" style={{ color: active ? colors.onPrimary : colors.textSecondary }}>
                {f === 'all' ? 'All' : TYPE_META[f].title}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error ? (
        <Card tone="alt"><AppText variant="body" tone="secondary">{error}</AppText></Card>
      ) : groups.length === 0 ? (
        <Card tone="alt">
          <AppText variant="body" tone="secondary">
            Nothing here yet. Oracle answers, your daily check-in and Moon intentions all land in the journal as you go.
          </AppText>
        </Card>
      ) : (
        groups.map(g => (
          <View key={g.date} style={styles.group}>
            <AppText variant="overline" tone="muted" style={styles.dateLabel}>{formatDate(g.date)}</AppText>
            {g.items.map(e => <EntryCard key={e.id} entry={e} />)}
          </View>
        ))
      )}
    </Screen>
  );
}

function InsightsCard({ insights }: { insights: ReturnType<typeof useJournal>['insights'] }) {
  const { colors } = useTheme();
  if (insights.moodCount < 5) {
    return (
      <Card tone="alt" style={styles.section}>
        <View style={styles.row}>
          <IconBubble name="analytics-outline" tone="accent" />
          <View style={styles.rowText}>
            <AppText variant="label">Insights unlock after five check-ins</AppText>
            <AppText variant="caption" tone="secondary">
              {insights.moodCount === 0 ? 'Tap a face on the Today screen each day.' : `${insights.moodCount} so far — ${5 - insights.moodCount} to go.`}
            </AppText>
          </View>
        </View>
      </Card>
    );
  }
  return (
    <Card style={styles.section}>
      <View style={styles.row}>
        <IconBubble name="analytics-outline" tone="primary" />
        <View style={styles.rowText}>
          <AppText variant="heading">Which skies suit you</AppText>
          <AppText variant="caption" tone="secondary">From {insights.moodCount} check-ins · average {insights.overallAverage} / 5</AppText>
        </View>
      </View>
      {insights.best.length === 0 && insights.hardest.length === 0 ? (
        <AppText variant="body" tone="secondary" style={styles.insightBody}>No clear pattern yet — the sky hasn't repeated itself enough. Keep going.</AppText>
      ) : (
        <>
          {insights.best.map(i => (
            <View key={i.label} style={[styles.insightRow, { borderTopColor: colors.border }]}>
              <Ionicons name="trending-up-outline" size={16} color={colors.accent} style={styles.insightIcon} />
              <AppText variant="body" style={styles.grow}>{i.label}</AppText>
              <AppText variant="caption" tone="secondary">{i.average} avg · {i.count} days</AppText>
            </View>
          ))}
          {insights.hardest.map(i => (
            <View key={i.label} style={[styles.insightRow, { borderTopColor: colors.border }]}>
              <Ionicons name="trending-down-outline" size={16} color={colors.primary} style={styles.insightIcon} />
              <AppText variant="body" style={styles.grow}>{i.label}</AppText>
              <AppText variant="caption" tone="secondary">{i.average} avg · {i.count} days</AppText>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

function EntryCard({ entry: e }: { entry: JournalEntry }) {
  const { colors } = useTheme();
  const meta = TYPE_META[e.type] ?? TYPE_META.oracle;
  const moonSign = e.sky?.moonSign as ZodiacSign | undefined;
  const stamp = [
    moonSign && SIGN_META[moonSign] ? `${SIGN_META[moonSign].glyph} Moon in ${moonSign}` : null,
    e.sky?.moonHouse ? `H${e.sky.moonHouse}` : null,
    e.sky?.headline ?? null,
  ].filter(Boolean).join(' · ');

  return (
    <Card style={styles.entry}>
      <View style={styles.row}>
        <IconBubble name={meta.icon} tone={meta.tone} />
        <View style={styles.rowText}>
          <View style={styles.entryHead}>
            <AppText variant="overline" tone="muted">{meta.title}</AppText>
            {e.type === 'mood' && typeof e.meta.score === 'number' && (
              <Text style={styles.moodGlyph}>{MOOD_GLYPH[e.meta.score as number] ?? ''}</Text>
            )}
          </View>
          {e.type === 'oracle' && (
            <AppText variant="caption" tone="secondary">
              {String(e.meta.question ?? '')}{e.meta.iconSymbol ? `  ·  ${String(e.meta.iconSymbol)}` : ''}
            </AppText>
          )}
          {e.text ? (
            <AppText variant={e.type === 'oracle' || e.type === 'affirmation' ? 'quote' : 'body'} style={styles.entryText}>
              {e.type === 'oracle' || e.type === 'affirmation' ? `“${e.text}”` : e.text}
            </AppText>
          ) : null}
          {stamp ? <AppText variant="caption" tone="muted" style={styles.stamp}>{stamp}</AppText> : null}
        </View>
      </View>
    </Card>
  );
}

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  try { return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }); }
  catch { return date.toDateString(); }
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowText: { flex: 1, marginLeft: spacing.md },
  grow: { flex: 1 },
  insightBody: { marginTop: spacing.sm },
  insightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xs },
  insightIcon: { marginRight: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  spinner: { marginVertical: spacing.lg },
  group: { marginBottom: spacing.sm },
  dateLabel: { marginBottom: spacing.sm },
  entry: { marginBottom: spacing.sm },
  entryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moodGlyph: { fontSize: 18 },
  entryText: { marginTop: 4 },
  stamp: { marginTop: spacing.xs },
  stateTitle: { marginTop: spacing.lg },
  stateAction: { marginTop: spacing.xl },
});
