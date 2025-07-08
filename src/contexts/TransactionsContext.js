import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { functions } from "../firebase/config";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "./AuthContext";
import { format } from "date-fns";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const TransactionsContext = createContext();

export function useTransactions() {
  return useContext(TransactionsContext);
}

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [firestoreAvailable, setFirestoreAvailable] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { currentUser } = useAuth();

  console.log("TransactionsProvider: firestoreAvailable", firestoreAvailable);

  const syncTransactions = httpsCallable(functions, "syncTransactions");
  const getConnectedAccounts = httpsCallable(functions, "getConnectedAccounts");

  // Check if user has connected accounts
  const checkConnectedAccounts = async () => {
    if (!currentUser) return false;

    try {
      const result = await getConnectedAccounts();
      return result.data?.accounts?.length > 0;
    } catch (error) {
      console.error("Error checking connected accounts:", error);
      return false;
    }
  };

  // Sync transactions from Plaid
  const syncPlaidTransactions = async () => {
    if (!currentUser) return;

    setSyncing(true);
    try {
      console.log("Syncing transactions from Plaid...");
      const result = await syncTransactions();
      console.log("Sync result:", result.data);

      if (result.data?.success) {
        setLastSyncTime(new Date());
        return {
          success: true,
          total_synced: result.data.total_synced || 0,
          message: `Successfully synced ${
            result.data.total_synced || 0
          } transactions`,
        };
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      console.error("Error syncing transactions:", error);
      return {
        success: false,
        error: error.message || "Failed to sync transactions",
      };
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync when user has connected accounts and transactions are empty
  const autoSyncIfNeeded = async () => {
    if (!currentUser || transactions.length > 0 || syncing) return;

    const hasConnectedAccounts = await checkConnectedAccounts();
    if (hasConnectedAccounts) {
      console.log("Auto-syncing transactions for user with connected accounts");
      await syncPlaidTransactions();
    }
  };

  useEffect(() => {
    console.log("Setting up transactions context...");

    // Don't set up listener if user is not authenticated
    if (!currentUser) {
      console.log("No user authenticated, clearing transactions");
      setTransactions([]);
      setFirestoreAvailable(false);
      setSyncing(false);
      setLastSyncTime(null);
      return;
    }

    console.log(
      `Setting up transactions listener for user: ${currentUser.uid}`
    );

    // Use user-specific transactions subcollection
    const userTransactionsRef = collection(
      db,
      "users",
      currentUser.uid,
      "transactions"
    );
    const q = query(userTransactionsRef, orderBy("date", "desc"));
    let unsub;

    try {
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const loadedTransactions = snapshot.docs.map((doc) => {
            const data = doc.data();
            let date = data.date;

            // Handle different date formats
            if (date?.toDate) {
              // Firestore timestamp
              date = format(date.toDate(), "yyyy-MM-dd"); // Convert to YYYY-MM-DD string
            } else if (typeof date === "string") {
              // Already a YYYY-MM-DD string
              date = date;
            } else if (date instanceof Date) {
              // Already a Date object, convert to YYYY-MM-DD string
              date = format(date, "yyyy-MM-dd");
            }

            return {
              id: doc.id,
              ...data,
              date: date,
            };
          });

          setTransactions(loadedTransactions);
          setFirestoreAvailable(true);
          console.log(
            `Loaded ${snapshot.docs.length} transactions for user ${currentUser.uid}`
          );

          // Auto-sync if we have no transactions but user has connected accounts
          if (loadedTransactions.length === 0) {
            autoSyncIfNeeded();
          }
        },
        (error) => {
          console.error("Firestore transactions listener error:", error);
          setFirestoreAvailable(false);
          // Don't break the app if Firestore fails
        }
      );
    } catch (error) {
      console.error("Failed to set up transactions listener:", error);
      setFirestoreAvailable(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser]); // Re-run when user changes

  async function addTransaction(newTx) {
    if (!currentUser) {
      console.error("Cannot add transaction: no user authenticated");
      return;
    }

    console.log("Attempting to add transaction:", newTx);

    if (firestoreAvailable) {
      try {
        const userTransactionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "transactions"
        );
        const docRef = await addDoc(userTransactionsRef, newTx);
        console.log(
          `Transaction added to Firestore with ID: ${docRef.id} for user ${currentUser.uid}`
        );
      } catch (error) {
        console.error("Failed to add transaction to Firestore:", error);
        // Fallback to local state
        setFirestoreAvailable(false);
        setTransactions((prev) => [
          {
            id: Date.now().toString(),
            ...newTx,
          },
          ...prev,
        ]);
      }
    } else {
      console.warn(
        "Firestore unavailable, adding transaction to local state only."
      );
      // Use local state when Firestore is unavailable
      setTransactions((prev) => [
        {
          id: Date.now().toString(),
          ...newTx,
        },
        ...prev,
      ]);
    }
  }

  async function deleteTransaction(id) {
    if (!currentUser) {
      console.error("Cannot delete transaction: no user authenticated");
      return;
    }

    if (firestoreAvailable) {
      try {
        const userTransactionRef = doc(
          db,
          "users",
          currentUser.uid,
          "transactions",
          id
        );
        await deleteDoc(userTransactionRef);
        console.log(
          `Transaction deleted from Firestore for user ${currentUser.uid}`
        );
      } catch (error) {
        console.error("Failed to delete transaction from Firestore:", error);
        // Fallback to local state
        setFirestoreAvailable(false);
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      }
    } else {
      // Use local state when Firestore is unavailable
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }
  }

  async function updateTransaction(id, updatedFields) {
    if (!currentUser) {
      console.error("Cannot update transaction: no user authenticated");
      return;
    }

    if (firestoreAvailable) {
      try {
        const userTransactionRef = doc(
          db,
          "users",
          currentUser.uid,
          "transactions",
          id
        );
        await updateDoc(userTransactionRef, updatedFields);
        console.log(
          `Transaction updated in Firestore for user ${currentUser.uid}`
        );
      } catch (error) {
        console.error("Failed to update transaction in Firestore:", error);
        // Fallback to local state
        setFirestoreAvailable(false);
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, ...updatedFields } : tx))
        );
      }
    } else {
      // Use local state when Firestore is unavailable
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...updatedFields } : tx))
      );
    }
  }

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        firestoreAvailable,
        syncing,
        lastSyncTime,
        syncPlaidTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
