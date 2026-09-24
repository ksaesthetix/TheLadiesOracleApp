import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router/react-navigation";
// Per-weight imports keep the bundle small (the package root would pull in every weight).
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WisdomArchiveProvider } from '@/contexts/WisdomArchiveContext';
import { LoadingView } from '../components/ui';
import { fonts } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { endOnboarding, isOnboardingInProgress } from '../lib/onboarding';

// Keep the native splash visible until the custom fonts are ready.
SplashScreen.preventAutoHideAsync();

/** Screens a signed-out person may see. Everything else redirects to /login. */
const PUBLIC_ROUTES = ['login', 'signup'];

const StackLayout = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (loading) return;

    const first = segments.length > 0 ? (segments[0] as string) : '';
    const onPublicRoute = PUBLIC_ROUTES.includes(first);

    if (!user) {
      if (first !== 'signup') endOnboarding(); // a sign-out (or cold start) ends any journey; mid-sign-up we leave the flag alone
      if (!onPublicRoute) router.replace('/login');
      return;
    }

    // Signed in and still on login/signup: send them Home — unless a sign-up is mid-flight,
    // in which case signup.tsx is about to move them to the first onboarding step itself.
    if (onPublicRoute && !isOnboardingInProgress()) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.headerBackground },
        headerShadowVisible: false,
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: fonts.serifSemiBold,
          fontSize: 18,
          color: theme.colors.text,
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login", presentation: 'modal' }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up", presentation: 'modal' }} />
      <Stack.Screen name="locationdetails" options={{ title: "Birthplace", presentation: 'modal' }} />
      <Stack.Screen name="dateofbirth" options={{ title: "Date & Time of Birth", presentation: 'modal' }} />
      <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  );
}

/** Applies the app theme to React Navigation (headers, tab bar, transitions) and the status bar. */
const ThemedNavigation = () => {
  const theme = useTheme();
  const base = theme.dark ? NavigationDarkTheme : NavigationDefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <StackLayout />
    </NavigationThemeProvider>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <WisdomArchiveProvider>
        <ThemedNavigation />
      </WisdomArchiveProvider>
    </AuthProvider>
  );
}
