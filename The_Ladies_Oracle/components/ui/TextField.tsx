import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label?: string;
  /** Ionicons glyph shown at the left of the field */
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Rounded, filled text input with optional label, leading icon and error text.
 * All TextInput props pass straight through, so existing `value` /
 * `onChangeText` / `secureTextEntry` / `maxLength` wiring is untouched.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, error, containerStyle, style, placeholderTextColor, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" tone="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBackground,
            borderColor,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderTextColor ?? colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }, style]}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    paddingVertical: 0,
  },
  error: {
    marginTop: spacing.xs + 2,
  },
});
