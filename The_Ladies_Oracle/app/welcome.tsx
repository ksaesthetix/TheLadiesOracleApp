import React, { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, IconBubble, Logo, Screen } from '../components/ui';
import { spacing } from '../constants/theme';
import { GUIDE, WALKTHROUGH_IDS, IoniconName } from '../constants/guide';
import { useTheme } from '../hooks/useTheme';
import { useOnboarding } from '../hooks/useOnboarding';
import { useOnboardingFlow } from '../lib/onboarding';

/**
 * /welcome — the first-launch walkthrough. Home pushes it once (useOnboarding);
 * Settings → "Replay the intro" pushes it again. Register in the root Stack as
 *   <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
 */
type Slide = { id: string; icon?: IoniconName; eyebrow: string; title: string; text: string };

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome',
    title: 'The Ladies’ Oracle',
    text: 'A parlour oracle with a modern mind. Ask it a question, read the sky you were born under, and see what today’s sky is saying to you.',
  },
  ...WALKTHROUGH_IDS.map(id => {
    const s = GUIDE.find(g => g.id === id)!;
    return { id: s.id, icon: s.icon, eyebrow: s.title, title: s.title, text: s.tagline };
  }),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { markSeen } = useOnboarding();
  const { goNext } = useOnboardingFlow('/welcome'); // after sign-up → Home; otherwise → back
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  // Seen the moment it opens, so a dismissed walkthrough doesn't come back next launch.
  useEffect(() => { markSeen(); }, [markSeen]);

  const finish = goNext;
  const next = () => {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false} decor>
      <View style={styles.topBar}>
        <Button title="Skip" variant="ghost" size="sm" fullWidth={false} onPress={finish} />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={s => s.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={[styles.slide, { width }]}>
            {item.icon ? (
              <IconBubble name={item.icon} tone="primary" size={88} />
            ) : (
              <Logo width={180} />
            )}
            <AppText variant="overline" tone="accent" align="center" style={styles.eyebrow}>
              {item.icon ? `${i} of ${SLIDES.length - 1}` : item.eyebrow}
            </AppText>
            <AppText variant={item.icon ? 'title' : 'display'} align="center">{item.title}</AppText>
            <AppText variant="body" tone="secondary" align="center" style={styles.text}>{item.text}</AppText>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button title={last ? 'Begin' : 'Next'} onPress={next} style={styles.cta} />
        {last && (
          <AppText variant="caption" tone="muted" align="center" style={styles.replayHint}>
            You can replay this any time from You → Settings.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxl },
  eyebrow: { marginTop: spacing.xl, marginBottom: spacing.xs },
  text: { marginTop: spacing.md, maxWidth: 320, lineHeight: 24 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { width: 22 },
  cta: { alignSelf: 'stretch' },
  replayHint: { marginTop: spacing.md },
});
