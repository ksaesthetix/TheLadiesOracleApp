import React, { useEffect, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText, Chip, LoadingView, PageHeader, Screen } from "../../components/ui";
import { cardShadow, radius, spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

const API_URL = "https://theladiesoracleapp.onrender.com";

type Question = { _id: string; number?: number; question?: string; category?: string };

export const options = { headerShown: false };

export default function QuestionSelector() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/questions`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        if (!text) throw new Error("Empty response from /questions");
        const data = JSON.parse(text);
        const sorted = data.sort((a: Question, b: Question) => (a.number ?? 0) - (b.number ?? 0));
        setQuestions(sorted);
        // derive categories from fetched questions
        const derived = Array.from(new Set(sorted.map((q: any) => q.category).filter(Boolean))) as string[];
        setCategories(["All", ...derived]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingView message="Gathering the questions..." />;
  }

  const visibleQuestions =
    selectedCategory === "All" ? questions : questions.filter((q) => q.category === selectedCategory);

  return (
    <Screen edges={['top']} padded={false} decor>
      {/* Fixed Header */}
      <View style={styles.header}>
        <PageHeader
          eyebrow="Step 1 of 3"
          title="Ask the Oracle"
          subtitle="Choose the question weighing on your mind."
        />
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipStrip}
        contentContainerStyle={styles.chipRow}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            active={cat === selectedCategory}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Scrollable Question List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleQuestions.map((q) => (
          <Pressable
            key={q._id}
            onPress={() => {
              console.log(`✅ Selected Question Number: ${q.number}`);
              console.log(`✅ Selected Question Text: ${q.question}`);
              router.push({
                pathname: "/iconselector",
                params: { question: q.number?.toString() },
              });
            }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border },
              cardShadow(theme),
              pressed && { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.numberBadge, { backgroundColor: colors.primarySoft }]}>
              <AppText variant="label" tone="primary">{q.number}</AppText>
            </View>
            <AppText variant="body" style={styles.questionText}>{q.question}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
  },
  chipStrip: {
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  questionText: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
