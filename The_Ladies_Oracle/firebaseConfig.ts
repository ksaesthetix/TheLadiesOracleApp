import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
// @ts-expect-error getReactNativePersistence exists only in Firebase's React Native typings
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration is loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID,
};

// Reuse the existing app instance across Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore against the 'default' database
const db = getFirestore(app, "default");

// Auth: AsyncStorage persistence on native, browser storage on web
let auth: Auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
  void auth.setPersistence(browserLocalPersistence);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { db, auth };