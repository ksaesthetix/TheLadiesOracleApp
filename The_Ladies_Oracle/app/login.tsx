import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { AppText, Button, Card, Logo, PageHeader, Screen, TextField } from '../components/ui';
import { spacing } from '../constants/theme';

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
    <Screen scroll edges={['bottom']} decor keyboardAvoiding contentStyle={styles.content}>
      <Logo width={210} style={styles.logo} />

      <PageHeader
        eyebrow="Welcome back"
        title="Log in to your Oracle"
        subtitle="Enter your details to continue."
        align="center"
      />

      <Card>
        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="Email"
          underlineColorAndroid="transparent"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={40}
          onChangeText={setEmail}
          value={email}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          placeholder="Password"
          underlineColorAndroid="transparent"
          secureTextEntry={true}
          maxLength={20}
          onChangeText={setPassword}
          value={password}
          containerStyle={styles.passwordField}
        />

        <Button title="Log In" onPress={handleOnPressSignin} style={styles.submit} />
      </Card>

      <View style={styles.footerRow}>
        <AppText variant="body" tone="secondary" align="center">
          Don’t have an account?{' '}
          <AppText variant="bodyStrong" tone="primary" onPress={() => router.push('/signup')}>
            Sign up here
          </AppText>
        </AppText>
      </View>
      {/*
      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>
          2025 <Text onPress={() => Linking.openURL('https://theladiesoracle.com/')} style={{ color: '#1e3274' }}>theladiesoracle</Text> App v1.0
        </Text>
      </View>*/}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  logo: {
    marginBottom: spacing.sm,
  },
  passwordField: {
    marginTop: spacing.lg,
  },
  submit: {
    marginTop: spacing.xxl,
  },
  footerRow: {
    marginTop: spacing.xxl,
  },
});
