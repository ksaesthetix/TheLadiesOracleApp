import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import globalStyles from "../constants/styles";
import { doc, updateDoc } from "firebase/firestore"; 
import { db, auth } from '../firebaseConfig';

const DateOfBirth = () => {
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
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Your Date of Birth</Text>
      <Text style={globalStyles.subtitle}>Select your date and time (if applicable)</Text>

      {/* Date Display */}
      <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
        <View style={globalStyles.pickerContainer}>
          <Text style={globalStyles.pickerLabel}>Date</Text>
          <View style={globalStyles.dateTimePicker}>
            <Text style={globalStyles.dateTimeText}>{formattedDate}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={globalStyles.datePickerContainer}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
          />
        </View>
      )}

      {/* Time Display */}
      <TouchableOpacity onPress={() => setShowTimePicker(!showTimePicker)}>
        <View style={globalStyles.pickerContainer}>
          <Text style={globalStyles.pickerLabel}>Time (optional)</Text>
          <View style={globalStyles.dateTimePicker}>
            <Text style={globalStyles.dateTimeText}>{formattedTime}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Time Picker */}
      {showTimePicker && (
        <View style={globalStyles.datePickerContainer}>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={onChangeTime}
          />
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity style={globalStyles.dobbutton} onPress={handleSubmit}>
        <Text style={globalStyles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DateOfBirth;
