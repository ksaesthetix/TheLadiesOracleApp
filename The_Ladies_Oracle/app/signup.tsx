import React, { useState } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { startOnboarding } from '../lib/onboarding';
import { AppText, Button, Card, Logo, PageHeader, Screen, TextField } from '../components/ui';
import { spacing } from '../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../constants/links';
import { friendlyAuthError, signUpWithEmail } from '../lib/account';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Please tell us your first name.';
    if (!EMAIL_RE.test(email.trim())) return 'That doesn’t look like an email address.';
    if (password.length < 8) return 'Choose a password of at least 8 characters.';
    if (password !== confirm) return 'The two passwords don’t match.';
    return null;
  };

  const handleOnPressSignup = async () => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError(null);
    setBusy(true);
    try {
      await signUpWithEmail({ firstName, lastName, email, password });
      // Birthplace → birth date & time → choose a circle → welcome tour → Home.
      startOnboarding(router);
    } catch (err: any) {
      const message = friendlyAuthError(err?.code, err?.message);
      setError(message);
      if (err?.code === 'auth/email-already-in-use') {
        Alert.alert('Already registered', message, [
          { text: 'Log in', onPress: () => router.replace('/login') },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll edges={['bottom']} decor keyboardAvoiding contentStyle={styles.content}>
      <Logo width={210} style={styles.logo} />

      <PageHeader
        eyebrow="Begin your journey"
        title="Create your account"
        subtitle="Tell the Oracle a little about yourself."
        align="center"
      />

      <Card>
        <TextField
          label="First Name"
          icon="person-outline"
          placeholder="First Name"
          underlineColorAndroid="transparent"
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          maxLength={50}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextField
          label="Last Name"
          icon="person-outline"
          placeholder="Last Name"
          underlineColorAndroid="transparent"
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          maxLength={50}
          value={lastName}
          onChangeText={setLastName}
          containerStyle={styles.field}
        />
        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          underlineColorAndroid="transparent"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={80}
          value={email}
          onChangeText={setEmail}
          containerStyle={styles.field}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          placeholder="At least 8 characters"
          underlineColorAndroid="transparent"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={64}
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.field}
        />
        <TextField
          label="Confirm Password"
          icon="lock-closed-outline"
          placeholder="Once more"
          underlineColorAndroid="transparent"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={64}
          value={confirm}
          onChangeText={setConfirm}
          onSubmitEditing={handleOnPressSignup}
          containerStyle={styles.field}
        />

        {error && (
          <AppText variant="caption" tone="danger" style={styles.error}>{error}</AppText>
        )}

        <Button title="Create Account" onPress={handleOnPressSignup} loading={busy} disabled={busy} style={styles.submit} />

        <AppText variant="caption" tone="muted" align="center" style={styles.terms}>
          By creating an account you agree to our{' '}
          <AppText variant="caption" tone="primary" onPress={() => Linking.openURL(TERMS_URL)}>Terms</AppText>
          {' '}and{' '}
          <AppText variant="caption" tone="primary" onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</AppText>.
        </AppText>
      </Card>

      <View style={styles.footerRow}>
        <AppText variant="body" tone="secondary" align="center">
          Already have an account?{' '}
          <AppText variant="bodyStrong" tone="primary" onPress={() => router.replace('/login')}>
            Log in here
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
  field: {
    marginTop: spacing.lg,
  },
  error: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
  },
  terms: {
    marginTop: spacing.md,
  },
  footerRow: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
});
