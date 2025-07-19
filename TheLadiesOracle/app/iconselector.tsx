import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import globalStyles from '../constants/styles';
import { useRouter } from 'expo-router';

export const options = { headerShown: false };

type IconDoc = { _id: string; symbol: string };

export default function PageTwo() {
  const router = useRouter();
  const [icons, setIcons] = useState<IconDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://congenial-tribble-4rqj6wr7vwv27wqj-3000.app.github.dev/icons')
      .then(res => res.json())
      .then(data => {
        setIcons(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>ASK THE ORACLE</Text>
      <Text style={globalStyles.subtitle}>Let your intuition choose your icon...</Text>
      <View style={globalStyles.iconGrid}>
        {icons.map((iconDoc, idx) => (
          <TouchableOpacity
            key={iconDoc._id}
            style={globalStyles.iconCircle}
            onPress={() => router.push({ pathname: '/questionselector', params: { icon: idx } })}
            activeOpacity={0.7}
          >
            <Text style={globalStyles.iconSymbol}>{iconDoc.symbol}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

