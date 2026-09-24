import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { fonts } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * The five tabs. Auth is handled once, in the root layout (app/_layout.tsx) — nothing here
 * redirects, so root modals (Date of Birth, Birthplace, paywall, welcome) open freely over the tabs.
 */
export default function TabLayout() {
  const theme = useTheme();

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
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="questionselector"
        options={{ title: 'The Oracle', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome5 name="hamsa" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chart"
        options={{ title: 'Chart', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome5 name="star-and-crescent" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="sun-o" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false, tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}