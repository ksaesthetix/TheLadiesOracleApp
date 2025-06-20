import { View, Text } from 'react-native';
import globalStyles from '../constants/styles';
import { useLocalSearchParams } from 'expo-router';

const answers = [
  // Example answers for each icon/question combo
  // You can make this a 2D array or a function for more complex logic
  "Yes, soon!",
  "Not yet.",
  "Absolutely faithful.",
  "Ask again later.",
  "Possibly.",
  "It will be carried.",
  "Yes, you have.",
  "No cause for worry.",
  "Jealousy is unfounded.",
];

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
export default function PageFour() {
  const { icon, question } = useLocalSearchParams();

  // You can use icon and question to select an answer
  // For now, just use question index for demo
  const questionIdx = Number(question);
  const answer = answers[questionIdx] || "The Oracle is silent...";

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>ASK THE ORACLE</Text>
      <Text style={globalStyles.subtitle}>{questions[questionIdx]}</Text>
      <Text style={globalStyles.pageText}>{answer}</Text>
    </View>
  );
}