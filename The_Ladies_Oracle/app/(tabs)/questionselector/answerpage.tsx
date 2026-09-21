import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../../../components/ui';
import { fonts, spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { saveOracleAnswer } from '../../../hooks/useJournal';
import { auth } from '../../../firebaseConfig';
import { allowanceLine, formatResetDate } from '../../../lib/plans';

const API_URL = 'https://theladiesoracleapp.onrender.com';

type Usage = { used: number; limit: number | null; remaining: number | null; weekKey: string; resetsOn: string };
type Blocked =
  | { kind: 'limit'; limit: number | null; resetsOn: string }
  | { kind: 'blockout'; day: string }
  | { kind: 'locked' }
  | { kind: 'signed-out' }
  | { kind: 'error'; message: string };

export default function AnswerPage() {
  const router = useRouter();
  const { icon_id, question, questionText } = useLocalSearchParams();
  const { colors } = useTheme();

  // Normalize params
  const iconValue = Array.isArray(icon_id) ? icon_id[0] : icon_id;
  const questionValue = Array.isArray(question) ? question[0] : question;
  const questionTextValue = Array.isArray(questionText) ? questionText[0] : questionText;

  const [answer, setAnswer] = useState('');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [loading, setLoading] = useState(true);
  const saved = useRef(false); // one journal entry per consultation

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setBlocked({ kind: 'signed-out' }); return; }
        const token = await user.getIdToken();
        const requestUrl = `${API_URL}/oracle-answer?question=${questionValue}&icon_id=${iconValue}`;
        const res = await fetch(requestUrl, { headers: { Authorization: `Bearer ${token}` } });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 402) setBlocked({ kind: 'limit', limit: err.limit ?? null, resetsOn: err.resetsOn ?? '' });
          else if (res.status === 423) setBlocked({ kind: 'blockout', day: err.day ?? 'Sunday' });
          else if (res.status === 403) setBlocked({ kind: 'locked' });
          else if (res.status === 401) setBlocked({ kind: 'signed-out' });
          else throw new Error(err.error || `Fetch failed: ${res.status}`);
          return;
        }

        const data = await res.json();
        console.log(`✅ Final Answer: Icon ID: ${data.icon_id} | Icon Symbol: ${data.iconSymbol} | Question: ${data.question} | Answer Page: ${data.page} | Answer: ${data.answer}`);
        setAnswer(data.answer || 'The Oracle is silent...');
        if (data.usage) setUsage(data.usage);

        // Journal it (signed-in users only; addJournalEntry is a no-op otherwise)
        if (data.answer && !saved.current) {
          saved.current = true;
          saveOracleAnswer({
            question: questionTextValue || `#${questionValue}`,
            iconSymbol: data.iconSymbol,
            answer: data.answer,
          }).catch(err => console.warn('[journal] oracle answer not saved:', err?.message));
        }
      } catch (error) {
        console.error('❌ Error fetching answer:', error);
        setBlocked({ kind: 'error', message: 'The Oracle could not be reached. Please try again in a moment.' });
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, [iconValue, questionValue]);

  const backToQuestions = () => router.replace('/questionselector');

  return (
    <Screen scroll edges={['bottom']} decor contentStyle={styles.content}>
      <PageHeader
        eyebrow="Step 3 of 3"
        title="The Oracle Speaks"
        subtitle={questionTextValue ? String(questionTextValue) : `Question #${questionValue}`}
        align="center"
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="caption" tone="muted" align="center" style={styles.loadingText}>
            Consulting the Oracle...
          </AppText>
        </View>
      )}

      {!loading && blocked && (
        <Card style={styles.blockedCard}>
          <IconBubble
            name={blocked.kind === 'limit' ? 'hourglass-outline' : blocked.kind === 'blockout' ? 'moon-outline' : blocked.kind === 'locked' ? 'lock-closed-outline' : 'alert-circle-outline'}
            tone="primary"
            size={48}
          />
          <AppText variant="heading" align="center" style={styles.blockedTitle}>
            {blocked.kind === 'limit' && 'That’s your week'}
            {blocked.kind === 'blockout' && `The Oracle rests on ${blocked.day}s`}
            {blocked.kind === 'locked' && 'Not unveiled today'}
            {blocked.kind === 'signed-out' && 'Log in to ask the Oracle'}
            {blocked.kind === 'error' && 'The Oracle is quiet'}
          </AppText>
          <AppText variant="body" tone="secondary" align="center" style={styles.blockedBody}>
            {blocked.kind === 'limit' && `You have asked your ${blocked.limit ?? ''} questions this week.${blocked.resetsOn ? ` The Oracle returns on ${formatResetDate(blocked.resetsOn)}.` : ''}`}
            {blocked.kind === 'blockout' && 'No questions today — but your birth chart and today’s sky are always open.'}
            {blocked.kind === 'locked' && 'This question comes round again soon. Lifetime Elite opens every question, every day.'}
            {blocked.kind === 'signed-out' && 'Your questions and answers are kept in your Journal, so the Oracle needs to know who is asking.'}
            {blocked.kind === 'error' && blocked.message}
          </AppText>
          {(blocked.kind === 'limit' || blocked.kind === 'locked') && (
            <Button title="See plans" onPress={() => router.push('../../paywall')} style={styles.blockedCta} />
          )}
          {blocked.kind === 'blockout' && (
            <Button title="Read your birth chart" onPress={() => router.push('/chart')} style={styles.blockedCta} />
          )}
          {blocked.kind === 'signed-out' && (
            <Button title="Log in" onPress={() => router.push('/login')} style={styles.blockedCta} />
          )}
          <Button title="Back to the questions" variant="ghost" onPress={backToQuestions} style={styles.blockedSecondary} />
        </Card>
      )}

      {!loading && !blocked && (
        <>
          <Card style={styles.answerCard}>
            <AppText style={[styles.quoteMark, { color: colors.accent }]}>“</AppText>
            <AppText variant="quote" align="center">{answer}</AppText>
            <View style={styles.ornament}>
              <View style={[styles.rule, { backgroundColor: colors.accent }]} />
              <Ionicons name="sparkles" size={16} color={colors.accent} style={styles.ornamentIcon} />
              <View style={[styles.rule, { backgroundColor: colors.accent }]} />
            </View>
          </Card>
          {usage && (
            <AppText variant="caption" tone="muted" align="center" style={styles.usage}>
              {allowanceLine(usage.remaining, usage.limit)}
            </AppText>
          )}
        </>
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
  usage: {
    marginTop: spacing.md,
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
  blockedCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  blockedTitle: { marginTop: spacing.md },
  blockedBody: { marginTop: spacing.sm },
  blockedCta: { marginTop: spacing.lg, alignSelf: 'stretch' },
  blockedSecondary: { marginTop: spacing.xs, alignSelf: 'stretch' },
});
