import { Link } from "expo-router";
import {
  StyleSheet,
  Switch,
} from "react-native";
import { useState } from "react";
import { AppText, Card, IconBubble, ListRow, PageHeader, Screen } from "../../../components/ui";
import { spacing } from "../../../constants/theme";
import { useTheme } from "../../../hooks/useTheme";

export default function Settings() {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const switchColors = {
    trackColor: { false: colors.switchTrackOff, true: colors.primary },
    thumbColor: colors.switchThumb,
    ios_backgroundColor: colors.switchTrackOff,
  };

  return (
    <Screen scroll edges={['bottom']} decor>
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
        Account
      </AppText>
      <Card padded={false}>
        <Link href="./profile" asChild>
          <ListRow
            leading={<IconBubble name="person-outline" tone="neutral" />}
            title="Profile"
            chevron
            divider
          />
        </Link>

        <Link href="./privacy" asChild>
          <ListRow
            leading={<IconBubble name="shield-checkmark-outline" tone="neutral" />}
            title="Privacy Policy"
            chevron
            divider
          />
        </Link>

        <Link href="./help" asChild>
          <ListRow
            leading={<IconBubble name="help-circle-outline" tone="neutral" />}
            title="Help & Support"
            chevron
          />
        </Link>
      </Card>
      {/*
      <View style={globalStyles.footer}>
              <Text style={globalStyles.footerText}>
                2025{" "}
                <Text
                  onPress={() => Linking.openURL("https://theladiesoracle.com/")}
                  style={{ color: "#1e3274" }}
                >
                  theladiesoracle
                </Text>{" "}
                App v1.0
              </Text>
        </View>*/}
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
