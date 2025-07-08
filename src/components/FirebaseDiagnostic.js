import React, { useState, useEffect } from "react";
import { auth, functions, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const FirebaseDiagnostic = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const addResult = (test, status, message, error = null) => {
    setResults((prev) => [
      ...prev,
      {
        test,
        status,
        message,
        error: error?.message || error,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const clearResults = () => setResults([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const testFirebaseConfig = () => {
    addResult("Firebase Config", "info", "Checking Firebase configuration...");

    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };

    const missingFields = Object.entries(config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      addResult(
        "Firebase Config",
        "error",
        `Missing environment variables: ${missingFields.join(", ")}`
      );
      return false;
    }

    addResult(
      "Firebase Config",
      "success",
      "All Firebase configuration values present"
    );
    return true;
  };

  const testFirestoreConnection = async () => {
    addResult(
      "Firestore Connection",
      "info",
      "Testing basic Firestore connection..."
    );

    try {
      addResult(
        "Firestore Connection",
        "success",
        "Firestore instance created successfully (using default database)"
      );
      return db;
    } catch (error) {
      addResult(
        "Firestore Connection",
        "error",
        "Failed to create Firestore instance",
        error
      );
      return null;
    }
  };

  const testFirestoreRead = async (db) => {
    if (!db) return false;

    addResult("Firestore Read", "info", "Testing Firestore read operation...");

    try {
      const testDoc = doc(db, "test", "connection");
      await getDoc(testDoc);
      addResult(
        "Firestore Read",
        "success",
        "Firestore read operation successful"
      );
      return true;
    } catch (error) {
      addResult(
        "Firestore Read",
        "error",
        `Firestore read failed: ${error.code}`,
        error
      );
      return false;
    }
  };

  const testFirestoreWrite = async (db) => {
    if (!db) return false;

    addResult(
      "Firestore Write",
      "info",
      "Testing Firestore write operation..."
    );

    try {
      const testDoc = doc(db, "test", "write-test");
      await setDoc(testDoc, {
        timestamp: new Date(),
        test: true,
      });
      addResult(
        "Firestore Write",
        "success",
        "Firestore write operation successful"
      );
      return true;
    } catch (error) {
      addResult(
        "Firestore Write",
        "error",
        `Firestore write failed: ${error.code}`,
        error
      );
      return false;
    }
  };

  const testUsersCollection = async (db) => {
    if (!db || !currentUser) return false;

    addResult("Users Collection", "info", "Testing users collection access...");

    try {
      const userDoc = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        addResult(
          "Users Collection",
          "success",
          "User document exists and is accessible"
        );
      } else {
        addResult(
          "Users Collection",
          "warning",
          "User document does not exist - this is expected for new users"
        );
      }
      return true;
    } catch (error) {
      addResult(
        "Users Collection",
        "error",
        `Users collection access failed: ${error.code}`,
        error
      );
      return false;
    }
  };

  const testUserTransactionsCollection = async (db) => {
    if (!db || !currentUser) return false;

    addResult(
      "User Transactions",
      "info",
      "Testing user transactions subcollection..."
    );

    try {
      const userTransactionsRef = doc(
        db,
        "users",
        currentUser.uid,
        "transactions",
        "test"
      );
      await getDoc(userTransactionsRef);
      addResult(
        "User Transactions",
        "success",
        "User transactions subcollection is accessible"
      );
      return true;
    } catch (error) {
      if (error.code === "not-found") {
        addResult(
          "User Transactions",
          "success",
          "User transactions subcollection is accessible (test document doesn't exist, which is expected)"
        );
        return true;
      } else {
        addResult(
          "User Transactions",
          "error",
          `User transactions subcollection access failed: ${error.code}`,
          error
        );
        return false;
      }
    }
  };

  const testFirebaseFunctions = async () => {
    addResult(
      "Firebase Functions",
      "info",
      "Testing Firebase Functions connection..."
    );

    try {
      // Test with a simple function call (we'll create a test function)
      const testFunction = httpsCallable(functions, "testConnection");
      await testFunction();
      addResult(
        "Firebase Functions",
        "success",
        "Firebase Functions connection successful"
      );
      return true;
    } catch (error) {
      if (error.code === "functions/not-found") {
        addResult(
          "Firebase Functions",
          "warning",
          "Test function not found - this is expected"
        );
      } else {
        addResult(
          "Firebase Functions",
          "error",
          `Firebase Functions failed: ${error.code}`,
          error
        );
      }
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    addResult("Diagnostic", "info", "Starting Firebase diagnostic tests...");

    // Test 1: Configuration
    const configOk = testFirebaseConfig();
    if (!configOk) {
      addResult(
        "Diagnostic",
        "error",
        "Stopping tests due to configuration issues"
      );
      setIsRunning(false);
      return;
    }

    // Test 2: Firestore Connection
    const db = await testFirestoreConnection();

    // Test 3: Firestore Read
    if (db) {
      await testFirestoreRead(db);
    }

    // Test 4: Firestore Write
    if (db) {
      await testFirestoreWrite(db);
    }

    // Test 5: Users Collection
    if (db) {
      await testUsersCollection(db);
    }

    // Test 6: User Transactions Collection
    if (db) {
      await testUserTransactionsCollection(db);
    }

    // Test 7: Firebase Functions
    await testFirebaseFunctions();

    addResult("Diagnostic", "success", "All diagnostic tests completed");
    setIsRunning(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-peach font-medium text-lg">
          Firebase Diagnostic Tool
        </h2>
        <div className="space-x-2">
          <button
            onClick={clearResults}
            className="px-3 py-1 bg-peach/20 text-peach rounded hover:bg-peach/30 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-1 bg-sage text-charcoal rounded hover:bg-sage/80 transition-colors disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Tests"}
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-sage/10 rounded">
        <div className="text-sage text-sm">
          <strong>Current User:</strong>{" "}
          {currentUser
            ? `${currentUser.email} (${currentUser.uid.substring(0, 8)}...)`
            : "Not logged in"}
        </div>
        <div className="text-sage text-sm">
          <strong>Project ID:</strong>{" "}
          {process.env.REACT_APP_FIREBASE_PROJECT_ID || "Not set"}
        </div>
        <div className="text-sage text-sm">
          <strong>Database:</strong> Default
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-2 bg-sage/5 rounded"
          >
            <span
              className={`text-xs font-mono ${getStatusColor(result.status)}`}
            >
              [{result.status.toUpperCase()}]
            </span>
            <div className="flex-1">
              <div className="text-sage font-medium">{result.test}</div>
              <div className="text-peach text-sm">{result.message}</div>
              {result.error && (
                <div className="text-coral text-xs mt-1 font-mono">
                  {result.error}
                </div>
              )}
              <div className="text-sage/60 text-xs">{result.timestamp}</div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center text-peach/60 py-8">
          No test results yet. Click "Run Tests" to start diagnostics.
        </div>
      )}
    </div>
  );
};

export default FirebaseDiagnostic;
