import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from "../contexts/AuthContext";
import { LoadingView } from '../../components/ui';
import { fonts } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {

  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

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
    return <LoadingView />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
        },
        headerStyle: { backgroundColor: theme.colors.headerBackground },
        headerShadowVisible: false,
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: fonts.serifSemiBold,
          fontSize: 18,
          color: theme.colors.text,
        },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index"
      options={{title: "Home", headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />}} />

      {/*<Tabs.Screen name="friends"
      options={{title: "Friends",headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome6 name="user-group" size={size} color={color} />}} />*/}
      <Tabs.Screen name="questionselector"
      options={{title: "The Oracle", headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome5 name="hamsa" size={size} color={color} />}} />
      <Tabs.Screen name="chart"
      options={{ title: 'Chart', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome5 name="star-and-crescent" size={size} color={color} />,}}/>
      <Tabs.Screen name="today"
      options={{title: "Today",headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="sun-o" size={size} color={color} />}} />
      <Tabs.Screen name="profile"
      options={{title: "Profile",headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />}} />

      
      {/*<Tabs.Screen
        name="settings"
        options={{href: null,headerShown: true, title: "Settings"}}/>*/}


    </Tabs>
  );
}
