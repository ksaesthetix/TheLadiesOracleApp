import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import globalStyles, { COLORS } from '../constants/styles';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const options = { headerShown: false };

const API_URL = 'https://theladiesoracleapp.onrender.com';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem('userEmail', email);
        Alert.alert('Login successful', `Welcome, ${email}!`);
        router.push('/profile'); // Navigate after successful login
      } else {
        Alert.alert('Login Failed', data.error || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Network error', 'Please try again later.');
    }
    setLoading(false);
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <View style={[globalStyles.container, { justifyContent: 'center' }]}>
      <Text style={globalStyles.title}>Login</Text>
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
      <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
        <Text style={globalStyles.buttonText}>{loading ? 'Logging In...' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 24 }} onPress={handleSignUp}>
        <Text style={globalStyles.authLink}>
          Don't have an account? <Text style={globalStyles.authLinkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}