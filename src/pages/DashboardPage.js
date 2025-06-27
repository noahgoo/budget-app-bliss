import React from "react";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {currentUser?.displayName || "User"}!
            </h1>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Dashboard Coming Soon!
            </h2>
            <p className="text-gray-500">
              This is where you'll see your budget overview, recent
              transactions, and spending charts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
