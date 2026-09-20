import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppText, Card, PageHeader, Screen } from '../../../components/ui';
import { fonts, spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

const API_URL = 'https://theladiesoracleapp.onrender.com';

export default function AnswerPage() {
  const { icon_id, question} = useLocalSearchParams();
  const { colors } = useTheme();

  // Normalize params
  const iconValue = Array.isArray(icon_id) ? icon_id[0] : icon_id;
  const questionValue = Array.isArray(question) ? question[0] : question;

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        const requestUrl = `${API_URL}/oracle-answer?question=${questionValue}&icon_id=${iconValue}`;
        const res = await fetch(requestUrl);

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();
        console.log(`✅ Final Answer: Icon ID: ${data.icon_id} | Icon Symbol: ${data.iconSymbol} | Question: ${data._id} | Answer Page: ${data.page} | Answer: ${data.answer}`);
        setAnswer(data.answer || 'The Oracle is silent...');
      } catch (error) {
        console.error('❌ Error fetching answer:', error);
        setAnswer('Error fetching answer.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, [iconValue, questionValue]);

  return (
    <Screen scroll edges={['bottom']} decor contentStyle={styles.content}>
      <PageHeader
        eyebrow="Step 3 of 3"
        title="The Oracle Speaks"
        subtitle={`Question #${questionValue}`}
        align="center"
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="caption" tone="muted" align="center" style={styles.loadingText}>
            Consulting the Oracle...
          </AppText>
        </View>
      ) : (
        <Card style={styles.answerCard}>
          <AppText style={[styles.quoteMark, { color: colors.accent }]}>“</AppText>
          <AppText variant="quote" align="center">{answer}</AppText>
          <View style={styles.ornament}>
            <View style={[styles.rule, { backgroundColor: colors.accent }]} />
            <Ionicons name="sparkles" size={16} color={colors.accent} style={styles.ornamentIcon} />
            <View style={[styles.rule, { backgroundColor: colors.accent }]} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  loading: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  loadingText: {
    marginTop: spacing.lg,
  },
  answerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  quoteMark: {
    fontFamily: fonts.serifBold,
    fontSize: 64,
    lineHeight: 64,
    marginBottom: -spacing.lg,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  rule: {
    width: 40,
    height: 1,
    opacity: 0.7,
  },
  ornamentIcon: {
    marginHorizontal: spacing.md,
  },
});
