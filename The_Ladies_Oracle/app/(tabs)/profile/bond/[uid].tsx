import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Avatar, Button, Card, IconBubble, LoadingView, PageHeader, Screen } from '../../../../components/ui';
import { BackBar } from '../../../../components/BackBar';
import { spacing } from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import { useBond, useShareChart } from '../../../../hooks/useBond';
import { BOND_AREA_META, Bond, CrossAspect } from '../../../../lib/astrology/synastry';
import { BODY_META } from '../../../../lib/astrology/natal';
import { useNatalChart } from '../../../../hooks/useNatalChart';
import { auth } from '../../../../firebaseConfig';

/**
 * /profile/bond/[uid] — the bond between you and a friend. Reached from a row on the
 * Friends page; lives in the You tab's stack so the tab bar stays.
 */

const ASPECT_GLYPH: Record<CrossAspect['type'], string> = {
  conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍',
};

export default function BondScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { state } = useBond(uid);
  const { shareChart, setSharing } = useShareChart();
  const { state: mine } = useNatalChart();
  const me = auth.currentUser;

  if (state.status === 'loading') return <LoadingView message="Reading the two charts together…" />;

  const friend = 'friend' in state ? state.friend : null;

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Friends" />

      {/* Two avatars */}
      <View style={styles.pair}>
        <Avatar uri={me?.photoURL ?? null} name={me?.displayName || me?.email || 'You'} size={72} />
        <Text style={[styles.pairGlyph, { color: colors.accent }]}>✦</Text>
        <Avatar uri={friend?.photoURL ?? null} name={friend?.name || '?'} size={72} />
      </View>
      <PageHeader
        eyebrow="Bond"
        title={friend ? `You & ${friend.name.split(' ')[0]}` : 'Your bond'}
        subtitle={state.status === 'ready' ? state.bond.text.headline : undefined}
        align="center"
      />

      {state.status === 'signed-out' && (
        <Card>
          <AppText variant="heading">Log in to see your bonds</AppText>
          <Button title="Log in" onPress={() => router.replace('/login')} style={styles.cta} />
        </Card>
      )}

      {state.status === 'my-chart-missing' && (
        <Card>
          <AppText variant="heading">Your chart comes first</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>A bond compares two charts, and yours isn't set up yet.</AppText>
          <Button title="Set up your chart" onPress={() => router.push('/chart')} style={styles.cta} />
        </Card>
      )}

      {state.status === 'my-sharing-off' && (
        <Card>
          <AppText variant="heading">Share your chart to see bonds</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>
            Bonds go both ways: turn on sharing so friends can see their bond with you, and you'll see yours with them.
          </AppText>
          <View style={styles.switchRow}>
            <AppText variant="label" style={styles.grow}>Share my chart with friends</AppText>
            <Switch
              value={!!shareChart}
              onValueChange={setSharing}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={colors.switchThumb}
              ios_backgroundColor={colors.switchTrackOff}
            />
          </View>
        </Card>
      )}

      {state.status === 'their-chart-missing' && (
        <Card tone="alt">
          <AppText variant="heading">{state.friend.name.split(' ')[0]} hasn't set up a chart yet</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>Once they add their birth details, their bond with you appears here.</AppText>
        </Card>
      )}

      {state.status === 'their-sharing-off' && (
        <Card tone="alt">
          <AppText variant="heading">{state.friend.name.split(' ')[0]} keeps their chart private</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>
            They can turn on "Share my chart with friends" in Settings, and this page will fill in.
          </AppText>
        </Card>
      )}

      {state.status === 'error' && (
        <Card>
          <AppText variant="heading">Couldn't read this bond</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>{state.message}</AppText>
        </Card>
      )}

      {state.status === 'ready' && mine.status === 'ready' && (
        <BondBody bond={state.bond} friendName={state.friend.name.split(' ')[0]} />
      )}
    </Screen>
  );
}

function BondBody({ bond, friendName }: { bond: Bond; friendName: string }) {
  const { colors } = useTheme();
  return (
    <>
      {/* Reading */}
      <Card tone="primary" style={styles.section}>
        <View style={styles.scoreRow}>
          <View style={styles.grow}>
            <AppText variant="overline" tone="onPrimary" style={styles.dim}>The two of you</AppText>
            <AppText variant="body" tone="onPrimary" style={styles.reading}>{bond.text.reading}</AppText>
          </View>
        </View>
        <View style={[styles.scoreStrip, { borderTopColor: 'rgba(255,255,255,0.25)' }]}>
          <View style={styles.scoreItem}>
            <AppText variant="title" tone="onPrimary">{bond.harmonyScore}</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.dim}>harmony</AppText>
          </View>
          <View style={styles.scoreItem}>
            <AppText variant="title" tone="onPrimary">{bond.aspects.length}</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.dim}>connections</AppText>
          </View>
          <View style={styles.scoreItem}>
            <AppText variant="title" tone="onPrimary">{bond.elements.mine[0]}+{bond.elements.theirs[0]}</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.dim}>{bond.elements.mine} · {bond.elements.theirs}</AppText>
          </View>
        </View>
      </Card>

      {/* Areas */}
      <Card style={styles.section}>
        <SectionTitle icon="pulse-outline" title="Where it lives" subtitle="Harmony in gold, friction in burgundy" />
        {bond.areas.map((a, i) => (
          <View key={a.area} style={[styles.areaRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.areaHead}>
              <AppText variant="label">{BOND_AREA_META[a.area].title}</AppText>
              <AppText variant="caption" tone="secondary">{BOND_AREA_META[a.area].blurb}</AppText>
            </View>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              {a.intensity > 0 && (
                <View style={[styles.split, { width: `${Math.max(6, a.intensity)}%` }]}>
                  <View style={{ flex: Math.max(0.0001, (1 + a.balance) / 2), backgroundColor: colors.accent }} />
                  <View style={{ flex: Math.max(0.0001, (1 - a.balance) / 2), backgroundColor: colors.primary }} />
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>

      {/* Strengths / watch-outs */}
      {(bond.text.strengths.length > 0 || bond.text.watchOuts.length > 0) && (
        <Card style={styles.section}>
          {bond.text.strengths.length > 0 && (
            <View style={styles.listBlock}>
              <View style={styles.listHead}>
                <IconBubble name="sparkles-outline" tone="accent" />
                <AppText variant="heading" style={styles.listTitle}>What comes easily</AppText>
              </View>
              {bond.text.strengths.map(s => <AppText key={s} variant="body" tone="secondary" style={styles.listItem}>· {s.replace(/^Your /, 'Your ').replace(' their ', ` ${friendName}’s `)}</AppText>)}
            </View>
          )}
          {bond.text.watchOuts.length > 0 && (
            <View style={[styles.listBlock, bond.text.strengths.length > 0 && styles.listBlockSpaced]}>
              <View style={styles.listHead}>
                <IconBubble name="flame-outline" tone="primary" />
                <AppText variant="heading" style={styles.listTitle}>Where you rub</AppText>
              </View>
              {bond.text.watchOuts.map(s => <AppText key={s} variant="body" tone="secondary" style={styles.listItem}>· {s.replace(' their ', ` ${friendName}’s `)}</AppText>)}
            </View>
          )}
        </Card>
      )}

      {/* Overlays */}
      {bond.overlays.length > 0 && (
        <Card style={styles.section}>
          <SectionTitle icon="home-outline" title={`${friendName} in your houses`} subtitle="Where their planets land in your chart" />
          <View style={styles.overlayWrap}>
            {bond.overlays.map(o => (
              <View key={o.theirs} style={[styles.overlayChip, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
                <Text style={[styles.overlayGlyph, { color: colors.primary }]}>{BODY_META[o.theirs].glyph}</Text>
                <AppText variant="caption">{o.theirs} · H{o.house}</AppText>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Aspects */}
      <Card style={styles.section}>
        <SectionTitle icon="git-compare-outline" title="Cross-aspects" subtitle="Strongest first" />
        {bond.aspects.slice(0, 10).map((x, i) => {
          const tone = x.quality === 'harmony' ? colors.accent : x.quality === 'tension' ? colors.primary : colors.textSecondary;
          const glyph = (p: CrossAspect['mine']) => p === 'Ascendant' ? 'AC' : p === 'Midheaven' ? 'MC' : BODY_META[p].glyph;
          return (
            <View key={`${x.mine}-${x.theirs}-${x.type}`} style={[styles.aspectRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.aspectGlyphs, { color: colors.primary }]}>
                {glyph(x.mine)} <Text style={{ color: tone }}>{ASPECT_GLYPH[x.type]}</Text> {glyph(x.theirs)}
              </Text>
              <View style={styles.grow}>
                <AppText variant="label">{x.label.replace(' their ', ` ${friendName}’s `)}</AppText>
                <AppText variant="caption" tone="secondary">{x.orb.toFixed(1)}° · {x.areas.map(a => BOND_AREA_META[a].title).join(', ')}</AppText>
              </View>
              <View style={[styles.dot, { backgroundColor: tone }]} />
            </View>
          );
        })}
      </Card>

      <AppText variant="caption" tone="muted" style={styles.footer}>
        Synastry is a texture, not a verdict: every bond has both columns.
      </AppText>
    </>
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

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  pairGlyph: { fontSize: 22, marginHorizontal: spacing.md },
  para: { marginTop: spacing.xs },
  cta: { marginTop: spacing.md },
  grow: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  scoreRow: { flexDirection: 'row' },
  dim: { opacity: 0.85 },
  reading: { marginTop: spacing.xs, opacity: 0.95 },
  scoreStrip: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  scoreItem: { alignItems: 'center' },
  areaRow: { paddingVertical: spacing.sm },
  areaHead: { marginBottom: 6 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  split: { flexDirection: 'row', height: '100%', borderRadius: 4, overflow: 'hidden' },
  listBlock: {},
  listBlockSpaced: { marginTop: spacing.lg },
  listHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  listTitle: { marginLeft: spacing.md },
  listItem: { marginTop: 4 },
  overlayWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overlayChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  overlayGlyph: { fontSize: 14 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitleText: { flex: 1, marginLeft: spacing.md },
  aspectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  aspectGlyphs: { fontSize: 18, width: 84 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
  footer: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
});
