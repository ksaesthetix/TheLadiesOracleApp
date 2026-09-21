import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { AppText, Card } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AspectType, BODY_META, NatalChart, SIGNS, SIGN_META } from '../lib/astrology/natal';

/**
 * The birth chart as a wheel: twelve signs on the rim, planets at their degrees,
 * the Ascendant on the left when the birth time is known (with whole-sign house
 * numbers), and the major aspects drawn between planets in the centre.
 *
 *   <ChartWheel chart={chart} />
 *
 * Needs react-native-svg (`npx expo install react-native-svg`; included in Expo Go).
 */
export function ChartWheel({ chart, size }: { chart: NatalChart; size?: number }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const S = size ?? Math.min(340, width - spacing.xl * 2);
  const cx = S / 2, cy = S / 2;
  const rOuter = S / 2 - 2;        // rim
  const rSigns = rOuter - 26;      // inner edge of sign ring
  const rPlanets = rSigns - 22;    // planet glyph ring
  const rHouses = rPlanets - 22;   // house number ring / aspect boundary
  const rAspect = rHouses - 6;

  // Rotate so the Ascendant sits at 9 o'clock; zodiac runs anticlockwise.
  const asc = chart.angles?.ascendant ?? 0;
  const angleOf = (lon: number) => ((180 + (lon - asc)) * Math.PI) / 180;
  const pt = (lon: number, r: number) => ({ x: cx + r * Math.cos(angleOf(lon)), y: cy - r * Math.sin(angleOf(lon)) });

  const arc = (from: number, to: number, r1: number, r2: number) => {
    const a = pt(from, r2), b = pt(to, r2), c = pt(to, r1), d = pt(from, r1);
    // anticlockwise on screen (sweep-flag 0) for the outer edge, clockwise back for the inner
    return `M ${a.x} ${a.y} A ${r2} ${r2} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${r1} ${r1} 0 0 1 ${d.x} ${d.y} Z`;
  };

  // Nudge planets that sit within 7° of a neighbour onto alternating radii so glyphs don't overlap.
  const sorted = [...chart.placements].sort((a, b) => a.longitude - b.longitude);
  const radii = new Map<string, number>();
  let cluster = 0;
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    const close = prev && Math.abs(p.longitude - prev.longitude) < 7;
    cluster = close ? cluster + 1 : 0;
    radii.set(p.body, rPlanets - (cluster % 2 === 1 ? 14 : 0) - (cluster >= 2 ? 6 : 0));
  });

  const aspectColour: Record<AspectType, string> = {
    trine: colors.accent, sextile: colors.accent, square: colors.primary, opposition: colors.primary, conjunction: 'transparent',
  };

  const lonOf = (body: string) => chart.placements.find(p => p.body === body)?.longitude;

  return (
    <Card style={styles.card}>
      <View style={styles.wrap}>
        <Svg width={S} height={S}>
          {/* Sign ring */}
          <G>
            {SIGNS.map((sign, i) => (
              <Path key={sign} d={arc(i * 30, (i + 1) * 30, rSigns, rOuter)} fill={i % 2 === 0 ? colors.accentSoft : colors.surface} stroke={colors.border} strokeWidth={1} />
            ))}
            {SIGNS.map((sign, i) => {
              const p = pt(i * 30 + 15, (rOuter + rSigns) / 2);
              return (
                <SvgText key={`g-${sign}`} x={p.x} y={p.y + 5} fontSize={14} textAnchor="middle" fill={colors.primary}>
                  {SIGN_META[sign].glyph}
                </SvgText>
              );
            })}
          </G>

          {/* Rings */}
          <Circle cx={cx} cy={cy} r={rSigns} stroke={colors.border} strokeWidth={1} fill={colors.surface} />
          <Circle cx={cx} cy={cy} r={rHouses} stroke={colors.border} strokeWidth={1} fill="none" />

          {/* Whole-sign house lines + numbers (only with a birth time) */}
          {chart.houses && chart.houses.cusps.map((cusp, i) => {
            const a = pt(cusp, rHouses), b = pt(cusp, rSigns);
            const n = pt(cusp + 15, rHouses + 10);
            return (
              <G key={`h-${i}`}>
                <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.border} strokeWidth={1} />
                <SvgText x={n.x} y={n.y + 3} fontSize={9} textAnchor="middle" fill={colors.textMuted}>{i + 1}</SvgText>
              </G>
            );
          })}

          {/* Ascendant / Midheaven axes */}
          {chart.angles && (
            <G>
              <Line x1={pt(chart.angles.ascendant, rHouses).x} y1={pt(chart.angles.ascendant, rHouses).y} x2={pt(chart.angles.descendant, rHouses).x} y2={pt(chart.angles.descendant, rHouses).y} stroke={colors.primary} strokeWidth={1.5} />
              <Line x1={pt(chart.angles.midheaven, rHouses).x} y1={pt(chart.angles.midheaven, rHouses).y} x2={pt(chart.angles.imumCoeli, rHouses).x} y2={pt(chart.angles.imumCoeli, rHouses).y} stroke={colors.primary} strokeWidth={1} strokeDasharray="3 3" />
              <SvgText x={pt(chart.angles.ascendant, rSigns - 10).x - 6} y={pt(chart.angles.ascendant, rSigns - 10).y - 6} fontSize={9} fill={colors.primary}>AC</SvgText>
              <SvgText x={pt(chart.angles.midheaven, rSigns - 10).x} y={pt(chart.angles.midheaven, rSigns - 10).y + 12} fontSize={9} fill={colors.primary} textAnchor="middle">MC</SvgText>
            </G>
          )}

          {/* Aspects */}
          <G>
            {chart.aspects.map((a, i) => {
              const la = lonOf(a.a), lb = lonOf(a.b);
              if (la === undefined || lb === undefined || a.type === 'conjunction') return null;
              const p1 = pt(la, rAspect), p2 = pt(lb, rAspect);
              return <Line key={`a-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={aspectColour[a.type]} strokeWidth={a.orb < 2 ? 1.4 : 0.8} opacity={a.orb < 2 ? 0.9 : 0.5} />;
            })}
          </G>

          {/* Planets */}
          <G>
            {chart.placements.map(p => {
              const r = radii.get(p.body) ?? rPlanets;
              const g = pt(p.longitude, r);
              const tick1 = pt(p.longitude, rSigns), tick2 = pt(p.longitude, rSigns - 5);
              return (
                <G key={p.body}>
                  <Line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={colors.textSecondary} strokeWidth={1} />
                  <SvgText x={g.x} y={g.y + 5} fontSize={15} textAnchor="middle" fill={p.body === 'Sun' || p.body === 'Moon' ? colors.primary : colors.textSecondary}>
                    {BODY_META[p.body].glyph}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </View>
      <AppText variant="caption" tone="muted" align="center" style={styles.caption}>
        {chart.angles ? 'Ascendant on the left · whole-sign houses · gold aspects flow, burgundy aspects press' : 'Birth time unknown: 0° Aries on the left, no houses · gold aspects flow, burgundy aspects press'}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  wrap: { alignItems: 'center' },
  caption: { marginTop: spacing.sm },
});

export default ChartWheel;
