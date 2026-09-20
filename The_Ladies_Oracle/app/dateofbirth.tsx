import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from '../firebaseConfig';
import { AppText, Button, Card, IconBubble, PageHeader, Screen } from '../components/ui';
import { spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const pad2 = (n: number) => String(n).padStart(2, '0');

const DateOfBirth = () => {
  const { colors } = useTheme();
  const [date, setDate] = useState(new Date());
  // The time is optional. Until the user actually picks one we must not save the
  // current clock time as if it were their birth time — the chart needs to know
  // the difference between "born at 14:30" and "time unknown".
  const [timeSet, setTimeSet] = useState(false);
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
      setTimeSet(true);
    }
  };

  const clearTime = () => {
    setTimeSet(false);
    setShowTimePicker(false);
  };

  const formattedDate = date.toDateString();
  // Always 'HH:mm' 24h — toLocaleTimeString can produce '24:05' on some engines.
  const formattedTime = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const isoDate = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const handleSubmit = async () => {
    console.log('Selected Date:', formattedDate);
    console.log('Selected Time:', timeSet ? formattedTime : '(unknown)');
    console.log('Date Object:', date);

    const user = auth.currentUser;

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          dateOfBirth: formattedDate,          // kept for anything already reading it
          birthDate: isoDate,                  // 'YYYY-MM-DD' — unambiguous, used by the chart
          timeOfBirth: timeSet ? formattedTime : null,
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
              <AppText variant="heading" style={[styles.pickerValue, !timeSet && { color: colors.textMuted }]}>
                {timeSet ? formattedTime : 'Not set'}
              </AppText>
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

      {timeSet && (
        <Pressable onPress={clearTime} style={styles.clearRow} accessibilityRole="button">
          <AppText variant="label" style={{ color: colors.primary }}>I don't know my birth time</AppText>
        </Pressable>
      )}
      {!timeSet && (
        <AppText variant="caption" tone="secondary" style={styles.hint}>
          Without a birth time your chart still works, but your rising sign and houses can't be calculated.
        </AppText>
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
  clearRow: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  hint: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  submit: {
    marginTop: spacing.lg,
  },
});

export default DateOfBirth;
