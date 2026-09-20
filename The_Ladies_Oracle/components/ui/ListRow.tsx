import React, { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type ListRowProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  subtitle?: string;
  /** Element at the start of the row (icon bubble, avatar…) */
  leading?: React.ReactNode;
  /** Element at the end of the row (switch, button…) */
  trailing?: React.ReactNode;
  /** Show a chevron at the end */
  chevron?: boolean;
  /** Draw a hairline under the row (for grouped lists inside a Card) */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A settings-style row. Transparent by default so several can be grouped inside
 * a `<Card padded={false}>`. Forwards refs/press props so it also works as the
 * child of `<Link asChild>`.
 */
export const ListRow = forwardRef<View, ListRowProps>(function ListRow(
  { title, subtitle, leading, trailing, chevron = false, divider = false, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const interactive = Boolean(rest.onPress);

  return (
    <Pressable
      ref={ref}
      accessibilityRole={interactive ? 'button' : undefined}
      {...rest}
      style={({ pressed }) => [
        styles.row,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && interactive && { backgroundColor: colors.surfaceAlt },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {chevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  leading: {
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  trailing: {
    marginLeft: spacing.md,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
