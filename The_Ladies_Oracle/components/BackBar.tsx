import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

/**
 * A slim back control for screens that live inside a tab's stack (where the native
 * header is hidden and the tab bar stays). Sits at the top of the Screen, above the
 * PageHeader. Swipe-back still works too.
 *
 *   <BackBar label="Profile" />
 */
export function BackBar({ label = 'Back', onPress }: { label?: string; onPress?: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/profile')))}
        accessibilityRole="button"
        accessibilityLabel={`Back to ${label}`}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
        <AppText variant="label" style={{ color: colors.primary }}>{label}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', marginTop: spacing.xs, marginBottom: spacing.sm, marginLeft: -6 },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingRight: spacing.sm },
});

export default BackBar;
