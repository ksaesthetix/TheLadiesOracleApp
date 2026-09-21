import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppText, Button, Card, IconBubble, TextField } from './ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useJournal, upsertJournalEntry } from '../hooks/useJournal';
import { useNatalChart } from '../hooks/useNatalChart';
import { localDateKey } from '../lib/astrology/transits';

const FACES: { score: number; glyph: string; label: string }[] = [
  { score: 1, glyph: '☁️', label: 'Heavy' },
  { score: 2, glyph: '🌧️', label: 'Low' },
  { score: 3, glyph: '⛅', label: 'Steady' },
  { score: 4, glyph: '🌤️', label: 'Good' },
  { score: 5, glyph: '☀️', label: 'Bright' },
];

/**
 * "How does today feel?" — one tap a day. Saved to the journal with today's sky stamped
 * on it, which is what the insights in the Journal are built from.
 * Drop `<MoodCheckIn />` into the Today screen.
 */
export function MoodCheckIn() {
  const { colors } = useTheme();
  const { byId, insights } = useJournal(60);
  const { state: chartState } = useNatalChart();
  const today = localDateKey();
  const existing = byId(`mood-${today}`);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<number | null>(null);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => { if (existing) setNote(String(existing.text ?? '')); }, [existing?.id]);

  const save = async (score: number, text = note) => {
    setSaving(score);
    try {
      await upsertJournalEntry(`mood-${today}`, {
        type: 'mood', text, meta: { score, date: today },
        chart: chartState.status === 'ready' ? chartState.chart : null,
      });
    } finally { setSaving(null); }
  };

  const current = (existing?.meta.score as number | undefined) ?? null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconBubble name="heart-outline" tone="accent" />
        <View style={styles.headerText}>
          <AppText variant="heading">How does today feel?</AppText>
          <AppText variant="caption" tone="secondary">
            {current ? 'Noted. Tap another to change it.' : 'One tap. Over time, the Journal shows which skies suit you.'}
            {insights.streak >= 2 ? `  ·  ${insights.streak}-day streak` : ''}
          </AppText>
        </View>
      </View>

      <View style={styles.faces}>
        {FACES.map(f => {
          const active = current === f.score;
          return (
            <Pressable
              key={f.score}
              onPress={() => save(f.score)}
              disabled={saving !== null}
              accessibilityRole="button"
              accessibilityLabel={f.label}
              style={({ pressed }) => [
                styles.face,
                { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.accentSoft : colors.surface },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.faceGlyph}>{f.glyph}</Text>
              <AppText variant="caption" tone={active ? 'primary' : 'muted'}>{f.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {current !== null && (
        <View style={styles.noteWrap}>
          {showNote || note ? (
            <>
              <TextField
                label="A line for the journal (optional)"
                icon="create-outline"
                placeholder="What made it that kind of day?"
                value={note}
                onChangeText={setNote}
              />
              {note.trim() !== String(existing?.text ?? '').trim() && (
                <Button
                  title={saving !== null ? 'Saving…' : 'Save line'}
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  disabled={saving !== null}
                  onPress={() => current !== null && save(current, note)}
                  style={styles.saveLine}
                />
              )}
            </>
          ) : (
            <Pressable onPress={() => setShowNote(true)} accessibilityRole="button" style={styles.addNote}>
              <AppText variant="label" style={{ color: colors.primary }}>+ Add a line</AppText>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerText: { flex: 1, marginLeft: spacing.md },
  faces: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  face: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 14, borderWidth: 1 },
  faceGlyph: { fontSize: 24, marginBottom: 2 },
  noteWrap: { marginTop: spacing.md },
  addNote: { alignSelf: 'center', paddingVertical: spacing.xs },
  saveLine: { alignSelf: 'flex-end', marginTop: spacing.sm },
});

export default MoodCheckIn;
