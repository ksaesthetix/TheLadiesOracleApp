import { useRouter } from "expo-router";
import { Alert, Linking, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { AppText, Card, IconBubble, ListRow, PageHeader, Screen } from "../../../components/ui";
import { BackBar } from "../../../components/BackBar";
import { spacing } from "../../../constants/theme";
import { useTheme } from "../../../hooks/useTheme";
import { useShareChart } from "../../../hooks/useBond";
import { usePlan } from "../../../hooks/usePlan";
import { deleteAccount } from "../../../lib/account";
import { PRIVACY_URL, SITE_URL, TERMS_URL } from "../../../constants/links";

/** /profile/settings — lives in the You tab's stack, so the tab bar stays visible. */
export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const { shareChart, setSharing } = useShareChart();
  const { plan } = usePlan();
  const [deleting, setDeleting] = useState(false);

  const handleLogOut = () => {
    Alert.alert("Log out?", "You can log back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: async () => { await signOut(auth); router.replace("/login"); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This removes your chart, journal, friends and membership record for good. It cannot be undone. If you have a subscription, cancel it separately in your App Store or Google Play settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              Alert.alert("Account deleted", "Thank you for spending time with the Oracle.");
              router.replace("/login");
            } catch (err: any) {
              Alert.alert("Couldn't delete the account", err?.message ?? "Please try again in a moment.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

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
          onPress={() => router.push('/paywall')}
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
          divider
          onPress={() => router.push('/locationdetails')}
        />
        <ListRow
          leading={<IconBubble name="log-out-outline" tone="neutral" />}
          title="Log out"
          chevron
          onPress={handleLogOut}
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
          leading={<IconBubble name="document-text-outline" tone="neutral" />}
          title="Terms of Use"
          chevron
          divider
          onPress={() => Linking.openURL(TERMS_URL)}
        />
        <ListRow
          leading={<IconBubble name="help-circle-outline" tone="neutral" />}
          title="Help & Support"
          chevron
          onPress={() => Linking.openURL(SITE_URL)}
        />
      </Card>

      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
        Danger zone
      </AppText>
      <Card padded={false}>
        <ListRow
          leading={<IconBubble name="trash-outline" tone="neutral" />}
          title={deleting ? "Deleting…" : "Delete my account"}
          chevron
          onPress={deleting ? undefined : handleDeleteAccount}
        />
      </Card>
      <AppText variant="caption" tone="muted" style={styles.hint}>
        Removes your account and everything in it. This cannot be undone.
      </AppText>
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
