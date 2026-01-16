import React, { useState, useEffect, useCallback } from 'react';
import {View,ScrollView,Text,TextInput,Image,TouchableOpacity,StyleSheet,Alert,ActivityIndicator,Platform,} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, User, onAuthStateChanged } from 'firebase/auth';
import { router } from 'expo-router';
import globalStyles, { COLORS } from '../constants/styles';
import { auth } from '../firebaseConfig';

const EditProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [name, setName] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const firestore = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userState) => {
      setUser(userState);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe; // Unsubscribe on unmount
  }, [initializing]);

  const fetchUserData = useCallback(async () => {
    // Use the latest user from auth, not the state, to avoid race conditions
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setName(userData.name || '');
        setProfilePicUri(userData.photoURL || null);
      } else {
        setName(currentUser.displayName || '');
        setProfilePicUri(currentUser.photoURL || null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load your profile data.");
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    if (!initializing) {
      fetchUserData();
    }
  }, [initializing, fetchUserData]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'We need camera roll permissions to let you pick an image.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pictures/${userId}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    const userForSave = auth.currentUser;

    if (!userForSave) {
      Alert.alert("Not Logged In", "Your session may have expired. Please log in again.");
      router.push('/login');
      return;
    }

    setSaving(true);
    let photoURL = profilePicUri;

    try {
      if (profilePicUri && !profilePicUri.startsWith('http')) {
        photoURL = await uploadImage(profilePicUri, userForSave.uid);
      }

      const userDocRef = doc(firestore, 'users', userForSave.uid);
      await updateDoc(userDocRef, {
        name: name,
        photoURL: photoURL,
      });

      await updateProfile(userForSave, { displayName: name, photoURL: photoURL });

      Alert.alert("Success", "Your profile has been updated!");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Save Error", "There was a problem saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (initializing || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>You must be logged in to see this page.</Text>
        <TouchableOpacity onPress={() => router.push('/login')} style={[globalStyles.button, { marginTop: 20 }]}>
          <Text style={globalStyles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: profilePicUri || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <TouchableOpacity onPress={pickImage} style={globalStyles.buttonOutline}>
          <Text style={globalStyles.buttonOutlineText}>Change Picture</Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.label}>Display Name</Text>
      <View style={globalStyles.textInputView}>
        <TextInput
          style={globalStyles.textInputStyle}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <TouchableOpacity
        style={[globalStyles.button, { marginTop: 30 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.buttonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  centered: {
    flexGrow: 1, // Make sure it can take up the whole screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
});

export default EditProfileScreen;
