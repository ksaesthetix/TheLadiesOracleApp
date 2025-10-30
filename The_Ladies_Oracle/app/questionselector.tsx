import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../constants/styles";
import { useRouter } from "expo-router";

const API_URL = "https://theladiesoracleapp.onrender.com";

type Question = { _id: string; number?: number; question?: string };

export const options = { headerShown: false };

export default function QuestionSelector() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/questions`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        if (!text) throw new Error("Empty response from /questions");
        const data = JSON.parse(text);
        setQuestions(
          data.sort(
            (a: Question, b: Question) => (a.number ?? 0) - (b.number ?? 0)
          )
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
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
          {questions.map((q) => (
            <TouchableOpacity
              key={q._id}
              style={globalStyles.questionRow}
              onPress={() => {
                console.log(`✅ Selected Question Number: ${q.number}`);
                console.log(`✅ Selected Question Text: ${q.question}`);
                router.push({
                  pathname: "/iconselector",
                  params: { question: q.number?.toString() },
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
