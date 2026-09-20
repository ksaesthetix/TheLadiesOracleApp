import * as React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, Logo, PageHeader, Screen, TextField } from '../components/ui';
import { spacing } from '../constants/theme';

export default function SignUp() {
  const handleOnPressSignup = () => {
    alert('Registration Successful!')
  }

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
          maxLength={50}
        />
        <TextField
          label="Last Name"
          icon="person-outline"
          placeholder="Last Name"
          underlineColorAndroid="transparent"
          maxLength={50}
          containerStyle={styles.field}
        />
        <TextField
          label="Username"
          icon="at-outline"
          placeholder="Username"
          underlineColorAndroid="transparent"
          autoCapitalize="none"
          maxLength={50}
          containerStyle={styles.field}
        />

        <Button title="Create Account" onPress={handleOnPressSignup} style={styles.submit} />
      </Card>

      <View style={styles.footerRow}>
        <AppText variant="body" tone="secondary" align="center">
          Already have an account?{' '}
          <AppText variant="bodyStrong" tone="primary" onPress={() => router.push('/login')}>
            Login here
          </AppText>
        </AppText>
      </View>

      <AppText variant="caption" tone="muted" align="center" style={styles.legal}>
        2025{' '}
        <AppText
          variant="caption"
          tone="primary"
          onPress={() => Linking.openURL('https://theladiesoracle.com/')}
        >
          theladiesoracle
        </AppText>{' '}
        App v1.0
      </AppText>
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
  field: {
    marginTop: spacing.lg,
  },
  submit: {
    marginTop: spacing.xxl,
  },
  footerRow: {
    marginTop: spacing.xxl,
  },
  legal: {
    marginTop: spacing.xxxl,
  },
});
