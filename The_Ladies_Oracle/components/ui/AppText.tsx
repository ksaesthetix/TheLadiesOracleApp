import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'danger'
  | 'onPrimary';

export type AppTextProps = TextProps & {
  /** Type scale step from constants/theme.ts */
  variant?: TypographyVariant;
  /** Semantic colour */
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
};

/**
 * Themed text. Picks the font, size and colour from the design tokens so
 * screens never hard-code typography.
 */
export function AppText({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();

  const color = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    primary: colors.primary,
    accent: colors.accentStrong,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
  }[tone];

  return (
    <Text
      {...rest}
      style={[typography[variant], { color }, align ? { textAlign: align } : null, style]}
    />
  );
}
