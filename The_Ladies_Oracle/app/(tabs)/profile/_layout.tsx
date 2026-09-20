import { Stack } from 'expo-router';

/**
 * "You" tab: a small stack so sub-pages (edit, settings, …) keep the tab bar
 * visible and "You" highlighted, with proper back navigation.
 */
export default function ProfileStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
