import type { TextStyle } from 'react-native';

/**
 * Design tokens for The Ladies' Oracle.
 *
 * Everything visual (colours, type, spacing, radii) lives here so the whole app
 * reads from one place. Light and dark palettes share the same shape, and the
 * `useTheme` hook picks the right one from the device appearance setting.
 */

// ---------------------------------------------------------------------------
// Fonts (loaded in app/_layout.tsx via @expo-google-fonts)
// ---------------------------------------------------------------------------
export const fonts = {
  serif: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

// ---------------------------------------------------------------------------
// Layout scales
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  display: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 42, letterSpacing: -0.4 },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 26, lineHeight: 33 },
  heading: { fontFamily: fonts.serifSemiBold, fontSize: 20, lineHeight: 27 },
  quote: { fontFamily: fonts.serifItalic, fontSize: 23, lineHeight: 34 },
  subtitle: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
export type ThemeColors = {
  /** Page background */
  background: string;
  /** Cards, sheets, tab bar */
  surface: string;
  /** Inputs, chips, subtle fills */
  surfaceAlt: string;
  /** Slightly stronger fill (pressed states, badges) */
  surfaceMuted: string;

  /** Brand burgundy */
  primary: string;
  primaryPressed: string;
  /** Tinted fill used behind primary-coloured text/icons */
  primarySoft: string;
  onPrimary: string;

  /** Brand gold */
  accent: string;
  accentSoft: string;
  /** Gold that passes contrast as text */
  accentStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  border: string;
  borderStrong: string;

  danger: string;
  dangerSoft: string;
  success: string;

  overlay: string;
  shadow: string;

  /** Background plate behind the logo (transparent in light, cream in dark) */
  logoPlate: string;
  /** Decorative background glows */
  glowPrimary: string;
  glowAccent: string;

  tabBar: string;
  tabBarBorder: string;
  headerBackground: string;
  inputBackground: string;
  switchTrackOff: string;
  switchThumb: string;
};

export const lightColors: ThemeColors = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EDE4',
  surfaceMuted: '#ECE2D6',

  primary: '#7B1E2E',
  primaryPressed: '#611523',
  primarySoft: '#F6E6E9',
  onPrimary: '#FFFFFF',

  accent: '#C9A86A',
  accentSoft: '#F7EFDF',
  accentStrong: '#8F6E30',

  text: '#2B1A1E',
  textSecondary: '#6B585C',
  textMuted: '#9A8A8E',

  border: '#EADFD4',
  borderStrong: '#D9CBBE',

  danger: '#B4372A',
  dangerSoft: '#FBE9E6',
  success: '#3F7D5B',

  overlay: 'rgba(43, 26, 30, 0.45)',
  shadow: '#3A2026',

  logoPlate: 'transparent',
  glowPrimary: 'rgba(123, 30, 46, 0.07)',
  glowAccent: 'rgba(201, 168, 106, 0.18)',

  tabBar: '#FFFFFF',
  tabBarBorder: '#EADFD4',
  headerBackground: '#FBF7F2',
  inputBackground: '#FFFFFF',
  switchTrackOff: '#D9CBBE',
  switchThumb: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#171015',
  surface: '#221820',
  surfaceAlt: '#2C2028',
  surfaceMuted: '#37282F',

  primary: '#A83448',
  primaryPressed: '#8E2B3C',
  primarySoft: '#3A2129',
  onPrimary: '#FFFFFF',

  accent: '#D8B878',
  accentSoft: '#3A3122',
  accentStrong: '#E3C88F',

  text: '#F6EEE9',
  textSecondary: '#C6B5BA',
  textMuted: '#8E7D83',

  border: '#382A31',
  borderStrong: '#4A3A42',

  danger: '#E0776B',
  dangerSoft: '#3C2220',
  success: '#7DBF98',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',

  logoPlate: '#F6EEE9',
  glowPrimary: 'rgba(168, 52, 72, 0.18)',
  glowAccent: 'rgba(216, 184, 120, 0.10)',

  tabBar: '#1E151C',
  tabBarBorder: '#382A31',
  headerBackground: '#171015',
  inputBackground: '#2C2028',
  switchTrackOff: '#4A3A42',
  switchThumb: '#F6EEE9',
};

// ---------------------------------------------------------------------------
// Theme object
// ---------------------------------------------------------------------------
export type Theme = {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fonts: typeof fonts;
};

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  spacing,
  radius,
  typography,
  fonts,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  spacing,
  radius,
  typography,
  fonts,
};

/** Soft card shadow. Skipped in dark mode where elevation would wash surfaces out. */
export function cardShadow(theme: Theme) {
  if (theme.dark) return {};
  return {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  } as const;
}

/** Slightly deeper, brand-tinted shadow for the primary call to action. */
export function buttonShadow(theme: Theme) {
  if (theme.dark) return {};
  return {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  } as const;
}
