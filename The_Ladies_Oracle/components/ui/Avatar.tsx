import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type AvatarProps = {
  /** Remote or local image URI. Falls back to initials, then to a person icon. */
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initialsFrom(name?: string | null) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Circular avatar with image → initials → icon fallback chain. */
export function Avatar({ uri, name, size = 96, style }: AvatarProps) {
  const { colors } = useTheme();
  const initials = initialsFrom(name);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          borderColor: colors.surface,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : initials ? (
        <AppText
          tone="primary"
          style={{ fontFamily: fonts.serifSemiBold, fontSize: size * 0.4, lineHeight: size * 0.48 }}
        >
          {initials}
        </AppText>
      ) : (
        <Ionicons name="person" size={size * 0.48} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
  },
});
