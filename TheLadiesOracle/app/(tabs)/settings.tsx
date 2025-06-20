import { Image } from 'expo-image';
import { Platform, Switch, View } from 'react-native';
import globalStyles from '../../constants/styles';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';

export default function TabTwoScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear"
          style={globalStyles.headerImage}
        />
      }>
      <ThemedView style={globalStyles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      <View style={globalStyles.settingRow}>
        <ThemedText>Enable Notifications</ThemedText>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>
      <View style={globalStyles.settingRow}>
        <ThemedText>Dark Mode</ThemedText>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
        />
      </View>
      <View style={globalStyles.settingRow}>
        <ThemedText>About</ThemedText>
        <ThemedText style={globalStyles.aboutText}>
          The Ladies Oracle v1.0{'\n'}© 2025
        </ThemedText>
      </View>
    </ParallaxScrollView>
  );
}
