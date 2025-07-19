import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import globalStyles from '../../constants/styles';

const API_URL = 'https://theladiesoracleapp.onrender.com';

export default function ProfilePage() {
  const [user, setUser] = useState<{ email: string; name?: string; avatarUri?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Not logged in', 'Please log in first.');
        setLoading(false);
        return;
      }
      fetch(`${API_URL}/user?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setEditName(data.name || '');
          setEditAvatar(data.avatarUri);
          setLoading(false);
        })
        .catch(() => {
          Alert.alert('Error', 'Could not load user data.');
          setLoading(false);
        });
    };
    fetchUser();
  }, []);

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatarUri);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;
    // Update user in backend (add avatarUri if you support it)
    const res = await fetch(`${API_URL}/user/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, name: editName, avatarUri: editAvatar }),
    });
    if (res.ok) {
      setUser({ ...user, name: editName, avatarUri: editAvatar });
      setModalVisible(false);
      Alert.alert('Profile updated!');
    } else {
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={globalStyles.container}>
      <Image
        source={
          user?.avatarUri
            ? { uri: user.avatarUri }
            : require('@/assets/images/profile-placeholder.png')
        }
        style={globalStyles.avatar}
      />
      <Text style={globalStyles.name}>{user?.name || 'No Name'}</Text>
      <Text style={globalStyles.email}>{user?.email}</Text>
      <TouchableOpacity style={globalStyles.editbutton} onPress={openEditModal}>
        <Text style={globalStyles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={globalStyles.logoutButton}
        onPress={async () => {
          await AsyncStorage.removeItem('userEmail');
          Alert.alert('Logged out!');
        }}>
        <Text style={globalStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  editAvatar
                    ? { uri: editAvatar }
                    : require('@/assets/images/profile-placeholder.png')
                }
                style={globalStyles.avatar}
              />
              <Text style={{ textAlign: 'center', color: '#888', marginBottom: 12 }}>
                Change Profile Picture
              </Text>
            </TouchableOpacity>
            <TextInput
              style={globalStyles.authInput}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
              <Text style={globalStyles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={globalStyles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
