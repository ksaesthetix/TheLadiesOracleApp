import { Link } from "expo-router";
import Constants from "expo-constants";
import globalStyles from '../constants/styles';
import {
  Text,
  View,
  StyleSheet,
  Switch,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking
} from "react-native";
import { useState } from "react";

const { width } = Dimensions.get("window");

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        <Text style={globalStyles.title}>Settings</Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Preferences</Text>

          <View style={globalStyles.settingRow}>
            <Text style={globalStyles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ccc", true: "#1e3274" }}
              thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={globalStyles.settingRow}>
            <Text style={globalStyles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#ccc", true: "#1e3274" }}
              thumbColor={darkModeEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Account</Text>

          <Link href="./profile" asChild>
            <TouchableOpacity style={globalStyles.linkButton}>
              <Text style={globalStyles.linkText}>Profile</Text>
            </TouchableOpacity>
          </Link>

          <Link href="./privacy" asChild>
            <TouchableOpacity style={globalStyles.linkButton}>
              <Text style={globalStyles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </Link>

          <Link href="./help" asChild>
            <TouchableOpacity style={globalStyles.linkButton}>
              <Text style={globalStyles.linkText}>Help & Support</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

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
        </View>
    </View>
  );
};
