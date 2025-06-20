import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import globalStyles from '../../constants/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';

export const options = { headerShown: false };

const questions = [
  "Will I achieve my heart's desire?",
  "Is a journey in my near future?",
  "Will I receive unexpected news?",
  "Should I trust my instincts?",
  "Will I find true friendship?",
  "Is success coming my way?",
  "Will I overcome my current challenge?",
  "Is there romance ahead for me?",
  "Should I take a leap of faith?",
];

export default function PageThree() {
  const router = useRouter();
  const { icon } = useLocalSearchParams();

  return (
    <SafeAreaView style={globalStyles.pageContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={globalStyles.title}>ASK THE ORACLE</Text>
        <View style={globalStyles.selectBox}>
          <Text style={globalStyles.selectBoxText}>Select a question</Text>
        </View>
        <View style={globalStyles.questionList}>
          {questions.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={globalStyles.questionRow}
              onPress={() => router.push({ pathname: '/answerpage', params: { icon, question: idx } })}
              activeOpacity={0.7}
            >
              <Text style={globalStyles.questionNumber}>{idx + 1}</Text>
              <Text style={globalStyles.questionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}