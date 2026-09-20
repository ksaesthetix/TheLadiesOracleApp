import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export type IconBubbleTone = 'primary' | 'accent' | 'neutral' | 'onPrimary';

export type IconBubbleProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  tone?: IconBubbleTone;
  style?: StyleProp<ViewStyle>;
};

/** Small tinted circle with an icon — used as a leading element in rows/cards. */
export function IconBubble({ name, size = 40, tone = 'primary', style }: IconBubbleProps) {
  const { colors } = useTheme();

  const palette = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    accent: { bg: colors.accentSoft, fg: colors.accentStrong },
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    onPrimary: { bg: 'rgba(255,255,255,0.18)', fg: colors.onPrimary },
  }[tone];

  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.bg },
        style,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
