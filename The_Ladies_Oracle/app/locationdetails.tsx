import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

// Define the shape of the geo data
interface GeoData {
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export default function LocationScreen() {
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGeoDetails = async () => {
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const response = await fetch(
            "https://theladiesoracleapp.onrender.com/astrology/geo-details",
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ location }),
            }
        );

        // Check if response is OK
        if (!response.ok) {
            const text = await response.text(); // get raw response for debugging
            console.error("Server returned error:", text);
            setError("Failed to fetch location details");
            return;
        }

        // Try parsing JSON safely
        let data: GeoData;
        try {
            data = await response.json();
        } catch (jsonErr) {
            const text = await response.text();
            console.error("Failed to parse JSON:", text);
            setError("Invalid response from server");
            return;
        }

        setGeoData(data);
        } catch (err) {
        console.error("Network or fetch error:", err);
        setError("Failed to fetch location details");
        } finally {
        setLoading(false);
        }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Location</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. London, UK"
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity style={styles.button} onPress={fetchGeoDetails}>
        <Text style={styles.buttonText}>
          {loading ? "Finding..." : "Confirm Location"}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {geoData && (
        <View style={styles.resultBox}>
          <Text>📍 Location: {geoData.location}</Text>
          <Text>🌍 Latitude: {geoData.latitude}</Text>
          <Text>🌎 Longitude: {geoData.longitude}</Text>
          <Text>⏰ Timezone: {geoData.timezone}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6EFE8",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#C7B299",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  button: {
    marginTop: 15,
    backgroundColor: "#9B6A9E",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#EFE2D8",
    borderRadius: 10,
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});
