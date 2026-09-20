import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Avatar, Button, Card, PageHeader, Screen } from '../../../components/ui';
import { BackBar } from '../../../components/BackBar';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { Person, useFollowing, usePeople } from '../../../hooks/useFriends';
import { auth } from '../../../firebaseConfig';

/**
 * /profile/friends — reached from the friends counter on the profile. Lives in the
 * You tab's stack so the tab bar stays; not a tab itself. Tapping a person opens
 * your bond with them (/profile/bond/[uid]).
 */
export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { following, count, loading: loadingFollowing, follow, unfollow, isFollowing } = useFollowing();
  const { people, loading: loadingPeople, error: peopleError, reload } = usePeople();

  if (!auth.currentUser) {
    return (
      <Screen centered edges={['top']} decor>
        <Ionicons name="people-outline" size={64} color={colors.textMuted} />
        <AppText variant="heading" align="center" style={styles.stateTitle}>Log in to see your friends.</AppText>
        <Button title="Go to Login" fullWidth={false} onPress={() => router.replace('/login')} style={styles.stateAction} />
      </Screen>
    );
  }

  const notYetFollowing = people.filter(p => !isFollowing(p.uid));
  const openBond = (uid: string) => router.push({ pathname: '/profile/bond/[uid]', params: { uid } });

  return (
    <Screen scroll edges={['top']} decor>
      <BackBar label="Profile" />
      <PageHeader
        eyebrow="Your circle"
        title="Friends"
        subtitle={count === 0 ? 'Follow friends to share the Oracle’s guidance.' : `You follow ${count} ${count === 1 ? 'person' : 'people'}. Tap anyone to see your bond.`}
      />

      {/* Following */}
      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>Following · {count}</AppText>
      {loadingFollowing ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : following.length === 0 ? (
        <Card tone="alt">
          <AppText variant="body" tone="secondary">No one yet. Pick someone below to start your circle.</AppText>
        </Card>
      ) : (
        following.map(f => (
          <PersonRow key={f.uid} person={f} following onToggle={() => unfollow(f.uid)} onOpen={() => openBond(f.uid)} />
        ))
      )}

      {/* Find friends */}
      <AppText variant="overline" tone="muted" style={styles.sectionLabel}>Find friends</AppText>
      {loadingPeople ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : peopleError ? (
        <Card tone="alt">
          <AppText variant="body" tone="secondary">{peopleError}</AppText>
          <Button title="Try again" variant="outline" size="sm" fullWidth={false} onPress={reload} style={styles.retry} />
        </Card>
      ) : notYetFollowing.length === 0 ? (
        <Card tone="alt">
          <AppText variant="body" tone="secondary">
            {people.length === 0 ? 'No other members yet — you are early.' : 'You already follow everyone here.'}
          </AppText>
        </Card>
      ) : (
        notYetFollowing.map(p => (
          <PersonRow key={p.uid} person={p} following={false} onToggle={() => follow(p)} onOpen={() => openBond(p.uid)} />
        ))
      )}
    </Screen>
  );
}

function PersonRow({ person, following, onToggle, onOpen }: { person: Person; following: boolean; onToggle: () => Promise<void> | void; onOpen: () => void }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try { await onToggle(); } finally { setBusy(false); }
  };
  return (
    <Card padded={false} style={styles.itemCard}>
      <View style={styles.itemRow}>
        <Pressable onPress={onOpen} style={styles.itemMain} accessibilityRole="button" accessibilityLabel={`Bond with ${person.name}`}>
          <Avatar uri={person.photoURL} name={person.name} size={46} />
          <View style={styles.itemText}>
            <AppText variant="bodyStrong" numberOfLines={1}>{person.name}</AppText>
            <AppText variant="caption" tone="muted">{following ? 'Following · tap for your bond' : 'Not following'}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
        </Pressable>
        <Button
          title={following ? 'Unfollow' : 'Follow'}
          variant={following ? 'secondary' : 'primary'}
          size="sm"
          fullWidth={false}
          disabled={busy}
          onPress={handle}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.md },
  spinner: { marginVertical: spacing.lg },
  retry: { marginTop: spacing.md },
  itemCard: { marginBottom: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemText: { flex: 1, marginHorizontal: spacing.md },
  chevron: { marginRight: spacing.sm },
  stateTitle: { marginTop: spacing.lg },
  stateAction: { marginTop: spacing.xl },
});
