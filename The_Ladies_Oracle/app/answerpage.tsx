import { View, Text, ActivityIndicator } from 'react-native';
import globalStyles from '../constants/styles';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

const API_URL = 'https://theladiesoracleapp.onrender.com';

export default function AnswerPage() {
  const { icon_id, question} = useLocalSearchParams();

  // Normalize params
  const iconValue = Array.isArray(icon_id) ? icon_id[0] : icon_id;
  const questionValue = Array.isArray(question) ? question[0] : question;

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        const requestUrl = `${API_URL}/oracle-answer?question=${questionValue}&icon_id=${iconValue}`;
        const res = await fetch(requestUrl);

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();
        console.log(`✅ Final Answer: Icon ID: ${data.icon_id} | Icon Symbol: ${data.iconSymbol} | Question: ${data._id} | Answer Page: ${data.page} | Answer: ${data.answer}`);
        setAnswer(data.answer || 'The Oracle is silent...');
      } catch (error) {
        console.error('❌ Error fetching answer:', error);
        setAnswer('Error fetching answer.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, [iconValue, questionValue]);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>ASK THE ORACLE</Text>
      <Text style={globalStyles.subtitle}>Question #{questionValue}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <Text style={globalStyles.pageText}>{answer}</Text>
      )}
    </View>
  );
}