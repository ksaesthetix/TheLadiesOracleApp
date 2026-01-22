import { Link } from "expo-router";
import React, { useState } from "react";
import Constants from "expo-constants";
import {
  Text,
  View,
  Modal,
  ScrollView,
  Linking,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import globalStyles from "../../constants/styles";
import { useWisdomArchive } from "../contexts/WisdomArchiveContext";

const { width } = Dimensions.get("window");

const WISE_QUOTES = [
  "Wisdom begins in wonder.",
  "The only true wisdom is in knowing you know nothing.",
  "Patience is the companion of wisdom.",
  "Knowing yourself is the beginning of all wisdom.",
  "Turn your wounds into wisdom.",
  "Wisdom comes from experience.",
  "A wise man never knows all, only fools know everything.",
  "Silence is the sleep that nourishes wisdom.",
];

export default function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const { addToArchive } = useWisdomArchive();

  const showRandomQuote = () => {
    const quote = WISE_QUOTES[Math.floor(Math.random() * WISE_QUOTES.length)];
    setCurrentQuote(quote);
    setModalVisible(true);
  };

  const handleSave = () => {
    addToArchive(currentQuote);
    setModalVisible(false);
  };

  return (
    <>
      <View style={globalStyles.container}>
        {/* Scrollable content */}
        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          <View style={globalStyles.buttonContainer}>
            {/*
            <Link href="./questionselector" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Ask The Oracle</Text>
              </TouchableOpacity>
            </Link>*/}
            <Link href="./locationdetails" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Location Details</Text>
              </TouchableOpacity>
            </Link>
            <Link href="./dateofbirth" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Date of Birth</Text>
              </TouchableOpacity>
            </Link>
            {/*
            <Link href="./profile" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>My Account</Text>
              </TouchableOpacity>
            </Link>*/}
            <TouchableOpacity
              style={globalStyles.button}
              onPress={showRandomQuote}>
              <Text style={globalStyles.buttonText}>Daily Affirmation</Text>
            </TouchableOpacity>
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
            {/*
            <Link href="./settings" asChild>
              <TouchableOpacity style={globalStyles.button}>
                <Text style={globalStyles.buttonText}>Settings</Text>
              </TouchableOpacity>
            </Link>*/}
          </View>
        </ScrollView>

        {/* 
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
        </View>*/}
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.quoteText}>{currentQuote}</Text>
            <TouchableOpacity
              style={globalStyles.saveButton}
              onPress={handleSave}
            >
              <Text style={globalStyles.buttonText}>Save to Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={globalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={globalStyles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}


