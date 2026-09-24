import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '../../../firebaseConfig';
import { AppText, Avatar, Button, Card, LoadingView, PageHeader, Screen, TextField } from '../../../components/ui';
import { BackBar } from '../../../components/BackBar';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { updatePublicProfile } from '../../../lib/account';

/** /profile/edit — lives in the You tab's stack, so the tab bar stays visible. */
const EditProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
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
  }, [user]);

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

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: name,
        photoURL: newPhotoURL,
      });

      await updateProfile(user, { displayName: name, photoURL: newPhotoURL });
      // Friends see the public profile, so keep it in step.
      await updatePublicProfile(user.uid, { name, photoURL: newPhotoURL ?? null });

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
    return <LoadingView message="Loading..." />;
  }

  if (!user) {
    return (
      <Screen centered edges={['top']} decor>
        <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
        <AppText variant="heading" align="center" style={styles.stateTitle}>You are not logged in.</AppText>
        <Button title="Go to Login" fullWidth={false} onPress={() => router.replace('/login')} style={styles.stateAction} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top']} decor keyboardAvoiding>
      <BackBar label="Profile" />
      <PageHeader title="Edit Profile" subtitle="Your name and picture, as the Oracle sees you." />

      <View style={styles.avatarSection}>
        <Pressable onPress={pickImage} style={styles.avatarWrap} accessibilityRole="button" accessibilityLabel="Change picture">
          <Avatar uri={profilePicUri} name={name} size={128} />
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name="camera" size={16} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Button
          title="Change Picture"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={pickImage}
          style={styles.changePicture}
        />
      </View>

      <Card>
        <TextField
          label="Display Name"
          icon="person-outline"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        <AppText variant="caption" tone="muted" style={styles.hint}>
          This is the name the Oracle will greet you by.
        </AppText>
      </Card>

      <Button
        title="Save Profile"
        onPress={handleSave}
        disabled={saving}
        loading={saving}
        style={styles.save}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePicture: {
    marginTop: spacing.lg,
  },
  hint: {
    marginTop: spacing.sm,
  },
  save: {
    marginTop: spacing.xxl,
  },
  stateTitle: {
    marginTop: spacing.lg,
  },
  stateAction: {
    marginTop: spacing.xl,
  },
});

export default EditProfileScreen;
