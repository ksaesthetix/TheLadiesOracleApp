import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../constants/theme';

/**
 * Returns the active theme, following the device's light/dark appearance
 * setting (`userInterfaceStyle: "automatic"` in app.json).
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Build a StyleSheet from the current theme. The factory only re-runs when the
 * theme flips between light and dark.
 *
 * Usage:
 *   const styles = useThemedStyles((t) => ({ card: { backgroundColor: t.colors.surface } }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
