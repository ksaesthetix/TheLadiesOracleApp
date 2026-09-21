import React, { useRef, useState } from 'react';
import { Alert, Image, Platform, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { AppText, Button } from './ui';
import { spacing } from '../constants/theme';
import { DailyReadingText } from '../lib/astrology/readingText';
import { DailyFacts } from '../lib/astrology/transits';
import { SIGN_META } from '../lib/astrology/natal';
import { MOON_PHASE_GLYPH } from '../lib/astrology/sky';

/**
 * A 9:16 quote card of today's reading for Stories — headline, the reading, the Moon,
 * the date — in the fixed light palette, with a Share button (1080×1920 PNG).
 *
 *   <DailyReadingShareCard text={state.text} facts={state.facts} />
 */
const P = {
  bg: '#7B1E2E', bgDeep: '#611523', plate: '#F6EEE9', cream: '#FBF7F2',
  gold: '#C9A86A', goldSoft: '#F7EFDF', text: '#F6EEE9', textDim: 'rgba(246,238,233,0.78)', rule: 'rgba(246,238,233,0.25)',
};
const LOGO = require('../assets/images/The_Ladies_Oracle_Logo_mark.png');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function DailyReadingShareCard({ text, facts, compact = false }: { text: DailyReadingText; facts: DailyFacts; compact?: boolean }) {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(compact ? 220 : 300, screenWidth - spacing.xl * 2);
  const height = Math.round((width * 16) / 9);
  const s = width / 300;

  const [y, m, d] = facts.date.split('-').map(Number);
  const dateLabel = `${d} ${MONTHS[m - 1]} ${y}`;

  const share = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share today’s reading', UTI: 'public.png' });
      } else {
        await Share.share(Platform.OS === 'ios' ? { url: uri } : { message: uri });
      }
    } catch (err: any) {
      Alert.alert("Couldn't create the image", err?.message ?? 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.wrap}>
      <View ref={cardRef} collapsable={false} style={[styles.card, { width, height, borderRadius: 24 * s }]}>
        <View style={[styles.circle, { width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6, top: -width * 0.55, right: -width * 0.45, backgroundColor: P.bgDeep }]} />
        <View style={[styles.circle, { width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, bottom: -width * 0.4, left: -width * 0.3, backgroundColor: P.bgDeep }]} />

        <View style={[styles.top, { paddingTop: 30 * s, paddingHorizontal: 26 * s }]}>
          <AppText variant="overline" style={[styles.overline, { fontSize: 11 * s }]}>Today's reading · {dateLabel}</AppText>
          <AppText variant="title" style={[styles.headline, { fontSize: 26 * s, lineHeight: 32 * s, marginTop: 10 * s }]}>{text.headline}</AppText>
        </View>

        <View style={{ paddingHorizontal: 26 * s }}>
          <View style={[styles.rule, { width: 40 * s, marginBottom: 14 * s }]} />
          <AppText variant="quote" style={[styles.reading, { fontSize: 16 * s, lineHeight: 25 * s }]}>{text.reading}</AppText>
          <View style={[styles.doRow, { marginTop: 18 * s }]}>
            <AppText variant="caption" style={[styles.doLabel, { fontSize: 10 * s }]}>Do</AppText>
            <AppText variant="body" style={[styles.doText, { fontSize: 13 * s, lineHeight: 18 * s }]}>{text.do}</AppText>
          </View>
          <View style={[styles.doRow, { marginTop: 8 * s }]}>
            <AppText variant="caption" style={[styles.doLabel, { fontSize: 10 * s }]}>Don't</AppText>
            <AppText variant="body" style={[styles.doText, { fontSize: 13 * s, lineHeight: 18 * s }]}>{text.dont}</AppText>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: 24 * s, paddingHorizontal: 26 * s }]}>
          <View style={styles.footerRow}>
            <Text style={[styles.moon, { fontSize: 18 * s }]}>{MOON_PHASE_GLYPH[facts.moon.phase]}</Text>
            <AppText variant="caption" style={[styles.moonText, { fontSize: 11 * s }]}>
              Moon in {facts.moon.sign} {SIGN_META[facts.moon.sign].glyph}{facts.moon.house ? ` · ${facts.moon.house}${suffix(facts.moon.house)} house` : ''}
            </AppText>
          </View>
          <View style={[styles.brandRow, { marginTop: 14 * s }]}>
            <View style={[styles.logoPlate, { width: 44 * s, height: 34 * s, borderRadius: 10 * s }]}>
              <Image source={LOGO} style={{ width: 36 * s, height: 26 * s }} resizeMode="contain" />
            </View>
            <View style={{ marginLeft: 10 * s }}>
              <AppText variant="label" style={[styles.brand, { fontSize: 13 * s }]}>The Ladies' Oracle</AppText>
              <AppText variant="caption" style={[styles.tag, { fontSize: 10 * s }]}>Your sky, read daily</AppText>
            </View>
          </View>
        </View>
      </View>

      <Button title={busy ? 'Preparing…' : 'Share today’s reading'} variant="outline" onPress={share} style={styles.button} />
    </View>
  );
}

const suffix = (n: number) => { const v = n % 100; return ['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'; };

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.lg },
  card: { backgroundColor: P.bg, overflow: 'hidden', justifyContent: 'space-between' },
  circle: { position: 'absolute' },
  top: {},
  overline: { color: P.gold },
  headline: { color: P.text },
  rule: { height: 2, backgroundColor: P.gold, borderRadius: 1 },
  reading: { color: P.text },
  doRow: { flexDirection: 'row', alignItems: 'flex-start' },
  doLabel: { color: P.gold, width: 44, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  doText: { color: P.textDim, flex: 1 },
  footer: {},
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  moon: { marginRight: 8 },
  moonText: { color: P.textDim },
  brandRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: P.rule, paddingTop: 12 },
  logoPlate: { backgroundColor: P.plate, alignItems: 'center', justifyContent: 'center' },
  brand: { color: P.text },
  tag: { color: P.textDim },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
});

export default DailyReadingShareCard;
