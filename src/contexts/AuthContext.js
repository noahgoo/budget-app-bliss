import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      console.log("Attempting signup for:", email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Signup successful, user ID:", user.uid);

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: displayName,
          createdAt: new Date(),
        });
        console.log("User document created in Firestore");
      } catch (firestoreError) {
        console.error(
          "Failed to create user document in Firestore:",
          firestoreError
        );
        // Don't fail signup if Firestore fails
      }

      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("Login error details:", {
        code: error.code,
        message: error.message,
        email: email,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Ensure user document exists in Firestore
  const ensureUserDocument = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("User document doesn't exist, creating it...");
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          createdAt: new Date(),
        });
        console.log("User document created");
        return {
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          createdAt: new Date(),
        };
      } else {
        console.log("User document exists");
        return userDoc.data();
      }
    } catch (error) {
      console.error("Error ensuring user document:", error);
      return null;
    }
  };

  // Get user data from Firestore
  const getUserData = async (userId) => {
    try {
      console.log("Fetching user data for:", userId);
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        console.log("User document found:", userDoc.data());
        return userDoc.data();
      } else {
        console.log("User document does not exist");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return null;
    }
  };

  // Update user settings
  const updateUserSettings = async (settings) => {
    if (!currentUser) return;

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          settings: { ...settings },
        },
        { merge: true }
      );
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    console.log("🔧 Setting up auth state listener...");

    // Re-enable Firestore test to check if rules are fixed
    console.log("🧪 Starting Firestore connection test...");
    // testFirestoreConnection().then((result) => {
    //   console.log("🧪 Firestore test completed with result:", result);
    // });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "Auth state changed:",
        user ? `User: ${user.email}` : "No user"
      );
      if (user) {
        // Set the user immediately first
        setCurrentUser(user);

        // Then try to get/ensure user data from Firestore (non-blocking)
        try {
          const userData = await ensureUserDocument(user);
          console.log("User data from Firestore:", userData);
          if (userData) {
            setCurrentUser({
              ...user,
              ...userData,
            });
          }
        } catch (error) {
          console.warn(
            "Failed to fetch/ensure user data from Firestore:",
            error
          );
          // Keep the user logged in even if Firestore fails
          // Set user without Firestore data
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserData,
    updateUserSettings,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
