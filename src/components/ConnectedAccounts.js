import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const ConnectedAccounts = ({ onSyncComplete }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const getConnectedAccounts = httpsCallable(functions, "getConnectedAccounts");
  const syncTransactions = httpsCallable(functions, "syncTransactions");

  useEffect(() => {
    if (currentUser) {
      loadConnectedAccounts();
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnectedAccounts = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Loading connected accounts for user:", currentUser.uid);
      const result = await getConnectedAccounts();
      console.log("Connected accounts result:", result);

      if (result.data && Array.isArray(result.data.accounts)) {
        setAccounts(result.data.accounts);
        console.log("Connected accounts loaded:", result.data.accounts);
      } else {
        console.warn("Invalid accounts data:", result.data);
        setAccounts([]);
      }
    } catch (err) {
      console.error("Error loading connected accounts:", err);
      setError("Failed to load connected accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    if (!currentUser) return;

    setSyncing(true);
    setError(null);

    try {
      const result = await syncTransactions();
      console.log("Transactions synced:", result.data);

      if (onSyncComplete) {
        onSyncComplete(result.data);
      }
    } catch (err) {
      console.error("Error syncing transactions:", err);
      setError("Failed to sync transactions. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
        <div className="text-center">
          <div className="text-peach text-lg font-medium mb-2">
            Connected Accounts
          </div>
          <div className="text-sage/60 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
        <div className="text-center">
          <div className="text-peach text-lg font-medium mb-2">
            Connected Accounts
          </div>
          <div className="text-sage/60 text-sm mb-4">
            No bank accounts connected yet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-peach text-lg font-medium">Connected Accounts</div>
        <button
          onClick={handleSyncTransactions}
          disabled={syncing}
          className="px-4 py-2 bg-sage text-charcoal rounded hover:bg-sage/80 transition-colors disabled:opacity-50 text-sm"
        >
          {syncing ? "Syncing..." : "Sync Transactions"}
        </button>
      </div>

      {error && (
        <div className="bg-red/20 border border-red/30 rounded-lg p-3 mb-4">
          <div className="text-red text-sm">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {accounts.map((item, index) => (
          <div key={index} className="border border-sage/20 rounded-lg p-4">
            {item.error ? (
              <div className="text-coral text-sm">
                Error loading accounts: {item.error}
              </div>
            ) : (
              <>
                <div className="text-sage font-medium mb-2">
                  Bank Account {index + 1}
                </div>
                <div className="space-y-2">
                  {item.accounts?.map((account, accIndex) => (
                    <div
                      key={accIndex}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="text-peach">{account.name}</div>
                      <div className="text-sage">
                        {account.type} • {account.subtype}
                      </div>
                    </div>
                  ))}
                </div>
                {item.last_sync_at && (
                  <div className="text-sage/60 text-xs mt-2">
                    Last synced: {new Date(item.last_sync_at).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectedAccounts;
