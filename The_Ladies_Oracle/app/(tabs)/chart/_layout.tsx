import { Stack } from 'expo-router';

/** Chart tab: a small stack so Your Pattern (/chart/pattern) keeps the tab bar and "Chart" highlighted. */
export default function ChartStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
