import { useRouter } from "expo-router";
import { Linking, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { AppText, Card, IconBubble, ListRow, PageHeader, Screen } from "../../../components/ui";
import { BackBar } from "../../../components/BackBar";
import { spacing } from "../../../constants/theme";
import { useTheme } from "../../../hooks/useTheme";
import { useShareChart } from "../../../hooks/useBond";
import { usePlan } from "../../../hooks/usePlan";

// TODO: point these at the real pages when they exist.
const PRIVACY_URL = "https://theladiesoracle.com/";
const HELP_URL = "https://theladiesoracle.com/";

/** /profile/settings — lives in the You tab's stack, so the tab bar stays visible. */
export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const { shareChart, setSharing } = useShareChart();
  const { plan } = usePlan();

  const switchColors = {
    trackColor: { false: colors.switchTrackOff, true: colors.primary },
    thumbColor: colors.switchThumb,
    ios_backgroundColor: colors.switchTrackOff,
  };

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Profile" />
      <PageHeader title="Settings" subtitle="Tune your Oracle experience." />

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        Preferences
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="notifications-outline" tone="primary" />}
          title="Enable Notifications"
          divider
          trailing={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              {...switchColors}
            />
          }
        />
        <ListRow
          leading={<IconBubble name="moon-outline" tone="accent" />}
          title="Dark Mode"
          trailing={
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              {...switchColors}
            />
          }
        />
      </Card>

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        Membership
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="ribbon-outline" tone="primary" />}
          title={plan.name}
          trailing={
            <View style={styles.trailing}>
              <AppText variant="caption" tone="secondary">{plan.weeklyLimit === null ? 'Unlimited' : `${plan.weeklyLimit} a week`}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.trailingChevron} />
            </View>
          }
          onPress={() => router.push('../../paywall')}
        />
      </Card>

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        Friends
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="people-outline" tone="primary" />}
          title="Share my chart with friends"
          trailing={
            <Switch
              value={!!shareChart}
              disabled={shareChart === null}
              onValueChange={setSharing}
              {...switchColors}
            />
          }
        />
      </Card>
      <AppText variant="caption" tone="muted" style={styles.hint}>
        Lets people who follow you see your bond with them (and you theirs). Your birth details are never shown.
      </AppText>

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        Account
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="create-outline" tone="primary" />}
          title="Edit Profile"
          chevron
          divider
          onPress={() => router.push('/profile/edit')}
        />
        <ListRow
          leading={<IconBubble name="calendar-outline" tone="accent" />}
          title="Date & Time of Birth"
          chevron
          divider
          onPress={() => router.push('/dateofbirth')}
        />
        <ListRow
          leading={<IconBubble name="location-outline" tone="accent" />}
          title="Place of Birth"
          chevron
          onPress={() => router.push('/locationdetails')}
        />
      </Card>

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        About
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="book-outline" tone="primary" />}
          title="How it works"
          chevron
          divider
          onPress={() => router.push('/profile/guide')}
        />
        <ListRow
          leading={<IconBubble name="shield-checkmark-outline" tone="neutral" />}
          title="Privacy Policy"
          chevron
          divider
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <ListRow
          leading={<IconBubble name="help-circle-outline" tone="neutral" />}
          title="Help & Support"
          chevron
          onPress={() => Linking.openURL(HELP_URL)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  hint: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trailing: { flexDirection: 'row', alignItems: 'center' },
  trailingChevron: { marginLeft: spacing.xs },
});
