import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import globalStyles, { COLORS } from '../constants/styles';
import { useRouter } from 'expo-router';

export const options = { headerShown: false };

const API_URL = 'https://theladiesoracleapp.onrender.com';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Account created! Please log in.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        Alert.alert('Sign Up Failed', data.error || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Network error', 'Please try again later.');
    }
    setLoading(false);
  };

  const handleGoToLogin = () => {
    router.replace('/login');
  };

  return (
    <View style={[globalStyles.container, { justifyContent: 'center' }]}>
      <Text style={globalStyles.title}>Sign Up</Text>
      <TextInput
        style={globalStyles.authInput}
        placeholder="Email"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={globalStyles.authInput}
        placeholder="Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={globalStyles.authInput}
        placeholder="Confirm Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <TouchableOpacity style={globalStyles.button} onPress={handleSignup} disabled={loading}>
        <Text style={globalStyles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 24 }} onPress={handleGoToLogin}>
        <Text style={globalStyles.authLink}>
          Already have an account? <Text style={globalStyles.authLinkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}