import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { AppText, Button, Card, Logo, PageHeader, Screen, TextField } from '../components/ui';
import { spacing } from '../constants/theme';
import { ensureUserDocs, friendlyAuthError } from '../lib/account';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnPressSignin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Accounts from before the profiles collection existed get their documents here.
      await ensureUserDocs(cred.user).catch(err => console.warn('[login] ensureUserDocs:', err?.message));
      router.replace('/');
    } catch (err: any) {
      setError(friendlyAuthError(err?.code, err?.message));
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then tap “Forgot password”.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your inbox', `If ${email.trim()} has an account, a reset link is on its way.`);
    } catch (err: any) {
      setError(friendlyAuthError(err?.code, err?.message));
    }
  };

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
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={80}
          onChangeText={setEmail}
          value={email}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          placeholder="Password"
          underlineColorAndroid="transparent"
          secureTextEntry={true}
          autoComplete="current-password"
          textContentType="password"
          maxLength={64}
          onChangeText={setPassword}
          value={password}
          onSubmitEditing={handleOnPressSignin}
          containerStyle={styles.passwordField}
        />

        {error && (
          <AppText variant="caption" tone="danger" style={styles.error}>{error}</AppText>
        )}

        <Button title="Log In" onPress={handleOnPressSignin} loading={busy} disabled={busy} style={styles.submit} />

        <AppText variant="caption" tone="primary" align="center" onPress={handleForgotPassword} style={styles.forgot}>
          Forgot password?
        </AppText>
      </Card>

      <View style={styles.footerRow}>
        <AppText variant="body" tone="secondary" align="center">
          Don’t have an account?{' '}
          <AppText variant="bodyStrong" tone="primary" onPress={() => router.replace('/signup')}>
            Sign up here
          </AppText>
        </AppText>
      </View>
    </Screen>
  );
}

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
  error: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
  },
  forgot: {
    marginTop: spacing.md,
  },
  footerRow: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
});
