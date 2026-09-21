import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../../../components/ui';
import { BackBar } from '../../../components/BackBar';
import { spacing } from '../../../constants/theme';
import { FAQ, GUIDE } from '../../../constants/guide';
import { useTheme } from '../../../hooks/useTheme';

const SITE_URL = 'https://theladiesoracle.com/';

/** /profile/guide — "How it works": one card per feature, a Good-to-know list, and Replay the intro. */
export default function GuideScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Settings" />
      <PageHeader
        eyebrow="Help"
        title="How it works"
        subtitle="Everything the Oracle can do, and how to get the most from it."
      />

      <Button
        title="Replay the intro"
        variant="outline"
        icon={<Ionicons name="play-outline" size={18} color={colors.primary} />}
        onPress={() => router.push('/welcome')}
        style={styles.replay}
      />

      {GUIDE.map(s => (
        <Card key={s.id} style={styles.section}>
          <View style={styles.head}>
            <IconBubble name={s.icon} tone="primary" />
            <AppText variant="heading" style={styles.headText}>{s.title}</AppText>
          </View>
          <AppText variant="body" tone="secondary" style={styles.body}>{s.body}</AppText>

          {s.steps && (
            <View style={styles.steps}>
              {s.steps.map((step, i) => (
                <View key={step} style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                    <AppText variant="caption" tone="primary">{i + 1}</AppText>
                  </View>
                  <AppText variant="body" style={styles.stepText}>{step}</AppText>
                </View>
              ))}
            </View>
          )}

          {s.route && (
            <Button
              title={s.cta ?? 'Open'}
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => router.push(s.route!)}
              style={styles.open}
            />
          )}
        </Card>
      ))}

      <Card tone="alt" style={styles.section}>
        <View style={styles.head}>
          <IconBubble name="help-circle-outline" tone="accent" />
          <AppText variant="heading" style={styles.headText}>Good to know</AppText>
        </View>
        {FAQ.map((f, i) => (
          <View key={f.q} style={[styles.faq, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <AppText variant="label">{f.q}</AppText>
            <AppText variant="body" tone="secondary" style={styles.faqAnswer}>{f.a}</AppText>
          </View>
        ))}
      </Card>

      <AppText variant="caption" tone="muted" align="center" style={styles.footer}>
        For reflection, not prediction.{' '}
        <AppText variant="caption" tone="primary" onPress={() => Linking.openURL(SITE_URL)}>theladiesoracle.com</AppText>
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  replay: { marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  headText: { flex: 1, marginLeft: spacing.md },
  body: { lineHeight: 24 },
  steps: { marginTop: spacing.md },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm, marginTop: 1 },
  stepText: { flex: 1, lineHeight: 22 },
  open: { marginTop: spacing.md, alignSelf: 'flex-start' },
  faq: { paddingVertical: spacing.sm },
  faqAnswer: { marginTop: spacing.xs, lineHeight: 22 },
  footer: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
