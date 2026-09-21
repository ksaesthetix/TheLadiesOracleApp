import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppText, Card } from './ui';
import { spacing } from '../constants/theme';
import { luckyColour, luckyColourGlyph } from '../lib/astrology/luckyColour';

/** Today's lucky colour, from the Moon's sign. Drop it anywhere: <LuckyColourCard /> */
export function LuckyColourCard({ style }: { style?: any }) {
  const c = useMemo(() => luckyColour(), [new Date().toDateString()]);
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: c.hex }]}>
          <Text style={[styles.glyph, { color: c.onHex }]}>{luckyColourGlyph(c)}</Text>
        </View>
        <View style={styles.text}>
          <AppText variant="overline" tone="accent">Lucky colour of the day</AppText>
          <AppText variant="heading">{c.name}</AppText>
          <AppText variant="caption" tone="secondary">Moon in {c.moonSign}</AppText>
        </View>
      </View>
      <AppText variant="body" tone="secondary" style={styles.line}>{c.line}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 24 },
  text: { flex: 1, marginLeft: spacing.md },
  line: { marginTop: spacing.sm },
});

export default LuckyColourCard;
