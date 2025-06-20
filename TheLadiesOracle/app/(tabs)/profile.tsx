import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import globalStyles from '../../constants/styles';
export default function ProfilePage() {
  return (
    <View style={globalStyles.container}>
      <Image
        source={require('@/assets/images/profile-placeholder.png')}
        style={globalStyles.avatar}
      />
      <Text style={globalStyles.name}>Jane Doe</Text>
      <Text style={globalStyles.email}>jane.doe@email.com</Text>
      <TouchableOpacity style={globalStyles.editbutton} onPress={() => alert('Edit Profile')}>
        <Text style={globalStyles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={globalStyles.logoutButton} onPress={() => alert('Logged out!')}>
        <Text style={globalStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
