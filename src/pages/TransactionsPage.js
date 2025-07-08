import React, { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import PlaidLink from "../components/PlaidLink";
import ConnectedAccounts from "../components/ConnectedAccounts";
import Notification from "../components/Notification";
import { TRANSACTION_CATEGORIES } from "../constants/categories";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const today = () => new Date().toISOString().slice(0, 10);

const TransactionsPage = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    syncing,
    lastSyncTime,
    syncPlaidTransactions,
  } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [notification, setNotification] = useState(null);

  const handleOpenModal = () => {
    setShowModal(true);
    setCategory("");
    setAmount("");
    setDescription("");
    setDate(today());
  };
  const handleCloseModal = () => setShowModal(false);

  const handleSave = (e) => {
    e.preventDefault();
    addTransaction({ category, amount: parseFloat(amount), description, date });
    setShowModal(false);
  };

  const handleSyncComplete = (result) => {
    console.log("Sync completed:", result);
    setNotification({
      type: "success",
      message: `Successfully synced ${result.total_synced || 0} transactions!`,
    });
    // The transactions will automatically update via the Firestore listener
  };

  const handleManualSync = async () => {
    const result = await syncPlaidTransactions();
    if (result.success) {
      setNotification({
        type: "success",
        message: result.message,
      });
    } else {
      setNotification({
        type: "error",
        message: result.error,
      });
    }
  };

  const handlePlaidSuccess = (result) => {
    console.log("Bank account connected:", result);
    setNotification({
      type: "success",
      message:
        "Bank account connected successfully! Transactions will sync automatically.",
    });
  };

  const handlePlaidError = (error) => {
    console.error("Plaid error:", error);
    setNotification({
      type: "error",
      message: "Failed to connect bank account. Please try again.",
    });
  };

  return (
    <div className="space-y-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sage text-2xl font-semibold">Transactions</h1>
        <button className="btn-accent" onClick={handleOpenModal}>
          + Add Transaction
        </button>
      </div>

      {/* Plaid Integration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaidLink onSuccess={handlePlaidSuccess} onError={handlePlaidError} />
        <ConnectedAccounts onSyncComplete={handleSyncComplete} />
      </div>
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6 min-h-[180px] relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-peach font-medium">Your Transactions</div>
          <div className="flex items-center gap-2">
            {syncing && (
              <div className="flex items-center gap-2 text-sage/60 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </div>
            )}
            {lastSyncTime && !syncing && (
              <div className="text-sage/60 text-xs">
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="p-2 rounded-full hover:bg-peach/10 transition-colors disabled:opacity-50"
              aria-label="Sync Transactions"
            >
              <RefreshCw
                className={`h-5 w-5 text-peach ${
                  syncing ? "animate-spin" : ""
                }`}
              />
            </button>
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
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sage/60 text-sm mb-2">
              {syncing ? "Syncing transactions..." : "No transactions yet"}
            </div>
            {!syncing && (
              <div className="text-sage/40 text-xs">
                Connect your bank account or add transactions manually to get
                started
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-sage/20">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="py-3 flex items-center justify-between relative group"
              >
                {editMode && editingId === tx.id ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateTransaction(tx.id, editFields);
                      setEditingId(null);
                      setEditFields({});
                    }}
                  >
                    <select
                      className="input bg-charcoal text-white text-xs max-w-[120px]"
                      value={editFields.category || tx.category}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          category: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {TRANSACTION_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input text-xs max-w-[80px]"
                      type="number"
                      step="0.01"
                      value={
                        editFields.amount !== undefined
                          ? editFields.amount
                          : tx.amount
                      }
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          amount: parseFloat(e.target.value),
                        }))
                      }
                      required
                    />
                    <input
                      className="input text-xs max-w-[120px]"
                      type="text"
                      value={editFields.description || tx.description}
                      onChange={(e) =>
                        setEditFields((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      className="input text-xs max-w-[110px]"
                      type="date"
                      value={editFields.date || tx.date}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, date: e.target.value }))
                      }
                      required
                    />
                    <button type="submit" className="ml-2 btn-primary btn-xs">
                      Save
                    </button>
                    <button
                      type="button"
                      className="ml-1 btn-accent btn-xs"
                      onClick={() => {
                        setEditingId(null);
                        setEditFields({});
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div>
                      <div className="text-sage font-medium text-sm">
                        {tx.description || tx.desc}
                      </div>
                      <div className="text-peach text-xs">
                        {tx.category} •{" "}
                        {format(parseISO(tx.date), "MMM dd, yyyy")}
                        {tx.plaid_id && (
                          <span className="ml-2 text-sage/40">
                            • {tx.account_name || "Bank Transaction"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-2 min-w-[150px] justify-end">
                      <div
                        className={`text-right font-semibold ${
                          tx.amount < 0 ? "text-coral" : "text-sage"
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </div>
                      {editMode && (
                        <>
                          <button
                            className="ml-1 p-1 rounded-full bg-peach/10 hover:bg-peach/20 transition-colors"
                            onClick={() => {
                              setEditingId(tx.id);
                              setEditFields({
                                category: tx.category,
                                amount: tx.amount,
                                description: tx.description,
                                date: tx.date,
                              });
                            }}
                            aria-label={`Edit transaction for ${tx.description}`}
                          >
                            <Pencil className="h-5 w-5 text-peach" />
                          </button>
                          <button
                            className="ml-1 p-1 rounded-full bg-red/10 hover:bg-red/30 transition-colors"
                            onClick={() => deleteTransaction(tx.id)}
                            aria-label={`Delete transaction for ${tx.description}`}
                          >
                            <Trash2 className="h-5 w-5 text-red" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
