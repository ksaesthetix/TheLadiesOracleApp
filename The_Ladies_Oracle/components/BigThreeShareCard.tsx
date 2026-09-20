import React, { useRef, useState } from 'react';
import { Alert, Image, Platform, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { AppText, Button } from './ui';
import { spacing } from '../constants/theme';
import { NatalChart, SIGN_META, ZodiacSign, formatDegree } from '../lib/astrology/natal';

/**
 * A 9:16 "My Big Three" card for Instagram stories, drawn with the light palette
 * regardless of the device theme so the export always looks the same, plus a Share
 * button that rasterises it at 1080×1920 and opens the system share sheet.
 *
 * Text uses AppText so the brand fonts come from the theme; colours are overridden
 * per element because the card must not follow dark mode.
 *
 * Usage (inside the Chart screen, once the chart is ready):
 *   <BigThreeShareCard chart={chart} name={displayName} />
 */

// Fixed light palette — the export must not follow dark mode.
const P = {
  bg: '#FBF7F2',
  plate: '#F6EEE9',
  surfaceAlt: '#F4EDE4',
  primary: '#7B1E2E',
  accent: '#C9A86A',
  accentStrong: '#8F6E30',
  text: '#2B1A1E',
  textSecondary: '#6B585C',
  textMuted: '#9A8A8E',
  border: '#EADFD4',
};

const LOGO = require('../assets/images/The_Ladies_Oracle_Logo_mark.png');

type Props = {
  chart: NatalChart;
  /** Shown under the title, e.g. the user's first name. Optional. */
  name?: string | null;
};

export function BigThreeShareCard({ chart, name }: Props) {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  // Fit the card to the screen; capture upscales to 1080×1920 regardless.
  const width = Math.min(300, screenWidth - spacing.xl * 2);
  const height = Math.round((width * 16) / 9);
  const s = width / 300; // scale factor for type sizes

  const sun = chart.placements.find(p => p.body === 'Sun')!;
  const moon = chart.placements.find(p => p.body === 'Moon')!;
  const rows: { label: string; sign: ZodiacSign | null; detail: string }[] = [
    { label: 'Sun', sign: chart.bigThree.sun, detail: formatDegree(sun.longitude) },
    { label: 'Moon', sign: chart.bigThree.moon, detail: chart.bigThree.moonSignUncertain ? 'birth time unknown' : formatDegree(moon.longitude) },
    { label: 'Rising', sign: chart.bigThree.rising, detail: chart.angles ? formatDegree(chart.angles.ascendant) : 'birth time unknown' },
  ];

  const share = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080,
        height: 1920,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Big Three', UTI: 'public.png' });
      } else {
        await Share.share(Platform.OS === 'ios' ? { url: uri } : { message: uri });
      }
    } catch (err: any) {
      console.error('[BigThreeShareCard]', err);
      Alert.alert("Couldn't create the image", err?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {/* The card itself — everything inside is what gets exported. */}
      <View
        ref={cardRef}
        collapsable={false}
        style={[styles.card, { width, height, borderRadius: 24 * s }]}
      >
        {/* Decorative circles, echoing the app's `decor` background */}
        <View style={[styles.circle, { width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45, top: -width * 0.35, right: -width * 0.3, backgroundColor: P.plate }]} />
        <View style={[styles.circle, { width: width * 1.1, height: width * 1.1, borderRadius: width * 0.55, bottom: -width * 0.55, left: -width * 0.4, backgroundColor: P.surfaceAlt }]} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: 34 * s }]}>
          <View style={[styles.logoPlate, { width: 84 * s, height: 64 * s, borderRadius: 18 * s }]}>
            <Image source={LOGO} style={{ width: 68 * s, height: 50 * s }} resizeMode="contain" />
          </View>
          <AppText variant="overline" style={[styles.overline, { fontSize: 11 * s, marginTop: 18 * s }]}>My Big Three</AppText>
          {name ? <AppText variant="title" style={[styles.name, { fontSize: 22 * s, lineHeight: 28 * s }]}>{name}</AppText> : null}
        </View>

        {/* The three placements */}
        <View style={[styles.rows, { paddingHorizontal: 26 * s }]}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.rowItem, i > 0 && { borderTopWidth: 1, borderTopColor: P.border }, { paddingVertical: 16 * s }]}>
              <Text style={[styles.glyph, { fontSize: 40 * s, width: 56 * s, color: r.sign ? P.primary : P.textMuted }]}>
                {r.sign ? SIGN_META[r.sign].glyph : '?'}
              </Text>
              <View style={{ flex: 1 }}>
                <AppText variant="overline" style={[styles.rowLabel, { fontSize: 11 * s }]}>{r.label}</AppText>
                <AppText variant="title" style={[styles.rowSign, { fontSize: 24 * s, lineHeight: 30 * s }]}>{r.sign ?? 'Unknown'}</AppText>
                <AppText variant="caption" style={[styles.rowDetail, { fontSize: 12 * s }]}>{r.detail}</AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: 26 * s }]}>
          <View style={[styles.rule, { width: 40 * s, marginBottom: 12 * s }]} />
          <AppText variant="heading" style={[styles.brand, { fontSize: 15 * s, lineHeight: 20 * s }]}>The Ladies' Oracle</AppText>
          <AppText variant="caption" style={[styles.tagline, { fontSize: 10 * s }]}>What does the sky say about you?</AppText>
        </View>
      </View>

      <Button title={busy ? 'Preparing…' : 'Share your Big Three'} onPress={share} style={styles.button} />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Exports a 1080×1920 image — made for Instagram stories.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: P.bg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.border,
  },
  circle: { position: 'absolute' },
  header: { alignItems: 'center' },
  logoPlate: { backgroundColor: P.plate, alignItems: 'center', justifyContent: 'center' },
  overline: { color: P.accentStrong },
  name: { color: P.text, marginTop: 4 },
  rows: {},
  rowItem: { flexDirection: 'row', alignItems: 'center' },
  glyph: { textAlign: 'center' },
  rowLabel: { color: P.textSecondary },
  rowSign: { color: P.text, marginTop: 2 },
  rowDetail: { color: P.textMuted, marginTop: 2 },
  footer: { alignItems: 'center' },
  rule: { height: 2, backgroundColor: P.accent, borderRadius: 1 },
  brand: { color: P.primary },
  tagline: { color: P.textSecondary, marginTop: 2 },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
  hint: { marginTop: spacing.sm, textAlign: 'center' },
});

export default BigThreeShareCard;
