import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View } from 'react-native';
import { WisdomArchiveProvider } from '../contexts/WisdomArchiveContext';

export default function TabLayout() {

  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; 

    const authRoutes = ['login', 'signup', 'dateofbirth'];
    const inAuthRoute = segments.length > 0 && authRoutes.includes(segments[0] as string);

    if (!user && !inAuthRoute) {
      router.replace('../login');
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
    <Tabs>
      <Tabs.Screen name="index" 
      options={{title: "Home", headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />}} />

      <Tabs.Screen name="friends"
      options={{title: "Friends",headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome6 name="user-group" size={size} color={color} />}} />
      <Tabs.Screen name="questionselector" 
      options={{title: "Ask the Oracle", headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome5 name="hamsa" size={size} color={color} />}} />
      
      <Tabs.Screen name="profile"
      options={{title: "You",headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />}} />



      <Tabs.Screen
        name="settings"
        options={{href: null,headerShown: true, title: "Settings"}}/>
    
    
    </Tabs>
  );
}