import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc, Firestore } from "firebase/firestore";
import {
  AppText,
  Avatar,
  Button,
  Card,
  IconBubble,
  InfoRow,
  LoadingView,
  Screen,
} from "../../../components/ui";
import { spacing } from "../../../constants/theme";
import { useTheme } from "../../../hooks/useTheme";
import { useFollowing } from "../../../hooks/useFriends";
import { useJournal } from "../../../hooks/useJournal";

/**
 * You tab — the profile. Edit Profile, Settings, Friends and Journal live in this same stack
 * (/profile/edit, /profile/settings, /profile/friends, /profile/journal) so the tab bar stays on screen.
 */
export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { count: friendsCount, loading: loadingFriends } = useFollowing();
  const { entries: journalEntries, loading: loadingJournal, insights } = useJournal(300);

  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        setError(null);
        try {
          const userDocRef = doc(db as Firestore, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setProfileData(userDocSnap.data());
          } else {
            setProfileData({ name: user.displayName, email: user.email });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError(`Failed to load profile data. Please try again later.`);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
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
    );
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

  // Firestore stores the name as `name` (that's what Edit Profile writes); fall back to Auth.
  const displayName = profileData?.name || profileData?.displayName || user.displayName || "";
  const avatarUri = profileData?.photoURL || user.photoURL || null;
  const memberSince = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;

  return (
    <Screen scroll edges={['top']} decor>
      <View style={styles.hero}>
        <Avatar uri={avatarUri} name={displayName || user.email || ""} size={104} />
        <AppText variant="overline" tone="accent" align="center" style={styles.eyebrow}>
          My Profile
        </AppText>
        <AppText variant="title" align="center">
          {displayName || "Welcome"}
        </AppText>
        <AppText variant="caption" tone="muted" align="center" style={styles.email}>
          {user.email || "N/A"}
        </AppText>
      </View>

      {/* Friends counter → /profile/friends */}
      <Pressable
        onPress={() => router.push('/profile/friends')}
        accessibilityRole="button"
        accessibilityLabel={`Friends, ${friendsCount}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <IconBubble name="people-outline" tone="primary" />
            <View style={styles.statsText}>
              <AppText variant="label">Friends</AppText>
              <AppText variant="caption" tone="secondary">People you follow</AppText>
            </View>
            <AppText variant="title" style={[styles.statValue, { color: colors.primary }]}>
              {loadingFriends ? '–' : friendsCount}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      </Pressable>

      {/* Journal → /profile/journal */}
      <Pressable
        onPress={() => router.push('/profile/journal')}
        accessibilityRole="button"
        accessibilityLabel={`Journal, ${journalEntries.length} entries`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <IconBubble name="book-outline" tone="accent" />
            <View style={styles.statsText}>
              <AppText variant="label">Journal</AppText>
              <AppText variant="caption" tone="secondary">
                {insights.streak >= 2 ? `${insights.streak}-day check-in streak` : 'Oracle answers, moods, Moon intentions'}
              </AppText>
            </View>
            <AppText variant="title" style={[styles.statValue, { color: colors.primary }]}>
              {loadingJournal ? '–' : journalEntries.length}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      </Pressable>

      <Card>
        <InfoRow label="Email" value={user.email || "N/A"} divider />

        {displayName ? (
          <InfoRow label="Display Name" value={displayName} divider />
        ) : null}

        <InfoRow
          label="Member Since"
          value={memberSince ? memberSince.toLocaleDateString() : "N/A"}
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Edit Profile"
          icon={<Ionicons name="create-outline" size={18} color={colors.onPrimary} />}
          onPress={() => router.push('/profile/edit')}
        />
        <Button
          title="Settings"
          variant="secondary"
          icon={<Ionicons name="settings-outline" size={18} color={colors.primary} />}
          onPress={() => router.push('/profile/settings')}
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

      <AppText variant="caption" tone="muted" align="center" style={styles.legal}>
        2025{" "}
        <AppText
          variant="caption"
          tone="primary"
          onPress={() => Linking.openURL("https://theladiesoracle.com/")}
        >
          theladiesoracle
        </AppText>{" "}
        App v1.0
      </AppText>
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
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statValue: {
    marginRight: spacing.sm,
  },
  actions: {
    marginTop: spacing.xxl,
  },
  action: {
    marginTop: spacing.md,
  },
  legal: {
    marginTop: spacing.xxxl,
  },
  stateTitle: {
    marginTop: spacing.lg,
  },
  stateAction: {
    marginTop: spacing.xl,
  },
});
