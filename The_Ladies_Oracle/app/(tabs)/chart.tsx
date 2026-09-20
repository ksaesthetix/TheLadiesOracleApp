import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble, LoadingView, PageHeader, Screen } from '../../components/ui';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useNatalChart, BirthProfile } from '../../hooks/useNatalChart';
import {
  Aspect, AspectType, BODY_META, NatalChart, Placement, SIGN_META, ZodiacSign, formatDegree, signOf,
} from '../../lib/astrology/natal';

const ASPECT_GLYPH: Record<AspectType, string> = {
  conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function describeBirth(profile: BirthProfile): string {
  const [y, m, d] = profile.date.split('-').map(Number);
  const when = `${d} ${MONTHS[m - 1]} ${y}${profile.time ? `, ${profile.time}` : ''}`;
  return profile.placeName ? `${when} · ${profile.placeName}` : when;
}

export default function YourChartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { state, refresh } = useNatalChart();

  if (state.status === 'loading') {
    return <LoadingView message="Reading the sky at the moment you were born..." />;
  }

  return (
    <Screen scroll edges={['top']} decor>
      <PageHeader
        eyebrow="Your chart"
        title="Your Birth Chart"
        subtitle={state.status === 'ready' ? describeBirth(state.profile) : 'The sky at the moment you were born'}
        align="center"
      />

      {state.status === 'signed-out' && (
        <Card>
          <AppText variant="heading">Log in to see your chart</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>
            Your chart is calculated from your date, time and place of birth, which live on your profile.
          </AppText>
          <Button title="Log in" onPress={() => router.push('/login')} style={styles.cta} />
        </Card>
      )}

      {state.status === 'missing' && (
        <Card>
          <AppText variant="heading">A couple of details first</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>
            {state.needsDate && state.needsPlace
              ? 'We need your date of birth and the place you were born to draw your chart.'
              : state.needsDate
                ? 'We have your birthplace but not your date of birth.'
                : 'We have your date of birth but not where you were born.'}
          </AppText>
          {state.needsDate && <Button title="Add date of birth" onPress={() => router.push('/dateofbirth')} style={styles.cta} />}
          {state.needsPlace && <Button title="Add birthplace" onPress={() => router.push('/locationdetails')} style={styles.cta} />}
          <Pressable onPress={() => refresh()} style={styles.linkRow} accessibilityRole="button">
            <AppText variant="label" style={{ color: colors.primary }}>I've added them — check again</AppText>
          </Pressable>
        </Card>
      )}

      {state.status === 'error' && (
        <Card>
          <AppText variant="heading">Couldn't read your chart</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>{state.message}</AppText>
          <Button title="Try again" onPress={() => refresh()} style={styles.cta} />
        </Card>
      )}

      {state.status === 'ready' && <ChartBody chart={state.chart} onRecalculate={() => refresh(true)} />}
    </Screen>
  );
}

// ─── Chart body ──────────────────────────────────────────────────────────────

function ChartBody({ chart, onRecalculate }: { chart: NatalChart; onRecalculate: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { bigThree, placements, aspects, angles, input } = chart;
  const sun = placements.find(p => p.body === 'Sun')!;
  const moon = placements.find(p => p.body === 'Moon')!;

  return (
    <>
      {/* Big three */}
      <View style={styles.bigThreeRow}>
        <BigThreeCard label="Sun" sign={bigThree.sun} degree={formatDegree(sun.longitude)} />
        <BigThreeCard label="Moon" sign={bigThree.moon} degree={bigThree.moonSignUncertain ? 'may vary' : formatDegree(moon.longitude)} />
        <BigThreeCard label="Rising" sign={bigThree.rising} degree={angles ? formatDegree(angles.ascendant) : 'needs time'} />
      </View>

      {/* Birth-time notice */}
      {!input.timeKnown && (
        <Pressable onPress={() => router.push('/dateofbirth')} accessibilityRole="button">
          <Card tone="alt" style={styles.noticeCard}>
            <View style={styles.row}>
              <IconBubble name="time-outline" tone="accent" />
              <View style={styles.rowText}>
                <AppText variant="label">Add your birth time</AppText>
                <AppText variant="caption" tone="secondary">
                  Your rising sign and houses depend on it{bigThree.moonSignUncertain ? ', and the Moon changed sign that day' : ''}.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        </Pressable>
      )}

      {/* Angles */}
      {angles && (
        <Card style={styles.sectionCard}>
          <SectionTitle icon="compass-outline" title="Angles" />
          <AngleRow label="Ascendant" longitude={angles.ascendant} />
          <AngleRow label="Midheaven" longitude={angles.midheaven} />
          <AppText variant="caption" tone="secondary" style={styles.footnote}>
            Whole Sign houses: the sign of your Ascendant is your 1st house.
          </AppText>
        </Card>
      )}

      {/* Placements */}
      <Card style={styles.sectionCard}>
        <SectionTitle icon="planet-outline" title="Placements" />
        {placements.map((p, i) => (
          <PlacementRow key={p.body} placement={p} last={i === placements.length - 1} />
        ))}
      </Card>

      {/* Aspects */}
      <Card style={styles.sectionCard}>
        <SectionTitle icon="git-compare-outline" title="Aspects" subtitle="Tightest first" />
        {aspects.length === 0 && (
          <AppText variant="body" tone="secondary">No major aspects within orb.</AppText>
        )}
        {aspects.slice(0, 10).map((a, i) => (
          <AspectRow key={`${a.a}-${a.b}`} aspect={a} last={i === Math.min(aspects.length, 10) - 1} />
        ))}
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
          Calculated for {input.utc.replace('T', ' ').slice(0, 16)} UTC ({input.timeZone}
          {input.approximateZone ? ', approximate' : ''}) at {Math.abs(input.latitude).toFixed(2)}°{input.latitude >= 0 ? 'N' : 'S'},{' '}
          {Math.abs(input.longitude).toFixed(2)}°{input.longitude >= 0 ? 'E' : 'W'}. Tropical zodiac, Whole Sign houses.
        </AppText>
        <Pressable onPress={onRecalculate} style={styles.linkRow} accessibilityRole="button">
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          <AppText variant="label" style={{ color: colors.primary, marginLeft: 6 }}>Recalculate</AppText>
        </Pressable>
      </View>
    </>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function BigThreeCard({ label, sign, degree }: { label: string; sign: ZodiacSign | null; degree: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.bigThreeCard}>
      <Text style={[styles.bigGlyph, { color: sign ? colors.primary : colors.textMuted }]}>
        {sign ? SIGN_META[sign].glyph : '?'}
      </Text>
      <AppText variant="overline" tone="secondary">{label}</AppText>
      <AppText variant="heading" style={styles.center}>{sign ?? '—'}</AppText>
      <AppText variant="caption" tone="secondary">{degree}</AppText>
    </Card>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle?: string }) {
  return (
    <View style={[styles.row, styles.sectionTitle]}>
      <IconBubble name={icon} tone="primary" />
      <View style={styles.rowText}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText variant="caption" tone="secondary">{subtitle}</AppText> : null}
      </View>
    </View>
  );
}

function AngleRow({ label, longitude }: { label: string; longitude: number }) {
  const { colors } = useTheme();
  const sign = signOf(longitude);
  return (
    <View style={[styles.row, styles.lineRow, { borderTopColor: colors.border }]}>
      <AppText variant="label" style={styles.grow}>{label}</AppText>
      <Text style={[styles.smallGlyph, { color: colors.primary }]}>{SIGN_META[sign].glyph}</Text>
      <AppText variant="body">{sign} {formatDegree(longitude)}</AppText>
    </View>
  );
}

function PlacementRow({ placement: p, last }: { placement: Placement; last: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, styles.lineRow, { borderTopColor: colors.border }, last && styles.lastRow]}>
      <View style={[styles.glyphBubble, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.smallGlyph, { color: colors.primary }]}>{BODY_META[p.body].glyph}</Text>
      </View>
      <View style={styles.rowText}>
        <AppText variant="label">
          {p.body}{p.retrograde && p.body !== 'North Node' ? '  ℞' : ''}
        </AppText>
        <AppText variant="caption" tone="secondary">{BODY_META[p.body].blurb}</AppText>
      </View>
      <View style={styles.placementRight}>
        <AppText variant="body">{SIGN_META[p.sign].glyph} {p.sign}</AppText>
        <AppText variant="caption" tone="secondary">
          {formatDegree(p.longitude)}{p.house ? `  ·  House ${p.house}` : ''}
        </AppText>
      </View>
    </View>
  );
}

function AspectRow({ aspect: a, last }: { aspect: Aspect; last: boolean }) {
  const { colors } = useTheme();
  const tone = a.type === 'square' || a.type === 'opposition' ? colors.primary : colors.accent;
  return (
    <View style={[styles.row, styles.lineRow, { borderTopColor: colors.border }, last && styles.lastRow]}>
      <Text style={[styles.smallGlyph, { color: tone, width: 28 }]}>{ASPECT_GLYPH[a.type]}</Text>
      <AppText variant="body" style={styles.grow}>
        {a.a} <AppText variant="body" tone="secondary">{a.type}</AppText> {a.b}
      </AppText>
      <AppText variant="caption" tone="secondary">{a.orb.toFixed(1)}° orb</AppText>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  para: { marginTop: 4 },
  cta: { marginTop: spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  center: { textAlign: 'center' },
  grow: { flex: 1 },

  bigThreeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  bigThreeCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: 4 },
  bigGlyph: { fontSize: 34, lineHeight: 40, marginBottom: 2 },

  noticeCard: { marginBottom: spacing.md },
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1, marginLeft: spacing.md },
  lineRow: { paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  lastRow: { paddingBottom: 0 },
  glyphBubble: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  smallGlyph: { fontSize: 18, marginRight: spacing.sm },
  placementRight: { alignItems: 'flex-end' },
  footnote: { marginTop: spacing.sm },

  footer: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
