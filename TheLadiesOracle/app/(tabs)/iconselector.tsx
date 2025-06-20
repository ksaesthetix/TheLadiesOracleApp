import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import globalStyles from '../../constants/styles';
import { useRouter } from 'expo-router';

export const options = { headerShown: false };

export default function PageTwo() {
  const router = useRouter();
  const [selectedIcon, setSelectedIcon] = useState<number | null>(null);

  const icons = [
    <Ionicons name="moon-outline" size={32} color={globalStyles.buttonText.color} />,
    <Ionicons name="star-outline" size={32} color={globalStyles.buttonText.color} />,
    <Ionicons name="heart-outline" size={32} color={globalStyles.buttonText.color} />,
    <MaterialCommunityIcons name="star-four-points-outline" size={32} color={globalStyles.buttonText.color} />,
  ];

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>ASK THE ORACLE</Text>
      <Text style={globalStyles.subtitle}>Let your intuition choose your icon...</Text>
      <View style={globalStyles.iconGrid}>
        {icons.map((icon, idx) => (
          <TouchableOpacity
            key={idx}
            style={globalStyles.iconCircle}
            onPress={() => {
              setSelectedIcon(idx);
              router.push({ pathname: '/questionselector', params: { icon: idx } });
            }}
            activeOpacity={0.7}
          >
            {icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

