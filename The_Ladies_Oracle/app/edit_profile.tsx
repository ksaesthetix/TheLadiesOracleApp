
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, 
    ScrollView, 
    Text, 
    TextInput, 
    Image, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Import the Firestore type for explicit casting
import { getFirestore, doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import globalStyles, { COLORS } from '../constants/styles';
import { useAuth } from './contexts/AuthContext';

const EditProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false); 

  // Get the firestore instance
  const firestore = getFirestore();

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Explicitly cast the 'firestore' instance to the Firestore type
      const userDocRef = doc(firestore as Firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setName(userData.name || user.displayName || '');
        setProfilePicUri(userData.photoURL || user.photoURL || null);
      } else {
        setName(user.displayName || '');
        setProfilePicUri(user.photoURL || null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", `Failed to load your profile data.`);
    } finally {
      setLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera roll permissions are needed to select an image.');
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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const storage = getStorage();
    let newPhotoURL = profilePicUri;

    try {
      if (profilePicUri && !profilePicUri.startsWith('http')) {
        const response = await fetch(profilePicUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      const userDocRef = doc(firestore as Firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: name,
        photoURL: newPhotoURL,
      });

      await updateProfile(user, { displayName: name, photoURL: newPhotoURL });

      Alert.alert("Success", "Your profile has been updated!");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Save Error", `There was a problem saving your profile.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
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
