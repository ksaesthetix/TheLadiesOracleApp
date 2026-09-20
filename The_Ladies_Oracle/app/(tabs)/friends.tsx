import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { AppText, Avatar, Button, Card, PageHeader, Screen } from '../../components/ui';
import { spacing } from '../../constants/theme';

// Define the type for a single friend, adding 'isFollowing'
interface Friend {
  id: string;
  name: string;
  isFollowing: boolean;
}

// Sample data for friends list with initial follow status
const friendsData: Friend[] = [
  { id: '1', name: 'Eleanor Vance', isFollowing: false },
  { id: '2', name: 'Gideon Cross', isFollowing: true },
  { id: '3', name: 'Seraphina Moon', isFollowing: false },
  { id: '4', name: 'Julian Blackwood', isFollowing: true },
  { id: '5', name: 'Isolde Grey', isFollowing: false },
];

// Define the props for the FriendItem component
interface FriendItemProps {
  friend: Friend;
}

// Component for rendering a single friend item with a follow/unfollow button
const FriendItem: React.FC<FriendItemProps> = ({ friend }) => {
  const [isFollowing, setIsFollowing] = useState(friend.isFollowing);

  const handleFollowToggle = () => {
    // In a real app, you would make an API call here
    setIsFollowing(previousState => !previousState);
  };

  return (
    <Card padded={false} style={styles.itemCard}>
      <View style={styles.itemRow}>
        <Avatar name={friend.name} size={46} />
        <View style={styles.itemText}>
          <AppText variant="bodyStrong" numberOfLines={1}>{friend.name}</AppText>
          <AppText variant="caption" tone="muted">
            {isFollowing ? 'Following' : 'Not following'}
          </AppText>
        </View>
        <Button
          title={isFollowing ? 'Unfollow' : 'Follow'}
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          fullWidth={false}
          onPress={handleFollowToggle}
        />
      </View>
    </Card>
  );
};

export default function FriendsScreen() {
  const [friends, setFriends] = useState(friendsData);

  const renderFriend = ({ item }: { item: Friend }) => (
    <FriendItem friend={item} />
  );

  return (
    <Screen edges={['top']} padded={false} decor>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <PageHeader
            eyebrow="Your circle"
            title="Friends"
            subtitle="Follow friends to share the Oracle's guidance."
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemText: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
});
