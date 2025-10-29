import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import globalStyles from '../constants/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';

export const options = { headerShown: false };
const API_URL = 'https://theladiesoracleapp.onrender.com';

type Question = { _id: string; number?: number; question?: string };

export default function QuestionSelector() {
  const router = useRouter();
  const { icon_id } = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/questions`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.sort((a: Question, b: Question) => (a.number ?? 0) - (b.number ?? 0)));
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={globalStyles.title}>ASK THE ORACLE</Text>
        <View style={globalStyles.selectBox}>
          <Text style={globalStyles.selectBoxText}>Select a question</Text>
        </View>
        <View style={globalStyles.questionList}>
          {questions.map(q => (
            <TouchableOpacity
              key={q._id}
              style={globalStyles.questionRow}
              onPress={() => {
                console.log(`Selected Icon ID: ${icon_id}`); // ✅ Only log selected icon ID
                router.push({
                  pathname: '/answerpage',
                  params: { icon_id, question: q.number?.toString() }
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={globalStyles.questionNumber}>{q.number}</Text>
              <Text style={globalStyles.questionText}>{q.question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}