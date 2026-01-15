import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";

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
      // Replace localhost with your actual backend URL when using Expo on a device
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Location Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={location}
        onChangeText={setLocation}
      />

      <Button title="Get Details" onPress={fetchLocationDetails} />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {details && (
        <View style={styles.detailsContainer}>
          {Object.entries(details).map(([key, value]) => (
            <Text key={key} style={styles.detailItem}>
              <Text style={styles.detailKey}>{key}: </Text>
              {JSON.stringify(value)}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: "red", marginTop: 10 },
  detailsContainer: { marginTop: 20 },
  detailItem: { marginBottom: 10 },
  detailKey: { fontWeight: "bold" },
});

export default LocationDetails;
