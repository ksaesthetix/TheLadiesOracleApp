import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../constants/theme';
import { AppText } from './AppText';

export type PageHeaderProps = {
  /** Small gold uppercase line above the title */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** Standard page heading block: eyebrow / serif title / supporting line. */
export function PageHeader({ eyebrow, title, subtitle, align = 'left', style }: PageHeaderProps) {
  return (
    <View style={[styles.container, align === 'center' && styles.center, style]}>
      {eyebrow ? (
        <AppText variant="overline" tone="accent" align={align} style={styles.eyebrow}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title" align={align}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="subtitle" tone="secondary" align={align} style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  center: {
    alignItems: 'center',
  },
  eyebrow: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
