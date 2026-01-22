import React, { useState } from 'react';
import { Text, View, ScrollView, Image, TextInput, TouchableHighlight, Linking, Alert } from 'react-native';
import globalStyles from '../constants/styles';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleOnPressSignin = async () => {
    if (!email || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`User has signed in with email: ${email}`);
      router.push('/profile');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    }
  }
  
  return (
    <View style={globalStyles.container}>
      <ScrollView>
        <View style={{ marginTop: -100 }}>
          <Image 
            source={{ uri: 'https://wilcity.com/wp-content/uploads/2018/12/sample-logo-design-png-3.png' }} 
            style={globalStyles.logoImage}
          />
        </View>
        <Text style={globalStyles.paragraph}>
          Login Screen
        </Text>
        <View>
          <View style={globalStyles.textInputView}>
            <TextInput 
              style={globalStyles.textInputStyle}
              placeholder="Email"
              placeholderTextColor="#808080"
              underlineColorAndroid="transparent"
              maxLength={40}
              onChangeText={setEmail}
              value={email}
            />
          </View>
          <View style={globalStyles.textInputView}>
            <TextInput 
              style={globalStyles.textInputStyle}
              placeholder="Password"
              placeholderTextColor="#808080"
              underlineColorAndroid="transparent"
              secureTextEntry={true}
              maxLength={20}
              onChangeText={setPassword}
              value={password}
            />
          </View>
        </View>
        
        <TouchableHighlight activeOpacity={1} underlayColor={"#ad1111"} style={globalStyles.signinButton} onPress={handleOnPressSignin}>
          <Text style={globalStyles.signinButtonText}>Log In</Text>
        </TouchableHighlight>

        <Text style={globalStyles.signupText}>
          Don't have an account? {' '}
          <Text style={globalStyles.signupLink} onPress={() => router.push('/signup')}>
            Sign up here
          </Text>
        </Text>
      </ScrollView>
      {/*
      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>
          2025 <Text onPress={() => Linking.openURL('https://theladiesoracle.com/')} style={{ color: '#1e3274' }}>theladiesoracle</Text> App v1.0
        </Text>
      </View>*/}
    </View>
  );
};
