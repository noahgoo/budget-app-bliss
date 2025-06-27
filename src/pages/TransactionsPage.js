import React from "react";

const TransactionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Transactions
          </h1>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Transactions Coming Soon!
            </h2>
            <p className="text-gray-500">
              This is where you'll manage your income and expense transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
