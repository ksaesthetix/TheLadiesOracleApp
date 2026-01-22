
import { Link, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import globalStyles, { COLORS } from "../../constants/styles";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../../firebaseConfig";
// Import the Firestore type for explicit casting
import { doc, getDoc, Firestore } from "firebase/firestore";

export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

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
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{marginTop: 10}}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{color: 'red'}}>You are not logged in.</Text>
         <TouchableOpacity style={globalStyles.button} onPress={() => router.replace("/login")}>
            <Text style={globalStyles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }
  
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{ color: "red", textAlign: 'center', paddingHorizontal: 20 }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>My Profile</Text>
      <View style={styles.profileCard}>
        <Text style={styles.profileLabel}>Email:</Text>
        <Text style={styles.profileValue}>{user.email || "N/A"}</Text>

        {profileData?.displayName && (
          <>
            <Text style={styles.profileLabel}>Display Name:</Text>
            <Text style={styles.profileValue}>{profileData.displayName}</Text>
          </>
        )}
        
        <Text style={styles.profileLabel}>Member Since:</Text>
        <Text style={styles.profileValue}>
          {user.metadata.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString()
            : "N/A"}
        </Text>
      </View>

      <View style={globalStyles.buttonContainer}>
        <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/edit_profile')}>
            <Text style={globalStyles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/settings')}>
            <Text style={globalStyles.buttonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={globalStyles.buttonText}>Logout</Text>
        </TouchableOpacity>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 50,
    paddingBottom: 10, 
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
    marginTop: 40, 
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
  logoutButton: {
    backgroundColor: COLORS.accent, 
  }
});
