import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type InfoRowProps = {
  label: string;
  value: string;
  /** Hairline under the row (omit on the last row) */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Label-over-value pair for read-only detail cards (profile, location). */
export function InfoRow({ label, value, divider = false, style }: InfoRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        style,
      ]}
    >
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
      <AppText variant="body" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  value: {
    marginTop: spacing.xs,
  },
});
