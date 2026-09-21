import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWisdomArchive } from "../contexts/WisdomArchiveContext";
import {
  AppText,
  Button,
  Card,
  IconBubble,
  Logo,
  Screen,
} from "../../components/ui";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { TodaySkyCard } from '../../components/TodaySkyCard';
import { MoonRitualCard } from '../../components/MoonRitualCard';
import { addJournalEntry } from '../../hooks/useJournal';
import { useOnboarding } from '../../hooks/useOnboarding';
import { LuckyColourCard } from '../../components/LuckyColourCard';

const WISE_QUOTES = [
  "Wisdom begins in wonder.",
  "The only true wisdom is in knowing you know nothing.",
  "Patience is the companion of wisdom.",
  "Knowing yourself is the beginning of all wisdom.",
  "Turn your wounds into wisdom.",
  "Wisdom comes from experience.",
  "A wise man never knows all, only fools know everything.",
  "Silence is the sleep that nourishes wisdom.",
];

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const { addToArchive } = useWisdomArchive();
  const { seen: seenIntro } = useOnboarding();
  const introShown = useRef(false);

  // First launch on this device: show the walkthrough once the Home screen has settled.
  useEffect(() => {
    if (seenIntro !== false || introShown.current) return;
    introShown.current = true;
    setTimeout(() => router.push('/welcome'), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seenIntro]);

  const showRandomQuote = () => {
    const quote = WISE_QUOTES[Math.floor(Math.random() * WISE_QUOTES.length)];
    setCurrentQuote(quote);
    setModalVisible(true);
  };

  const handleSave = () => {
    addToArchive(currentQuote);
    addJournalEntry({ type: 'affirmation', text: currentQuote });
    setModalVisible(false);
  };

  return (
    <>
      <Screen scroll edges={['top']} decor>
        <View style={styles.hero}>
          <Logo width={200} />
          <AppText variant="overline" tone="accent" align="center" style={styles.eyebrow}>
            Welcome To
          </AppText>
          <AppText variant="display" align="center">
            The Ladies’ Oracle
          </AppText>
          <AppText variant="subtitle" tone="secondary" align="center" style={styles.tagline}>
            Guidance for the questions on your mind.
          </AppText>
        </View>

        {/* New Moon intention / Full Moon reflection — renders only around a lunation */}
        <MoonRitualCard />

        {/* Featured action */}
        <Pressable
          onPress={showRandomQuote}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card tone="primary">
            <View style={styles.featureRow}>
              <IconBubble name="sparkles-outline" tone="onPrimary" size={48} />
              <View style={styles.featureText}>
                <AppText variant="heading" tone="onPrimary">Daily Affirmation</AppText>
                <AppText variant="caption" tone="onPrimary" style={styles.featureCaption}>
                  A moment of wisdom to carry with you today.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
            </View>
          </Card>
        </Pressable>

        <TodaySkyCard onPress={() => router.push('/chart')} style={styles.skyCard} />
        <LuckyColourCard style={styles.skyCard} />
        {/*
        <AppText variant="overline" tone="muted" style={styles.sectionLabel}>
          Account
        </AppText>
        <Link href="./login" asChild>
          <Button
            title="Login"
            variant="outline"
            icon={<Ionicons name="log-in-outline" size={18} color={colors.primary} />}
          />
        </Link>
        <Link href="./signup" asChild>
          <Button
            title="Sign Up"
            variant="ghost"
            icon={<Ionicons name="person-add-outline" size={18} color={colors.textSecondary} />}
            style={styles.secondaryAction}
          />
        </Link>
        */}
      </Screen>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Card style={styles.modalCard}>
            <IconBubble name="sparkles" tone="accent" size={56} />
            <AppText variant="overline" tone="accent" align="center" style={styles.modalEyebrow}>
              Daily Affirmation
            </AppText>
            <AppText variant="quote" align="center" style={styles.modalQuote}>
              “{currentQuote}”
            </AppText>
            <Button title="Save to Archive" onPress={handleSave} style={styles.modalPrimary} />
            <Button
              title="Close"
              variant="ghost"
              onPress={() => setModalVisible(false)}
              style={styles.modalSecondary}
            />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  eyebrow: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xs,
  },
  tagline: {
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.lg,
    marginRight: spacing.sm,
  },
  featureCaption: {
    marginTop: 2,
    opacity: 0.85,
  },
  sectionLabel: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    borderRadius: radius.xl,
  },
  modalEyebrow: {
    marginTop: spacing.lg,
  },
  modalQuote: {
    marginTop: spacing.md,
  },
  modalPrimary: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
  modalSecondary: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  skyCard: {
    marginTop: spacing.md,
  },
});
