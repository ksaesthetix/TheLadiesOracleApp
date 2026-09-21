import React, { useEffect, useState } from "react";
import { Alert, View, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText, Button, Card, Chip, LoadingView, PageHeader, Screen } from "../../../components/ui";
import { OracleRestCard } from "../../../components/OracleRestCard";
import { cardShadow, radius, spacing } from "../../../constants/theme";
import { useTheme } from "../../../hooks/useTheme";
import { useOracleStatus } from "../../../hooks/usePlan";
import { allowanceLine, formatResetDate } from "../../../lib/plans";

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
  const { state: access, refresh } = useOracleStatus();

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

  if (loading || access.status === "loading") {
    return <LoadingView message="Gathering the questions..." />;
  }

  const visibleQuestions =
    selectedCategory === "All" ? questions : questions.filter((q) => q.category === selectedCategory);

  const status = access.status === "ready" ? access.data : null;
  const unveiled = status?.unveiled ?? null; // null = every question open
  const remaining = status?.remaining ?? null;
  const exhausted = remaining === 0;

  const openPlans = () => router.push("/paywall");

  const onPick = (q: Question) => {
    if (exhausted && status) {
      Alert.alert(
        "That’s your week",
        `You have asked your ${status.limit} question${status.limit === 1 ? "" : "s"} this week. The Oracle returns on ${formatResetDate(status.resetsOn)}.`,
        [{ text: "See plans", onPress: openPlans }, { text: "OK", style: "cancel" }],
      );
      return;
    }
    if (unveiled && q.number !== undefined && !unveiled.includes(q.number)) {
      Alert.alert(
        "Not unveiled today",
        `The Oracle unveils ${status?.unveilPerCategory ?? 3} questions from each theme every day. This one comes round again soon — or Lifetime Elite opens every question, every day.`,
        [{ text: "See plans", onPress: openPlans }, { text: "OK", style: "cancel" }],
      );
      return;
    }
    console.log(`✅ Selected Question Number: ${q.number}`);
    router.push({
      pathname: "/questionselector/iconselector",
      params: { question: q.number?.toString(), questionText: q.question },
    });
  };

  return (
    <Screen edges={['top']} padded={false} decor>
      {/* Fixed Header */}
      <View style={styles.header}>
        <PageHeader
          eyebrow="Step 1 of 3"
          title="Ask the Oracle"
          subtitle="Choose the question weighing on your mind."
        />
        {status && !status.blockout && (
          <Pressable onPress={openPlans} style={styles.allowance} accessibilityRole="button">
            <Ionicons name={exhausted ? "hourglass-outline" : "sparkles-outline"} size={14} color={exhausted ? colors.textMuted : colors.accent} />
            <AppText variant="caption" tone={exhausted ? "muted" : "secondary"} style={styles.allowanceText}>
              {allowanceLine(status.remaining, status.limit)} · {status.plan.name}
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {access.status === "signed-out" && (
        <View style={styles.notice}>
          <Card>
            <AppText variant="heading">Log in to ask the Oracle</AppText>
            <AppText variant="body" tone="secondary" style={styles.para}>Your questions and answers are kept in your Journal, so the Oracle needs to know who is asking.</AppText>
            <Button title="Log in" onPress={() => router.push("/login")} style={styles.cta} />
          </Card>
        </View>
      )}

      {access.status === "error" && (
        <View style={styles.notice}>
          <Card>
            <AppText variant="heading">The Oracle is waking</AppText>
            <AppText variant="body" tone="secondary" style={styles.para}>{access.message}</AppText>
            <Button title="Try again" variant="outline" onPress={() => refresh()} style={styles.cta} />
          </Card>
        </View>
      )}

      {status?.blockout && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <OracleRestCard day={status.blockoutDay} />
        </ScrollView>
      )}

      {status && !status.blockout && (
        <>
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
            {visibleQuestions.map((q) => {
              const locked = !!unveiled && q.number !== undefined && !unveiled.includes(q.number);
              const dimmed = locked || exhausted;
              return (
                <Pressable
                  key={q._id}
                  onPress={() => onPick(q)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: dimmed }}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    cardShadow(theme),
                    dimmed && { backgroundColor: colors.surfaceAlt, opacity: 0.72 },
                    pressed && { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={[styles.numberBadge, { backgroundColor: dimmed ? colors.border : colors.primarySoft }]}>
                    <AppText variant="label" tone={dimmed ? "muted" : "primary"}>{q.number}</AppText>
                  </View>
                  <View style={styles.questionText}>
                    <AppText variant="body" tone={dimmed ? "secondary" : undefined}>{q.question}</AppText>
                    {locked && <AppText variant="caption" tone="muted">Veiled today</AppText>}
                  </View>
                  <Ionicons name={locked ? "lock-closed-outline" : "chevron-forward"} size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
            {unveiled && (
              <AppText variant="caption" tone="muted" align="center" style={styles.foot}>
                {status.unveilPerCategory} questions from each theme are unveiled every day. Veiled ones return in turn.
              </AppText>
            )}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
  },
  allowance: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  allowanceText: {
    marginHorizontal: spacing.xs,
  },
  notice: {
    paddingHorizontal: spacing.xl,
  },
  para: { marginTop: spacing.xs },
  cta: { marginTop: spacing.md },
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
  foot: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
