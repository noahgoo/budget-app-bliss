import React, { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { TRANSACTION_CATEGORIES } from "../constants/categories";
import { Pencil, Trash2 } from "lucide-react";

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const today = () => new Date().toISOString().slice(0, 10);

const TransactionsPage = () => {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(today());
  const [editMode, setEditMode] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
    setCategory("");
    setAmount("");
    setDesc("");
    setDate(today());
  };
  const handleCloseModal = () => setShowModal(false);

  const handleSave = (e) => {
    e.preventDefault();
    addTransaction({ category, amount: parseFloat(amount), desc, date });
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sage text-2xl font-semibold">Transactions</h1>
        <button className="btn-accent" onClick={handleOpenModal}>
          + Add Transaction
        </button>
      </div>
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6 min-h-[180px] relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-peach font-medium">Your Transactions</div>
          <button
            className={`p-2 rounded-full hover:bg-peach/10 transition-colors ${
              editMode ? "bg-peach/10" : ""
            }`}
            onClick={() => setEditMode((v) => !v)}
            aria-label="Edit Transactions"
          >
            <Pencil className="h-5 w-5 text-peach" />
          </button>
        </div>
        <ul className="divide-y divide-sage/20">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="py-3 flex items-center justify-between relative group"
            >
              <div>
                <div className="text-sage font-medium text-sm">{tx.desc}</div>
                <div className="text-peach text-xs">
                  {tx.category} • {tx.date}
                </div>
              </div>
              <div
                className={`text-right font-semibold ${
                  tx.amount < 0 ? "text-coral" : "text-sage"
                }`}
              >
                {formatCurrency(tx.amount)}
              </div>
              {editMode && (
                <button
                  className="ml-3 p-1 rounded-full bg-red/10 hover:bg-red/30 transition-colors"
                  onClick={() => deleteTransaction(tx.id)}
                  aria-label={`Delete transaction for ${tx.desc}`}
                >
                  <Trash2 className="h-5 w-5 text-red" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/70">
          <form
            className="bg-charcoal border border-sage/30 rounded-xl p-8 w-full max-w-sm flex flex-col items-center shadow-lg"
            onSubmit={handleSave}
          >
            <div className="text-sage text-xl font-semibold mb-4">
              Add Transaction
            </div>
            <div className="w-full mb-4">
              <label className="block text-peach text-sm mb-1">Category</label>
              <div className="relative">
                <select
                  className="input bg-charcoal text-white pr-8 appearance-none focus:ring-sage focus:border-sage"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {/* Custom arrow */}
                <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-peach">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 10l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-full mb-4">
              <label className="block text-peach text-sm mb-1">Amount</label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Enter amount (use - for expense, + for income)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="w-full mb-4">
              <label className="block text-peach text-sm mb-1">
                Description
              </label>
              <input
                className="input"
                type="text"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
            </div>
            <div className="w-full mb-6">
              <label className="block text-peach text-sm mb-1">Date</label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex w-full gap-3">
              <button
                type="button"
                className="btn-accent flex-1 bg-red text-white hover:bg-red/80 focus:ring-red"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
