import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type ScreenProps = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView */
  scroll?: boolean;
  /**
   * Which safe-area edges to pad. Tab screens (no header) want `['top']`;
   * screens shown under a stack header want `['bottom']`.
   */
  edges?: Edge[];
  /** Apply the standard horizontal page padding */
  padded?: boolean;
  /** Centre children vertically and horizontally */
  centered?: boolean;
  /** Push content up when the keyboard opens (forms) */
  keyboardAvoiding?: boolean;
  /** Soft brand-coloured glows behind the content */
  decor?: boolean;
  /** Extra styles for the content container */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Page shell: themed background, safe-area handling, optional scrolling and
 * keyboard avoidance, plus the soft decorative glows that give the app its
 * warmth.
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  padded = true,
  centered = false,
  keyboardAvoiding = false,
  decor = false,
  contentStyle,
  style,
}: ScreenProps) {
  const { colors } = useTheme();

  const contentStyles = [
    padded && styles.padded,
    centered && styles.centered,
    contentStyle,
  ];

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyles]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyles]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }, style]}>
      {decor && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.glowTop, { backgroundColor: colors.glowPrimary }]} />
          <View style={[styles.glowBottom, { backgroundColor: colors.glowAccent }]} />
        </View>
      )}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -180,
    left: -150,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
});
