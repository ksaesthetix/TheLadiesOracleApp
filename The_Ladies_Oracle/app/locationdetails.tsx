import React, { useState } from "react";
import {
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import {
  AppText,
  Button,
  Card,
  IconBubble,
  InfoRow,
  PageHeader,
  Screen,
  TextField,
} from "../components/ui";
import { spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

const LocationDetails = () => {
  const { colors } = useTheme();
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

  const handleLocationSelect = async (selectedItem: any) => {
    console.log("Selected location:", {
      location_name: selectedItem.location_name,
      longitude: selectedItem.longitude,
      latitude: selectedItem.latitude,
      country: selectedItem.country,
    });
    // Optional: clear the list after selection and only show the selected one
    setDetails([selectedItem]);

    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          location_name: selectedItem.location_name,
          longitude: selectedItem.longitude,
          latitude: selectedItem.latitude,
          country: selectedItem.country,
        });
        Alert.alert(
          "Location Updated",
          "Your location has been successfully updated."
        );
      } catch (error) {
        console.error("Error updating user location:", error);
        Alert.alert(
          "Error",
          "Failed to update your location. Please try again."
        );
      }
    } else {
      Alert.alert(
        "Not Logged In",
        "You must be logged in to update your location."
      );
    }
  };

  return (
    <Screen scroll edges={['bottom']} decor keyboardAvoiding>
      <PageHeader
        eyebrow="Your chart"
        title="Location Details"
        subtitle="Search for a place, then tap a result to save it to your profile."
      />

      <Card>
        <TextField
          label="Location"
          icon="location-outline"
          placeholder="Enter location"
          value={location}
          onChangeText={setLocation}
          error={error || null}
        />
        <Button
          title="Get Details"
          onPress={fetchLocationDetails}
          icon={<Ionicons name="search-outline" size={18} color={colors.onPrimary} />}
          style={styles.submit}
        />
      </Card>

      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
      )}

      {details && Array.isArray(details) && (
        <View style={styles.results}>
          <AppText variant="overline" tone="muted" style={styles.resultsLabel}>
            {details.length === 1 ? "Selected location" : "Select your location"}
          </AppText>
          {details.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => handleLocationSelect(item)}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <IconBubble name="location-outline" tone={details.length === 1 ? "primary" : "neutral"} size={36} />
                  <AppText variant="heading" style={styles.resultTitle}>{item.complete_name}</AppText>
                  {details.length !== 1 && (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </View>
                {/* Only show other details if it's the only item */}
                {details.length === 1 && (
                  <View style={styles.resultDetails}>
                    <InfoRow label="Location Name" value={`${item.location_name}`} divider />
                    <InfoRow label="Country" value={`${item.country}`} divider />
                    <InfoRow
                      label="Region"
                      value={`${item.administrative_zone_1}, ${item.administrative_zone_2}`}
                      divider
                    />
                    <InfoRow label="Coordinates" value={`${item.latitude}, ${item.longitude}`} divider />
                    <InfoRow
                      label="Timezone"
                      value={`${item.timezone} (Offset: ${item.timezone_offset})`}
                    />
                  </View>
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  submit: {
    marginTop: spacing.lg,
  },
  spinner: {
    marginTop: spacing.xxl,
  },
  results: {
    marginTop: spacing.xxl,
  },
  resultsLabel: {
    marginBottom: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resultDetails: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
});

export default LocationDetails;
