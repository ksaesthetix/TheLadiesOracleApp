import React, { useState, useEffect } from 'react';
import { Button, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import globalStyles, { COLORS } from '../../constants/styles';
import { useRouter } from 'expo-router';
import { useWisdomArchive } from '../contexts/WisdomArchiveContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function HomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const { addToArchive } = useWisdomArchive();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      setIsLoggedIn(!!email);
    };
    checkLogin();
    // Optionally, add a listener for focus to re-check login status
  }, []);

  const showRandomQuote = () => {
    const quote = WISE_QUOTES[Math.floor(Math.random() * WISE_QUOTES.length)];
    setCurrentQuote(quote);
    setModalVisible(true);
  };

  const saveToArchive = () => {
    addToArchive(currentQuote);
    setModalVisible(false);
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: COLORS.headerBackgroundColor, dark: COLORS.headerBackgroundColorDark }}
        headerImage={
          <Image
            source={require('@/assets/images/The_Ladies_Oracle_Logo.jpg')}
            style={globalStyles.reactLogo}
          />
        }>
        <ThemedView style={globalStyles.titleContainer}>
          <ThemedText type="title">Welcome to The Ladies Oracle!</ThemedText>
        </ThemedView>
        <View style={globalStyles.buttonContainer}>
          <TouchableOpacity 
            style={globalStyles.button} 
            onPress={() => router.push('/iconselector')}>
            <Text style={globalStyles.buttonText}>Ask The Oracle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={globalStyles.secondaryButton}
            onPress={showRandomQuote}>
            <Text style={globalStyles.secondaryButtonText}>Daily Wisdom</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={globalStyles.secondaryButton}
            onPress={() => router.push('/archive')}>
            <Text style={globalStyles.secondaryButtonText}>Archive</Text>
          </TouchableOpacity>
          {!isLoggedIn && (
            <TouchableOpacity
              style={globalStyles.secondaryButton}
              onPress={() => router.push('/login')}>
              <Text style={globalStyles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </ParallaxScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.quoteText}>{currentQuote}</Text>
            <TouchableOpacity style={globalStyles.saveButton} onPress={saveToArchive}>
              <Text style={globalStyles.saveButtonText}>Save to Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={globalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

