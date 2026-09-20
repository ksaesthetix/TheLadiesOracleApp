import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { cardShadow, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type CardTone = 'surface' | 'alt' | 'primary' | 'accent';

export type CardProps = ViewProps & {
  children?: React.ReactNode;
  /** Inner padding (default on). Turn off when the card wraps list rows. */
  padded?: boolean;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
};

/**
 * Elevated surface with soft corners. `tone="primary"` gives a filled
 * brand-coloured card for featured actions.
 */
export function Card({ children, padded = true, tone = 'surface', style, ...rest }: CardProps) {
  const theme = useTheme();
  const { colors } = theme;

  const toneStyle = {
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    alt: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
    primary: { backgroundColor: colors.primary, borderColor: colors.primary },
    accent: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  }[tone];

  const shadow =
    tone === 'primary'
      ? theme.dark
        ? {}
        : {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 18,
            elevation: 5,
          }
      : cardShadow(theme);

  return (
    <View
      {...rest}
      style={[styles.card, toneStyle, shadow, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'visible',
  },
  padded: {
    padding: spacing.xl,
  },
});
