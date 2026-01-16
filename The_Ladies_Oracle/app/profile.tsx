import { Link } from "expo-router";
import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import {
  Text,
  View,
  Modal,
  ScrollView,
  Linking,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import globalStyles from "../constants/styles";
import { useWisdomArchive } from "./contexts/WisdomArchiveContext";
import { auth, db } from "../firebaseConfig"; // Assuming you have firebase config
import { doc, getDoc } from "firebase/firestore";
import { User, onAuthStateChanged } from "firebase/auth";

const { width } = Dimensions.get("window");

// Remove WISE_QUOTES and related logic as it's not relevant to a profile page
// const WISE_QUOTES = [...]

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null); // State to store user profile data from Firestore
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setError("Please log in to view your profile.");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setProfileData(userDocSnap.data());
          } else {
            setProfileData(null); // User document does not exist
            setError("User profile data not found.");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Failed to load profile data.");
        } finally {
          setLoading(false);
        }
      } else if (!user && !loading) {
        // If user logs out, clear profile data
        setProfileData(null);
      }
    };

    fetchUserProfile();
  }, [user]); // Re-fetch when the user object changes (e.g., login/logout)

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#1e3274" />
        <Text style={globalStyles.profiletext}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.container}>
        <Text style={[globalStyles.profiletext, { color: "red" }]}>{error}</Text>
        {!user && (
          <Link href="./login" asChild>
            <TouchableOpacity style={globalStyles.button}>
              <Text style={globalStyles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    );
  }

  if (!user) {
    // This case should ideally be covered by the error state above
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.profiletext}>You are not logged in.</Text>
        <Link href="./login" asChild>
          <TouchableOpacity style={globalStyles.button}>
            <Text style={globalStyles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <>
      <View style={globalStyles.container}>
        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          <Text style={styles.headerText}>My Profile</Text>
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>{user.email || "N/A"}</Text>

            {profileData ? (
              <>
                {profileData.displayName && (
                  <>
                    <Text style={styles.profileLabel}>Display Name:</Text>
                    <Text style={styles.profileValue}>
                      {profileData.displayName}
                    </Text>
                  </>
                )}
                {profileData.firstName && (
                  <>
                    <Text style={styles.profileLabel}>First Name:</Text>
                    <Text style={styles.profileValue}>
                      {profileData.firstName}
                    </Text>
                  </>
                )}
                {profileData.lastName && (
                  <>
                    <Text style={styles.profileLabel}>Last Name:</Text>
                    <Text style={styles.profileValue}>
                      {profileData.lastName}
                    </Text>
                  </>
                )}
                {profileData.birthDate && (
                  <>
                    <Text style={styles.profileLabel}>Date of Birth:</Text>
                    <Text style={styles.profileValue}>
                      {profileData.birthDate}
                    </Text>
                  </>
                )}
                {/* Add more profile fields as needed */}
                <Text style={styles.profileLabel}>Member Since:</Text>
                <Text style={styles.profileValue}>
                  {user.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "N/A"}
                </Text>
              </>
            ) : (
              <Text style={styles.noProfileDataText}>
                No additional profile data found.
              </Text>
            )}
          </View>

          <View style={globalStyles.buttonContainer}>
            <Link href="/edit_profile" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </Link>
            <Link href="./settings" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Settings</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              style={globalStyles.button}
              onPress={async () => {
                try {
                  await auth.signOut();
                  // Optionally navigate to login or home
                  // router.replace("/login");
                } catch (error) {
                  console.error("Error signing out:", error);
                }
              }}
            >
              <Text style={globalStyles.buttonText}>Logout</Text>
            </TouchableOpacity>
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
    </>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e3274",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profiletext: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3274",
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  profileValue: {
    fontSize: 18,
    color: "#333",
    marginBottom: 5,
  },
  noProfileDataText: {
    fontSize: 16,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
});