import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import globalStyles, { COLORS } from "../constants/styles";

const LocationDetails = () => {
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLocationDetails = async () => {
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");
    setDetails(null);

    try {
      const response = await fetch(
        "https://theladiesoracleapp.onrender.com/astrology/geo-details",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setDetails(data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to fetch location details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.scrollContent}>
      <Text style={globalStyles.title}>Location Details</Text>

      <View style={globalStyles.textInputView}>
        <TextInput
          style={globalStyles.textInputStyle}
          placeholder="Enter location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <TouchableOpacity style={globalStyles.button} onPress={fetchLocationDetails}>
        <Text style={globalStyles.buttonText}>Get Details</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      )}

      {error ? <Text style={{ color: COLORS.highlight, marginTop: 10 }}>{error}</Text> : null}

      {details && Array.isArray(details) && details.length > 0 && (
        <View style={{ marginTop: 20 }}>
            {details.map((item, index) => (
            <View key={index} style={globalStyles.card}>
                <Text style={globalStyles.cardTitle}>{item.complete_name}</Text>
                <Text style={globalStyles.cardText}>
                <Text style={globalStyles.cardLabel}>Location Name: </Text>{item.location_name}
                </Text>
                <Text style={globalStyles.cardText}>
                <Text style={globalStyles.cardLabel}>Country: </Text>{item.country}
                </Text>
                <Text style={globalStyles.cardText}>
                <Text style={globalStyles.cardLabel}>Region: </Text>{item.administrative_zone_1}, {item.administrative_zone_2}
                </Text>
                <Text style={globalStyles.cardText}>
                <Text style={globalStyles.cardLabel}>Coordinates: </Text>{item.latitude}, {item.longitude}
                </Text>
                <Text style={globalStyles.cardText}>
                <Text style={globalStyles.cardLabel}>Timezone: </Text>{item.timezone} (Offset: {item.timezone_offset})
                </Text>
            </View>
            ))}
        </View>
        )}
    </ScrollView>
  );
};

export default LocationDetails;
