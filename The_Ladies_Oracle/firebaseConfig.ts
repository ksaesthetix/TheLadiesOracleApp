import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { initializeAuth,  } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy1YGcj1z4fhicAAgaIOeytgy8BZYaW68",
  authDomain: "theladiesoracle.firebaseapp.com",
  projectId: "theladiesoracle",
  storageBucket: "theladiesoracle.appspot.com",
  messagingSenderId: "314108721004",
  appId: "1:314108721004:web:5f5cf4ecc7b7d627402549",
  measurementId: "G-KWW16LMXCL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with React Native-compatible persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// Initialize Auth with persistence for React Native
const auth = initializeAuth(app);

export { db, auth };
