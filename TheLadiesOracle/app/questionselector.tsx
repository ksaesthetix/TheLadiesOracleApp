import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import globalStyles from '../constants/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';

export const options = { headerShown: false };

type Question = { _id: string; number?: number; question?: string };

export default function PageThree() {
  const router = useRouter();
  const { icon } = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://congenial-tribble-4rqj6wr7vwv27wqj-3000.app.github.dev/questions')
      .then(res => res.json())
      .then(data => {
        console.log('Questions from API:', data);
        setQuestions(data.sort((a: Question, b: Question) => (a.number ?? 0) - (b.number ?? 0)));
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

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
              key={q._id}
              style={globalStyles.questionRow}
              onPress={() => router.push({ pathname: '/answerpage', params: { icon, question: q.number ?? idx } })}
              activeOpacity={0.7}
            >
              <Text style={globalStyles.questionNumber}>{q.number ?? idx + 1}</Text>
              <Text style={globalStyles.questionText}>{q.question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}