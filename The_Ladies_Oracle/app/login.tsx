import * as React from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView, Image, TextInput, TouchableHighlight, Linking } from 'react-native';
import Constants from 'expo-constants';
import globalStyles from '../constants/styles';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
const { width, height } = Dimensions.get('window');

export default function App() {

  const handleOnPressSignin = () => {
    alert('Yahoooooo!!!!!!!!')
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
              maxLength={20}
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
      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>
          2025 <Text onPress={() => Linking.openURL('https://theladiesoracle.com/')} style={{ color: '#1e3274' }}>theladiesoracle</Text> App v1.0
        </Text>
      </View>
    </View>
  );
};

