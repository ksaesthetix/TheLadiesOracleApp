import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export type LoadingViewProps = {
  message?: string;
};

/** Full-screen themed spinner used while data or auth state is loading. */
export function LoadingView({ message }: LoadingViewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <AppText variant="body" tone="secondary" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  message: {
    marginTop: spacing.lg,
  },
});
