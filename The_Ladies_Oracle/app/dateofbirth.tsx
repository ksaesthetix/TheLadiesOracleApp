import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from '../firebaseConfig';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../components/ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const DateOfBirth = () => {
  const { colors } = useTheme();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formattedDate = date.toDateString();
  const formattedTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const handleSubmit = async () => {
    console.log('Selected Date:', formattedDate);
    console.log('Selected Time:', formattedTime);
    console.log('Date Object:', date);

    const user = auth.currentUser;

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          dateOfBirth: formattedDate,
          timeOfBirth: formattedTime,
        });
        console.log('Successfully updated user data in Firestore!');
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    } else {
      console.log('No user is currently logged in.');
    }
  };

  return (
    <Screen scroll edges={['bottom']} decor>
      <PageHeader
        eyebrow="Your chart"
        title="Your Date of Birth"
        subtitle="Select your date and time (if applicable)"
      />

      {/* Date Display */}
      <Pressable onPress={() => setShowDatePicker(!showDatePicker)}>
        <Card style={[styles.pickerCard, showDatePicker && { borderColor: colors.primary }]}>
          <View style={styles.pickerRow}>
            <IconBubble name="calendar-outline" tone="primary" />
            <View style={styles.pickerText}>
              <AppText variant="label" tone="secondary">Date</AppText>
              <AppText variant="heading" style={styles.pickerValue}>{formattedDate}</AppText>
            </View>
            <Ionicons
              name={showDatePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </Card>
      </Pressable>

      {/* Date Picker */}
      {showDatePicker && (
        <Card tone="alt" style={styles.pickerWell}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
          />
        </Card>
      )}

      {/* Time Display */}
      <Pressable onPress={() => setShowTimePicker(!showTimePicker)}>
        <Card style={[styles.pickerCard, showTimePicker && { borderColor: colors.primary }]}>
          <View style={styles.pickerRow}>
            <IconBubble name="time-outline" tone="accent" />
            <View style={styles.pickerText}>
              <AppText variant="label" tone="secondary">Time (optional)</AppText>
              <AppText variant="heading" style={styles.pickerValue}>{formattedTime}</AppText>
            </View>
            <Ionicons
              name={showTimePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </Card>
      </Pressable>

      {/* Time Picker */}
      {showTimePicker && (
        <Card tone="alt" style={styles.pickerWell}>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={onChangeTime}
          />
        </Card>
      )}

      {/* Submit Button */}
      <Button title="Submit" onPress={handleSubmit} style={styles.submit} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  pickerCard: {
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pickerValue: {
    marginTop: 2,
  },
  pickerWell: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  submit: {
    marginTop: spacing.lg,
  },
});

export default DateOfBirth;
