import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

const PlaidDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testPlaidConfig = httpsCallable(functions, "testPlaidConfig");

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testPlaidConfig();
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-charcoal border border-sage/30 rounded-xl p-6 mb-6">
      <div className="text-center">
        <div className="text-peach text-lg font-medium mb-4">
          Plaid Configuration Diagnostic
        </div>

        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="px-6 py-3 bg-coral text-white rounded-lg hover:bg-coral/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mb-4"
        >
          {loading ? "Running..." : "Test Plaid Config"}
        </button>

        {error && (
          <div className="bg-red/20 border border-red/30 rounded-lg p-3 mb-4">
            <div className="text-red text-sm">{error}</div>
          </div>
        )}

        {result && (
          <div className="text-left">
            <div className="bg-sage/10 border border-sage/30 rounded-lg p-4 mb-4">
              <h3 className="text-sage font-medium mb-2">
                Configuration Status:
              </h3>
              <div className="text-sm space-y-1">
                <div>
                  Client ID:{" "}
                  <span
                    className={
                      result.configStatus.clientId === "PRESENT"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {result.configStatus.clientId}
                  </span>
                </div>
                <div>
                  Secret:{" "}
                  <span
                    className={
                      result.configStatus.secret === "PRESENT"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {result.configStatus.secret}
                  </span>
                </div>
                <div>
                  Client ID Length: {result.configStatus.clientIdLength}
                </div>
                <div>Secret Length: {result.configStatus.secretLength}</div>
              </div>
            </div>

            <div className="bg-sage/10 border border-sage/30 rounded-lg p-4 mb-4">
              <h3 className="text-sage font-medium mb-2">
                Plaid Client Status:
              </h3>
              <div className="text-sm">
                <span
                  className={
                    result.plaidClientStatus === "SUCCESS"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {result.plaidClientStatus}
                </span>
              </div>
            </div>

            <div className="bg-sage/10 border border-sage/30 rounded-lg p-4">
              <h3 className="text-sage font-medium mb-2">
                Available Config Keys:
              </h3>
              <div className="text-sm">
                <div className="mb-2">
                  <strong>All Keys:</strong>{" "}
                  {result.configStatus.availableConfigKeys.join(", ") || "None"}
                </div>
                <div>
                  <strong>Plaid Keys:</strong>{" "}
                  {result.configStatus.plaidConfigKeys.join(", ") || "None"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaidDiagnostic;
