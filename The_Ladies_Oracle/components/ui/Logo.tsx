import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

// Tight crop of assets/images/The_Ladies_Oracle_Logo.png (transparent background).
const LOGO = require('../../assets/images/The_Ladies_Oracle_Logo_mark.png');
const LOGO_ASPECT = 766 / 556;

export type LogoProps = {
  /** Rendered width in points; height follows the image's aspect ratio */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Brand mark. In dark mode it sits on a soft cream plate so the burgundy fan
 * and wordmark stay legible.
 */
export function Logo({ width = 220, style }: LogoProps) {
  const theme = useTheme();
  const height = width / LOGO_ASPECT;

  return (
    <View
      style={[
        styles.plate,
        theme.dark && {
          backgroundColor: theme.colors.logoPlate,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderRadius: radius.lg,
        },
        style,
      ]}
    >
      <Image
        source={LOGO}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="The Ladies' Oracle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
