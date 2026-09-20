import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { buttonShadow, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a spinner in place of the label */
  loading?: boolean;
  /** Stretch to the container width (default) or hug the label */
  fullWidth?: boolean;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const HEIGHTS: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 58 };

/**
 * Pill button with five visual variants. Works as a plain `onPress` button or
 * as the child of `<Link asChild>` (it forwards refs and spreads press props).
 */
export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = true,
    icon,
    style,
    textStyle,
    disabled,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const { colors } = theme;

  const palette = {
    primary: {
      bg: colors.primary,
      bgPressed: colors.primaryPressed,
      text: colors.onPrimary,
      border: 'transparent',
    },
    secondary: {
      bg: colors.primarySoft,
      bgPressed: colors.surfaceMuted,
      text: colors.primary,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      bgPressed: colors.primarySoft,
      text: colors.primary,
      border: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      bgPressed: colors.surfaceAlt,
      text: colors.textSecondary,
      border: 'transparent',
    },
    danger: {
      bg: colors.dangerSoft,
      bgPressed: colors.dangerSoft,
      text: colors.danger,
      border: 'transparent',
    },
  }[variant];

  const isDisabled = Boolean(disabled) || loading;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHTS[size],
          paddingHorizontal: size === 'sm' ? spacing.lg : spacing.xxl,
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          alignSelf: fullWidth ? 'stretch' : 'center',
          opacity: isDisabled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'primary' && buttonShadow(theme),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <AppText
            variant="button"
            style={[{ color: palette.text }, size === 'sm' && styles.smallLabel, textStyle]}
            numberOfLines={1}
          >
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  smallLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
});
