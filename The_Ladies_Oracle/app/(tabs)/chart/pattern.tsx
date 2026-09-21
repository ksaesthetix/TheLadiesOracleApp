import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, IconBubble, LoadingView, PageHeader, Screen } from '../../../components/ui';
import { BackBar } from '../../../components/BackBar';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { usePattern } from '../../../hooks/usePattern';

/**
 * /chart/pattern — "Your Pattern": Foundation · Development · Relationships · Your edge.
 * Reached from the teaser card on the Chart screen; lives in the Chart tab's stack.
 */
const SECTION_ICON: Record<string, React.ComponentProps<typeof IconBubble>['name']> = {
  foundation: 'planet-outline',
  development: 'trending-up-outline',
  relationships: 'heart-outline',
  edge: 'flash-outline',
};

export default function PatternScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const state = usePattern();

  if (state.status === 'loading') return <LoadingView message="Reading your pattern…" />;

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Chart" />
      <PageHeader
        eyebrow="Your pattern"
        title={state.status === 'ready' ? state.pattern.essence : 'Who you are, in your own sky'}
        subtitle={state.status === 'ready' ? 'Written from your birth chart' : undefined}
        align="center"
      />

      {state.status === 'signed-out' && (
        <Card>
          <AppText variant="heading">Log in to read your pattern</AppText>
          <Button title="Log in" onPress={() => router.replace('/login')} style={styles.cta} />
        </Card>
      )}
      {state.status === 'needs-chart' && (
        <Card>
          <AppText variant="heading">Your chart comes first</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>Add your birth details and your pattern is written from them.</AppText>
          <Button title="Set up your chart" onPress={() => router.push('/chart')} style={styles.cta} />
        </Card>
      )}
      {state.status === 'error' && (
        <Card>
          <AppText variant="heading">Couldn't read your pattern</AppText>
          <AppText variant="body" tone="secondary" style={styles.para}>{state.message}</AppText>
        </Card>
      )}

      {state.status === 'ready' && (
        <>
          {state.refining && (
            <View style={styles.refining}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <AppText variant="caption" tone="muted" style={styles.refiningText}>
                The full reading is being written — this can take a minute the first time.
              </AppText>
            </View>
          )}

          {state.pattern.sections.map((s, i) => (
            <Card key={s.id} style={styles.section} tone={i === 0 ? 'primary' : undefined}>
              <View style={styles.sectionHead}>
                <IconBubble name={SECTION_ICON[s.id] ?? 'sparkles-outline'} tone={i === 0 ? 'onPrimary' : 'primary'} />
                <View style={styles.sectionHeadText}>
                  <AppText variant="heading" tone={i === 0 ? 'onPrimary' : undefined}>{s.title}</AppText>
                  {s.placements.length > 0 && (
                    <AppText variant="caption" tone={i === 0 ? 'onPrimary' : 'secondary'} style={i === 0 && styles.dim}>
                      {s.placements.join(' · ')}
                    </AppText>
                  )}
                </View>
              </View>
              <AppText variant="body" tone={i === 0 ? 'onPrimary' : undefined} style={styles.body}>{s.body}</AppText>
            </Card>
          ))}

          <AppText variant="caption" tone="muted" style={styles.footer}>
            {state.source === 'local'
              ? 'Placement by placement, from your chart on this device. The written reading arrives when the server is reachable.'
              : 'Written for your chart. It is regenerated only if your birth details change.'}
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  para: { marginTop: spacing.xs },
  cta: { marginTop: spacing.md },
  refining: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  refiningText: { marginLeft: spacing.sm },
  section: { marginBottom: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionHeadText: { flex: 1, marginLeft: spacing.md },
  dim: { opacity: 0.85 },
  body: { lineHeight: 24 },
  footer: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
});
