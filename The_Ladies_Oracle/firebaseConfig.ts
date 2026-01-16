// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAy1YGcj1z4fhicAAgaIOeytgy8BZYaW68",
  authDomain: "theladiesoracle.firebaseapp.com",
  projectId: "theladiesoracle",
  storageBucket: "theladiesoracle.firebasestorage.app",
  messagingSenderId: "314108721004",
  appId: "1:314108721004:web:5f5cf4ecc7b7d627402549",
  measurementId: "G-KWW16LMXCL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 IMPORTANT: connect to your *named* Firestore database "default"
const db = getFirestore(app, "default");
const auth = getAuth(app);

export { db, auth };
