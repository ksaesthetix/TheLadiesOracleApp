import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import globalStyles from "../constants/styles";

const DateOfBirth = () => {
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Format date and time for display
  const formattedDate = date.toDateString();
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTime(false);
    if (selectedTime) setDate(selectedTime);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Your Date of Birth</Text>
      <Text style={globalStyles.subtitle}>Select your date and time (if applicable)</Text>

      {/* Date Picker */}
      <View style={globalStyles.pickerContainer}>
        <Text style={globalStyles.pickerLabel}>Date</Text>
        <TouchableOpacity
          style={globalStyles.dateTimePicker}
          onPress={() => setShowDate(true)}
        >
          <Text style={globalStyles.dateTimeText}>{formattedDate}</Text>
        </TouchableOpacity>
      </View>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {/* Time Picker */}
      <View style={globalStyles.pickerContainer}>
        <Text style={globalStyles.pickerLabel}>Time (optional)</Text>
        <TouchableOpacity
          style={globalStyles.dateTimePicker}
          onPress={() => setShowTime(true)}
        >
          <Text style={globalStyles.dateTimeText}>{formattedTime}</Text>
        </TouchableOpacity>
      </View>

      {showTime && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={onChangeTime}
        />
      )}

      {/* Submit Button */}
      <TouchableOpacity style={globalStyles.dobbutton}>
        <Text style={globalStyles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DateOfBirth;


