
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ActivityIndicator, View } from 'react-native';
import { WisdomArchiveProvider } from './contexts/WisdomArchiveContext';

const StackLayout = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; 

    const authRoutes = ['login', 'signup', 'dateofbirth'];
    const inAuthRoute = segments.length > 0 && authRoutes.includes(segments[0] as string);

    if (!user && !inAuthRoute) {
      router.replace('/login');
    }
    else if (user && inAuthRoute) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login", presentation: 'modal' }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up", presentation: 'modal' }} />
      <Stack.Screen name="dateofbirth" options={{ title: "Enter Your Birth Date", presentation: 'modal' }} />
      <Stack.Screen name="edit_profile" options={{ title: "Edit Profile" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WisdomArchiveProvider>
        <StackLayout />
      </WisdomArchiveProvider>
    </AuthProvider>
  );
}
