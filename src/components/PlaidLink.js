import React, { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const PlaidLink = ({ onSuccess, onError }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const createLinkToken = httpsCallable(functions, "createLinkToken");
  const exchangePublicToken = httpsCallable(functions, "exchangePublicToken");

  // Only generate link token when user explicitly wants to connect
  // Don't auto-generate on page load

  const generateLinkToken = async () => {
    if (!currentUser) {
      setError("You must be logged in to connect a bank account");
      return;
    }

    setGeneratingToken(true);
    setLoading(true);
    setError(null);

    try {
      console.log("Creating link token for user:", currentUser.uid);
      const result = await createLinkToken();
      console.log("Link token result:", result);

      if (result.data && result.data.link_token) {
        setLinkToken(result.data.link_token);
        console.log("Link token created successfully");
      } else {
        console.error("No link token in response:", result);
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("Error creating link token:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        details: err.details,
      });

      if (err.code === "functions/unavailable") {
        setError(
          "Bank connection service is temporarily unavailable. Please try again later."
        );
      } else if (err.code === "functions/unauthenticated") {
        setError("Please log in again to connect your bank account.");
      } else {
        setError(`Failed to initialize bank connection: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setGeneratingToken(false);
    }
  };

  const onPlaidSuccess = async (public_token, metadata) => {
    setLoading(true);
    setError(null);

    try {
      const result = await exchangePublicToken({ public_token });
      console.log("Bank account connected successfully:", result.data);

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err) {
      console.error("Error exchanging public token:", err);
      setError("Failed to connect bank account. Please try again.");

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const onPlaidExit = (err, metadata) => {
    if (err) {
      console.error("Plaid Link exit error:", err);
      setError("Bank connection was cancelled or failed.");
    }
  };

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  };

  const { open, ready } = usePlaidLink(config);

  // Auto-open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready && !loading && !generatingToken) {
      open();
    }
  }, [linkToken, ready, loading, generatingToken, open]);

  const handleConnectBank = async () => {
    if (!currentUser) {
      setError("You must be logged in to connect a bank account");
      return;
    }

    // Generate link token when user clicks the button
    if (!linkToken) {
      await generateLinkToken();
      return;
    }

    if (!ready) {
      setError("Bank connection is not ready. Please try again.");
      return;
    }

    open();
  };

  if (!currentUser) {
    return (
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
        <div className="text-center">
          <div className="text-peach text-lg font-medium mb-2">
            Connect Your Bank
          </div>
          <div className="text-sage/60 text-sm">
            Please log in to connect your bank account
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
      <div className="text-center">
        <div className="text-peach text-lg font-medium mb-4">
          Connect Your Bank Account
        </div>

        {error && (
          <div className="bg-red/20 border border-red/30 rounded-lg p-3 mb-4">
            <div className="text-red text-sm">{error}</div>
          </div>
        )}

        <div className="text-sage/60 text-sm mb-6">
          Securely connect your bank account to automatically import
          transactions
        </div>

        <button
          onClick={handleConnectBank}
          disabled={loading || generatingToken}
          className="px-6 py-3 bg-sage text-charcoal rounded-lg hover:bg-sage/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading || generatingToken
            ? "Initializing..."
            : "Connect Bank Account"}
        </button>

        {linkToken && !ready && !loading && (
          <div className="text-sage/60 text-xs mt-2">
            Initializing bank connection...
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaidLink;
