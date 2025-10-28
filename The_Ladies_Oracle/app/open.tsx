import { Link } from "expo-router";
import React from "react";
import {
  Text,
  View,
  ScrollView,
  Linking,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import globalStyles from "../constants/styles";
import { useWisdomArchive } from "./contexts/WisdomArchiveContext";

const { width } = Dimensions.get("window");

export default function Openingscreen() {
  return (
    <View style={globalStyles.container}>
      {/* Scrollable content */}
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        <View style={globalStyles.buttonContainer}>
          <Link href="./login" asChild>
            <TouchableOpacity style={globalStyles.button}>
              <Text style={globalStyles.buttonText}>Login</Text>
            </TouchableOpacity>
          </Link>

          <Link href="./signup" asChild>
            <TouchableOpacity style={globalStyles.button}>
              <Text style={globalStyles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>
          2025{" "}
          <Text
            onPress={() => Linking.openURL("https://theladiesoracle.com/")}
            style={{ color: "#1e3274" }}
          >
            theladiesoracle
          </Text>{" "}
          App v1.0
        </Text>
      </View>
    </View>
  );
}
