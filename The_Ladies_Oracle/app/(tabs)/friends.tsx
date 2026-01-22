import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import globalStyles from '../../constants/styles';

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
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{friend.name}</Text>
      <TouchableOpacity 
        style={[styles.followButton, {backgroundColor: isFollowing ? '#A9A9A9' : '#3498db'}]}
        onPress={handleFollowToggle}
      >
        <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function FriendsScreen() {
  const [friends, setFriends] = useState(friendsData);

  const renderFriend = ({ item }: { item: Friend }) => (
    <FriendItem friend={item} />
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={{paddingHorizontal: 20, paddingTop: 20}}>
        <Text style={globalStyles.title}>Friends</Text>
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={item => item.id}
          style={{marginTop: 20}}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});