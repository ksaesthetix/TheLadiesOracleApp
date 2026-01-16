
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Correct path
import { ActivityIndicator, View } from 'react-native';
import { WisdomArchiveProvider } from './contexts/WisdomArchiveContext';

const StackLayout = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; 

    const authRoutes = ['login', 'signup', 'dateofbirth'];
    // Correctly determine if the user is in an authentication-related route.
    const inAuthRoute = segments.length > 0 && authRoutes.includes(segments[0] as string);

    // If the user is not signed in and they are not on an auth screen, 
    // redirect them to the login screen.
    if (!user && !inAuthRoute) {
      router.replace('/login');
    }
    // If the user IS signed in and they ARE on an auth screen, 
    // redirect them away from it to their profile.
    else if (user && inAuthRoute) {
      router.replace('/profile');
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login", presentation: 'modal' }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up", presentation: 'modal' }} />
      <Stack.Screen name="dateofbirth" options={{ title: "Enter Your Birth Date", presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ title: "My Profile" }} />
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
