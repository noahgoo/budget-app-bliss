import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your Firebase configuration
// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Debug: Check if all required config values are present
const requiredFields = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error("Missing Firebase config fields:", missingFields);
  console.error(
    "Please check your .env file and ensure all REACT_APP_FIREBASE_* variables are set"
  );
}

console.log("Firebase Config Object:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey
    ? `${firebaseConfig.apiKey.substring(0, 10)}...`
    : "MISSING",
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Test Firestore connectivity
export const testFirestoreConnection = async () => {
  try {
    console.log("Testing Firestore connection...");

    // Test 1: Basic connection - use a simple getDoc instead of listener
    const testDoc = doc(db, "test", "connection");
    console.log("Attempting to read test document...");
    await getDoc(testDoc);
    console.log("✅ Basic Firestore connection successful");

    // Test 2: Try to access users collection
    try {
      console.log("Testing users collection access...");
      const usersCollection = doc(db, "users", "test");
      await getDoc(usersCollection);
      console.log("✅ Users collection access successful");
    } catch (usersError) {
      console.error("❌ Users collection access failed:", usersError.code);
      if (usersError.code === "permission-denied") {
        console.error("🔒 Users collection is blocked by security rules");
      }
    }

    // Test 3: Try to access transactions collection
    try {
      console.log("Testing transactions collection access...");
      const transactionsCollection = doc(db, "transactions", "test");
      await getDoc(transactionsCollection);
      console.log("✅ Transactions collection access successful");
    } catch (transactionsError) {
      console.error(
        "❌ Transactions collection access failed:",
        transactionsError.code
      );
      if (transactionsError.code === "permission-denied") {
        console.error(
          "🔒 Transactions collection is blocked by security rules"
        );
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "permission-denied") {
      console.error(
        "🔒 This appears to be a permissions issue. Check your Firestore security rules."
      );
    } else if (error.code === "unavailable") {
      console.error(
        "🌐 This appears to be a network/connectivity issue. Check your Firebase project settings."
      );
    }

    return false;
  }
};

export default app;
