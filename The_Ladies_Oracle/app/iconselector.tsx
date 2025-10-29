import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import globalStyles from '../constants/styles';

export const options = { headerShown: false };

const API_URL = 'https://theladiesoracleapp.onrender.com';

type IconDoc = {
  _id: string;
  symbol: string;
};

export default function IconSelector() {
  const router = useRouter();
  const [icons, setIcons] = useState<IconDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/icons`)
      .then(res => res.json())
      .then(data => {
        setIcons(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#000" />;
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>ASK THE ORACLE</Text>
      <Text style={globalStyles.subtitle}>Let your intuition choose your icon...</Text>
      <View style={globalStyles.iconGrid}>
        {icons.map(iconDoc => (
          <TouchableOpacity
            key={iconDoc._id}
            style={globalStyles.iconCircle}
            onPress={() => {
              console.log(`Selected Icon ID: ${iconDoc._id}`);
              console.log(`Selected Symbol: ${iconDoc.symbol}`);
              router.push({
                pathname: '/questionselector',
                params: { icon_id: iconDoc._id },
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={globalStyles.iconSymbol}>{iconDoc.symbol}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}