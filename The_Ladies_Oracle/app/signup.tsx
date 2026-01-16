import * as React from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Image, TextInput, TouchableHighlight, Linking } from 'react-native';
import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import globalStyles from '../constants/styles';
const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const handleOnPressSignup = () => {
    alert('Registration Successful!')
  }
  
  return (
    <View style={globalStyles.container}>
      <ScrollView>
        <View style={{ marginTop: -100 }}>
          <Image 
            source={{ uri: '.' }} 
            style={globalStyles.logoImage}
          />
        </View>
        <Text style={globalStyles.paragraph}>
          Sign Up
        </Text>
        <View>
          <View style={globalStyles.textInputView}>
            <TextInput 
              style={globalStyles.textInputStyle}
              placeholder="First Name"
              placeholderTextColor="#808080"
              underlineColorAndroid="transparent"
              maxLength={50}
            />
          </View>
          <View style={globalStyles.textInputView}>
            <TextInput 
              style={globalStyles.textInputStyle}
              placeholder="Last Name"
              placeholderTextColor="#808080"
              underlineColorAndroid="transparent"
              maxLength={50}
            />
          </View>          
          <View style={globalStyles.textInputView}>
            <TextInput 
              style={globalStyles.textInputStyle}
              placeholder="Username"
              placeholderTextColor="#808080"
              underlineColorAndroid="transparent"
              maxLength={50}
            />
          </View>
        </View>
        
        <TouchableHighlight activeOpacity={1} underlayColor={"#ad1111"} style={globalStyles.signupButton} onPress={handleOnPressSignup}>
          <Text style={globalStyles.signupButtonText}>Create Account</Text>
        </TouchableHighlight>

        <Text style={globalStyles.loginText}>
          Already have an account?{' '}
          <Text style={globalStyles.loginLink} onPress={() => router.push('/login')}>
            Login here
          </Text>
        </Text>
      </ScrollView>
      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>
          2025 <Text onPress={() => Linking.openURL('https://theladiesoracle.com/')} style={{ color: '#1e3274' }}>theladiesoracle</Text> App v1.0
        </Text>
      </View>
    </View>
  );
};