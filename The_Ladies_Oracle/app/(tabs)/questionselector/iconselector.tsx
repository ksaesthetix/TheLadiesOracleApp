import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LoadingView, PageHeader, Screen } from '../../../components/ui';
import { cardShadow, radius, spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

export const options = { headerShown: false };
const API_URL = 'https://theladiesoracleapp.onrender.com';

type IconDoc = {
  _id: string;
  symbol: string;
};

const COLUMNS = 4;
const GRID_GAP = spacing.md;

export default function IconSelector() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const { question, questionText } = useLocalSearchParams(); // ✅ Receive question param

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
    return <LoadingView message="Gathering the symbols..." />;
  }

  // Square tiles that fill the row evenly regardless of device width.
  const tileSize = Math.floor((width - spacing.xl * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <Screen edges={['top']} decor>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          eyebrow="Step 2 of 3"
          title="Ask the Oracle"
          subtitle="Let your intuition choose your icon..."
          align="center"
        />
        <View style={styles.grid}>
          {icons.map(iconDoc => (
            <Pressable
              key={iconDoc._id}
              onPress={() => {
                console.log(`✅ Selected Icon ID: ${iconDoc._id}`);
                console.log(`✅ Selected Symbol: ${iconDoc.symbol}`);
                router.push({
                  pathname: '/questionselector/answerpage',
                  params: {
                    icon_id: iconDoc._id,
                    question: question,
                    questionText: questionText,
                  }
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Icon ${iconDoc.symbol}`}
              style={({ pressed }) => [
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: pressed ? colors.accentSoft : colors.surface,
                  borderColor: pressed ? colors.accent : colors.border,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
                cardShadow(theme),
              ]}
            >
              <Text style={[styles.symbol, { color: colors.primary }]}>{iconDoc.symbol}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    // Fill the space between the safe-area top and the tab bar, and centre
    // the header + grid block inside it. Still scrolls if it doesn't fit.
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GRID_GAP,
    paddingTop: spacing.lg,
  },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    // Intentionally no custom fontFamily: symbols need the system font's glyph coverage.
    fontSize: 30,
    textAlign: 'center',
  },
});