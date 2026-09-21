import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, TextField } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useJournal, upsertJournalEntry } from '../hooks/useJournal';
import { useNatalChart } from '../hooks/useNatalChart';
import { currentRitual } from '../lib/astrology/rituals';
import { SIGN_META } from '../lib/astrology/natal';
import { auth } from '../firebaseConfig';

/**
 * Appears on Home only around a New Moon (set an intention, ask the Oracle) or a Full
 * Moon (read back the intention, write what came of it). Hidden the rest of the month.
 * Drop `<MoonRitualCard />` into app/(tabs)/index.tsx above the Today's Sky card.
 */
export function MoonRitualCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const ritual = useMemo(() => currentRitual(), [new Date().getHours()]);
  const { byId } = useJournal(60);
  const { state: chartState } = useNatalChart();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!ritual || !auth.currentUser) return null;

  const chart = chartState.status === 'ready' ? chartState.chart : null;
  const { kind, lunation, hoursToExact, previousNewMoon } = ritual;
  const when = hoursToExact > 1 ? `in ${hoursToExact}h` : hoursToExact < -1 ? `${Math.abs(hoursToExact)}h ago` : 'now';
  const glyph = SIGN_META[lunation.sign].glyph;

  const intentionId = `intention-${lunation.id}`;
  const reflectionId = `reflection-${lunation.id}`;
  const existingIntention = kind === 'new' ? byId(intentionId) : previousNewMoon ? byId(`intention-${previousNewMoon.id}`) : null;
  const existingReflection = kind === 'full' ? byId(reflectionId) : null;

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      if (kind === 'new') {
        await upsertJournalEntry(intentionId, { type: 'intention', text, meta: { lunation: lunation.id, sign: lunation.sign }, chart });
      } else {
        await upsertJournalEntry(reflectionId, {
          type: 'reflection', text,
          meta: { lunation: lunation.id, sign: lunation.sign, intentionId: previousNewMoon ? `intention-${previousNewMoon.id}` : null },
          chart,
        });
      }
      setSaved(true);
      setText('');
    } finally { setSaving(false); }
  };

  return (
    <Card tone="alt" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.moon}>{kind === 'new' ? '🌑' : '🌕'}</Text>
        <View style={styles.headerText}>
          <AppText variant="overline" tone="accent">{kind === 'new' ? 'New Moon' : 'Full Moon'} · {when}</AppText>
          <AppText variant="heading">
            {kind === 'new' ? 'Set an intention' : 'What came of it?'}{' '}
            <Text style={{ color: colors.primary }}>{glyph}</Text>
          </AppText>
          <AppText variant="caption" tone="secondary">
            {kind === 'new'
              ? `The Moon is new in ${lunation.sign}: a quiet sky for beginnings. Name one thing you want this month.`
              : `The Moon is full in ${lunation.sign}: the month's harvest. Read back what you set at the New Moon.`}
          </AppText>
        </View>
      </View>

      {/* Full Moon: show the intention being answered */}
      {kind === 'full' && (
        <View style={[styles.quote, { borderLeftColor: colors.accent }]}>
          {existingIntention ? (
            <>
              <AppText variant="overline" tone="muted">Your New Moon intention</AppText>
              <AppText variant="quote">“{existingIntention.text}”</AppText>
            </>
          ) : (
            <AppText variant="caption" tone="muted">You didn't set an intention at the last New Moon — reflect on the fortnight anyway.</AppText>
          )}
        </View>
      )}

      {/* New Moon: show the saved intention */}
      {kind === 'new' && (existingIntention || saved) && (
        <View style={[styles.quote, { borderLeftColor: colors.accent }]}>
          <AppText variant="overline" tone="muted">Kept under this Moon</AppText>
          <AppText variant="quote">“{existingIntention?.text ?? text}”</AppText>
        </View>
      )}

      {kind === 'full' && existingReflection && (
        <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
          <AppText variant="overline" tone="muted">Your reflection</AppText>
          <AppText variant="body">{existingReflection.text}</AppText>
        </View>
      )}

      {/* Input */}
      {!(kind === 'new' && (existingIntention || saved)) && !(kind === 'full' && existingReflection) && (
        <TextField
          label={kind === 'new' ? 'This month, I intend to…' : 'Looking back…'}
          icon={kind === 'new' ? 'sparkles-outline' : 'book-outline'}
          placeholder={kind === 'new' ? 'e.g. say yes to one invitation a week' : 'e.g. I did ask — and the answer changed the plan'}
          value={text}
          onChangeText={setText}
        />
      )}

      <View style={styles.actions}>
        {!(kind === 'new' && (existingIntention || saved)) && !(kind === 'full' && existingReflection) && (
          <Button title={saving ? 'Saving…' : 'Keep it'} onPress={save} disabled={saving || !text.trim()} />
        )}
        <Button
          title="Ask the Oracle"
          variant="outline"
          onPress={() => router.push('/questionselector')}
          style={styles.secondary}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  moon: { fontSize: 36, lineHeight: 42, marginRight: spacing.md },
  headerText: { flex: 1 },
  quote: { marginTop: spacing.md, paddingLeft: spacing.md, borderLeftWidth: 3 },
  actions: { marginTop: spacing.md },
  secondary: { marginTop: spacing.sm },
});

export default MoonRitualCard;
