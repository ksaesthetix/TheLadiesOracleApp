import { View, Text, ScrollView } from 'react-native';
import globalStyles from '../../constants/styles';
import { useWisdomArchive } from '../contexts/WisdomArchiveContext';

export default function ArchivePage() {
  const { archive } = useWisdomArchive();

  return (
    <View style={globalStyles.archiveContainer}>
      <Text style={globalStyles.archiveTitle}>Wisdom Archive</Text>
      <ScrollView style={globalStyles.archiveScroll}>
        {archive.length === 0 ? (
          <Text style={globalStyles.archiveSubtitle}>No saved quotes yet.</Text>
        ) : (
          archive.map((quote: string, idx: number) => (
            <View key={idx} style={globalStyles.archiveQuoteBox}>
              <Text style={globalStyles.archiveQuoteText}>{quote}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

