import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble, LoadingView, PageHeader, Screen } from '../../components/ui';
import { AreaMeters } from '../../components/AreaMeters';
import { WeekStrip } from '../../components/WeekStrip';
import { MoodCheckIn } from '../../components/MoodCheckIn';
import { DailyReadingShareCard } from '../../components/DailyReadingShareCard';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useDailyReading } from '../../hooks/useDailyReading';
import { BODY_META, SIGN_META } from '../../lib/astrology/natal';
import { MOON_PHASE_GLYPH } from '../../lib/astrology/sky';
import { Transit } from '../../lib/astrology/transits';

/**
 * Today — the full daily reading. Registered as a hidden tab route so the tab bar stays:
 *   <Tabs.Screen name="today" options={{ href: null }} />
 */

const ASPECT_GLYPH: Record<Transit['type'], string> = {
  conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍',
};

function longDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  try {
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return date.toDateString();
  }
}

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = useDailyReading();

  if (state.status === 'loading') return <LoadingView message="Reading today's sky…" />;

  return (
    <Screen scroll edges={['top']} decor>
      {state.status === 'ready' ? (
        <PageHeader
          eyebrow="Your day"
          title={longDate(state.date)}
          subtitle={`${MOON_PHASE_GLYPH[state.facts.moon.phase]}  Moon in ${state.facts.moon.sign}${state.facts.moon.house ? ` · your ${ordinal(state.facts.moon.house)} house` : ''}`}
          align="center"
        />
      ) : (
        <PageHeader eyebrow="Your day" title="Today" align="center" />
      )}

      {state.status === 'signed-out' && (
        <Card>
          <AppText variant="heading">Log in for your daily reading</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>Your reading is written from your own birth chart, so we need to know who you are.</AppText>
          <Button title="Log in" onPress={() => router.push('/login')} style={styles.cta} />
        </Card>
      )}

      {state.status === 'needs-chart' && (
        <Card>
          <AppText variant="heading">Your chart comes first</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>Add your date, time and place of birth and today's sky will be read against your own chart.</AppText>
          <Button title="Set up your chart" onPress={() => router.push('/chart')} style={styles.cta} />
        </Card>
      )}

      {state.status === 'error' && (
        <Card>
          <AppText variant="heading">Couldn't read today's sky</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>{state.message}</AppText>
        </Card>
      )}

      {state.status === 'ready' && (
        <>
          {/* The reading */}
          <Card tone="primary" style={styles.section}>
            <View style={styles.headerRow}>
              <AppText variant="overline" tone="onPrimary" style={styles.dim}>Today's reading</AppText>
              {state.refining && <ActivityIndicator size="small" color={colors.onPrimary} />}
            </View>
            <AppText variant="title" tone="onPrimary" style={styles.headline}>{state.text.headline}</AppText>
            <AppText variant="body" tone="onPrimary" style={styles.reading}>{state.text.reading}</AppText>
          </Card>

          {/* Do / Don't */}
          <Card style={styles.section}>
            <View style={styles.doRow}>
              <IconBubble name="checkmark-circle-outline" tone="accent" />
              <View style={styles.doText}>
                <AppText variant="overline" tone="accent">Do</AppText>
                <AppText variant="body">{state.text.do}</AppText>
              </View>
            </View>
            <View style={[styles.doRow, styles.dontRow, { borderTopColor: colors.border }]}>
              <IconBubble name="close-circle-outline" tone="primary" />
              <View style={styles.doText}>
                <AppText variant="overline" style={{ color: colors.primary }}>Don't</AppText>
                <AppText variant="body">{state.text.dont}</AppText>
              </View>
            </View>
          </Card>

          {/* Mood check-in */}
          <MoodCheckIn />

          {/* This week */}
          <WeekStrip />

          {/* Life areas */}
          <Card style={styles.section}>
            <SectionTitle icon="pulse-outline" title="Day at a glance" subtitle="Where the sky is pressing, and where it's helping" />
            <AreaMeters areas={state.facts.areas} />
          </Card>

          {/* Transits */}
          <Card style={styles.section}>
            <SectionTitle icon="planet-outline" title="Transits to your chart" subtitle="Strongest first" />
            {state.facts.transits.length === 0 && (
              <AppText variant="body" tone="secondary">A quiet sky: nothing is within orb of your chart today.</AppText>
            )}
            {state.facts.transits.slice(0, 8).map((t, i) => (
              <TransitRow key={`${t.transiting}-${t.natal}-${t.type}`} transit={t} first={i === 0} />
            ))}
          </Card>

          {/* Retrogrades */}
          {state.facts.retrograde.length > 0 && (
            <AppText variant="caption" tone="secondary" style={styles.retro}>
              Retrograde today: {state.facts.retrograde.map(b => `${BODY_META[b].glyph} ${b}`).join(', ')}
            </AppText>
          )}

          {/* Share today's reading (9:16 story card) */}
          <Card style={styles.section}>
            <SectionTitle icon="share-social-outline" title="Share today" subtitle="A story-sized card of your reading" />
            <DailyReadingShareCard text={state.text} facts={state.facts} compact />
          </Card>

          <AppText variant="caption" tone="muted" style={styles.footer}>
            {state.source === 'local'
              ? 'Composed from your transits on this device.'
              : 'Written for your chart from today’s transits.'}{' '}
            For reflection, not prediction.
          </AppText>
        </>
      )}
    </Screen>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <IconBubble name={icon} tone="primary" />
      <View style={styles.sectionTitleText}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText variant="caption" tone="secondary">{subtitle}</AppText> : null}
      </View>
    </View>
  );
}

function TransitRow({ transit: t, first }: { transit: Transit; first: boolean }) {
  const { colors } = useTheme();
  const tone = t.quality === 'pressure' ? colors.primary : t.quality === 'power' ? colors.accent : colors.textSecondary;
  const natalGlyph = t.natal === 'Ascendant' ? 'AC' : t.natal === 'Midheaven' ? 'MC' : BODY_META[t.natal].glyph;
  return (
    <View style={[styles.transitRow, !first && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.transitGlyphs, { color: colors.primary }]}>
        {BODY_META[t.transiting].glyph} <Text style={{ color: tone }}>{ASPECT_GLYPH[t.type]}</Text> {natalGlyph}
      </Text>
      <View style={styles.transitText}>
        <AppText variant="label">{t.label}</AppText>
        <AppText variant="caption" tone="secondary">
          {t.orb.toFixed(1)}° {t.applying ? 'and closing' : 'and easing'} · {t.areas.map(a => a[0].toUpperCase() + a.slice(1)).join(', ')}
        </AppText>
      </View>
      <View style={[styles.qualityDot, { backgroundColor: tone }]} />
    </View>
  );
}

function ordinal(n: number): string {
  const v = n % 100;
  return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th');
}

const styles = StyleSheet.create({
  para: { marginTop: spacing.xs },
  cta: { marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dim: { opacity: 0.85 },
  headline: { marginTop: spacing.xs },
  reading: { marginTop: spacing.sm, opacity: 0.95 },
  doRow: { flexDirection: 'row', alignItems: 'center' },
  dontRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  doText: { flex: 1, marginLeft: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitleText: { flex: 1, marginLeft: spacing.md },
  transitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  transitGlyphs: { fontSize: 18, width: 72 },
  transitText: { flex: 1 },
  qualityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
  retro: { textAlign: 'center', marginTop: spacing.xs },
  footer: { textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
});
