import { ZodiacSign, SIGN_META } from './natal';
import { computeSky } from './sky';

/**
 * Lucky colour of the day — the Moon's sign sets it (the Moon changes sign every 2–3 days,
 * so the colour does too). Deterministic: everyone sees the same colour on the same day.
 *
 *   const c = luckyColour();   // { name, hex, moonSign, line }
 */
export interface LuckyColour {
  name: string;
  hex: string;
  /** For text on top of the swatch. */
  onHex: string;
  moonSign: ZodiacSign;
  line: string;
}

const COLOURS: Record<ZodiacSign, { name: string; hex: string; onHex: string; line: string }> = {
  Aries:       { name: 'Scarlet',       hex: '#C0392B', onHex: '#FFFFFF', line: 'For courage. Wear it where you need to be seen first.' },
  Taurus:      { name: 'Moss green',    hex: '#4F7942', onHex: '#FFFFFF', line: 'For steadiness. Slow down and let good things take root.' },
  Gemini:      { name: 'Saffron',       hex: '#E8B024', onHex: '#2B1A1E', line: 'For quick wits. A day for the right word at the right moment.' },
  Cancer:      { name: 'Pearl',         hex: '#EDE6DA', onHex: '#2B1A1E', line: 'For tenderness. Keep something soft close to you.' },
  Leo:         { name: 'Gold',          hex: '#C9A86A', onHex: '#2B1A1E', line: 'For warmth. Let yourself be generous and be seen being so.' },
  Virgo:       { name: 'Sage',          hex: '#8DA290', onHex: '#2B1A1E', line: 'For clarity. Tidy one thing and the rest will follow.' },
  Libra:       { name: 'Rose',          hex: '#D98CA0', onHex: '#2B1A1E', line: 'For grace. Smooth a disagreement before it hardens.' },
  Scorpio:     { name: 'Burgundy',      hex: '#7B1E2E', onHex: '#FFFFFF', line: 'For depth. Trust what you know without being told.' },
  Sagittarius: { name: 'Royal purple',  hex: '#5E3A8C', onHex: '#FFFFFF', line: 'For luck in the wider world. Say yes to the further option.' },
  Capricorn:   { name: 'Charcoal',      hex: '#3B3B3B', onHex: '#FFFFFF', line: 'For resolve. The long way round is the quick way today.' },
  Aquarius:    { name: 'Electric blue', hex: '#2E6FD9', onHex: '#FFFFFF', line: 'For originality. The odd idea is the right one.' },
  Pisces:      { name: 'Sea green',     hex: '#3E9C9A', onHex: '#FFFFFF', line: 'For intuition. Follow the feeling, check it later.' },
};

export function luckyColour(date: Date = new Date()): LuckyColour {
  const sky = computeSky(date);
  const sign = sky.moon.sign;
  return { ...COLOURS[sign], moonSign: sign };
}

export function luckyColourGlyph(c: LuckyColour): string {
  return SIGN_META[c.moonSign].glyph;
}
