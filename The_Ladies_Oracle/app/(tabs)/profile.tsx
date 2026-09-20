
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../../firebaseConfig";
// Import the Firestore type for explicit casting
import { doc, getDoc, Firestore } from "firebase/firestore";
import {
  AppText,
  Avatar,
  Button,
  Card,
  InfoRow,
  LoadingView,
  Screen,
} from "../../components/ui";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        setError(null);
        try {
          // Explicitly cast the 'db' instance to the Firestore type
          const userDocRef = doc(db as Firestore, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setProfileData(userDocSnap.data());
          } else {
            setProfileData({ displayName: user.displayName, email: user.email });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError(`Failed to load profile data. Please try again later.`);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    if (!authLoading) {
        fetchUserProfile();
    }

  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  if (authLoading || loadingProfile) {
    return <LoadingView message="Loading Profile..." />;
  }

  if (!user) {
    return (
      <Screen centered edges={['top']} decor>
        <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
        <AppText variant="heading" align="center" style={styles.stateTitle}>
          You are not logged in.
        </AppText>
        <Button
          title="Go to Login"
          fullWidth={false}
          onPress={() => router.replace("/login")}
          style={styles.stateAction}
        />
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen centered edges={['top']} decor>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <AppText variant="body" tone="danger" align="center" style={styles.stateTitle}>
          {error}
        </AppText>
      </Screen>
    );
  }

  const displayName = profileData?.displayName || user.displayName || user.email || "";
  const avatarUri = profileData?.photoURL || user.photoURL || null;

  return (
    <Screen scroll edges={['top']} decor>
      <View style={styles.hero}>
        <Avatar uri={avatarUri} name={displayName} size={104} />
        <AppText variant="overline" tone="accent" align="center" style={styles.eyebrow}>
          My Profile
        </AppText>
        <AppText variant="title" align="center">
          {profileData?.displayName || "Welcome"}
        </AppText>
        <AppText variant="caption" tone="muted" align="center" style={styles.email}>
          {user.email || "N/A"}
        </AppText>
      </View>

      <Card>
        <InfoRow label="Email" value={user.email || "N/A"} divider />

        {profileData?.displayName && (
          <InfoRow label="Display Name" value={profileData.displayName} divider />
        )}

        <InfoRow
          label="Member Since"
          value={
            user.metadata.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : "N/A"
          }
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Edit Profile"
          icon={<Ionicons name="create-outline" size={18} color={colors.onPrimary} />}
          onPress={() => router.push('/edit_profile')}
        />
        <Button
          title="Settings"
          variant="secondary"
          icon={<Ionicons name="settings-outline" size={18} color={colors.primary} />}
          onPress={() => router.push('/settings')}
          style={styles.action}
        />
        <Button
          title="Logout"
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
          onPress={handleLogout}
          style={styles.action}
        />
      </View>
      {/*
       <View style={globalStyles.footer}>
          <Text style={globalStyles.footerText}>
            2025{" "}
            <Text
              onPress={() => Linking.openURL("https://theladiesoracle.com/")}
              style={{ color: COLORS.primary }}
            >
              theladiesoracle
            </Text>{" "}
            App v1.0
          </Text>
        </View>*/}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  email: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xxl,
  },
  action: {
    marginTop: spacing.md,
  },
  stateTitle: {
    marginTop: spacing.lg,
  },
  stateAction: {
    marginTop: spacing.xl,
  },
});
