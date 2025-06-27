import React, { useState } from "react";
import { useBudgets } from "../contexts/BudgetsContext";
import { TRANSACTION_CATEGORIES } from "../constants/categories";
import { Pencil, Trash2 } from "lucide-react";

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

function getBarColor(percent) {
  if (percent <= 60) return "bg-sage";
  if (percent <= 80) return "bg-peach";
  if (percent <= 100) return "bg-coral";
  return "bg-red";
}

const BudgetsPage = () => {
  const { budgets, addBudget, deleteBudget } = useBudgets();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [editMode, setEditMode] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedCategory("");
    setCustomCategory("");
    setAmount("");
  };
  const handleCloseModal = () => setShowModal(false);

  const handleSave = (e) => {
    e.preventDefault();
    const categoryName =
      selectedCategory === "custom" ? customCategory : selectedCategory;
    addBudget({ category: categoryName, limit: parseFloat(amount) });
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sage text-2xl font-semibold">Budgets</h1>
        <button className="btn-accent" onClick={handleOpenModal}>
          + Add Budget
        </button>
      </div>
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-peach font-medium">Monthly Budgets</div>
          <button
            className={`p-2 rounded-full hover:bg-peach/10 transition-colors ${
              editMode ? "bg-peach/10" : ""
            }`}
            onClick={() => setEditMode((v) => !v)}
            aria-label="Edit Budgets"
          >
            <Pencil className="h-5 w-5 text-peach" />
          </button>
        </div>
        <ul className="space-y-6">
          {budgets.map((b) => {
            const percent = Math.min((b.spent / b.limit) * 100, 100);
            const barColor = getBarColor(percent);
            return (
              <li key={b.id} className="flex flex-col gap-1 relative group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sage font-semibold">{b.category}</span>
                  <span className="text-peach text-sm">
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </span>
                  {editMode && (
                    <button
                      className="ml-3 p-1 rounded-full bg-red/10 hover:bg-red/30 transition-colors"
                      onClick={() => deleteBudget(b.id)}
                      aria-label={`Delete budget for ${b.category}`}
                    >
                      <Trash2 className="h-5 w-5 text-red" />
                    </button>
                  )}
                </div>
                <div className="w-full h-3 bg-peach/10 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-3 rounded-full transition-all`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/70">
          <form
            className="bg-charcoal border border-sage/30 rounded-xl p-8 w-full max-w-sm flex flex-col items-center shadow-lg"
            onSubmit={handleSave}
          >
            <div className="text-sage text-xl font-semibold mb-4">
              Add Budget
            </div>
            <div className="w-full mb-4">
              <label className="block text-peach text-sm mb-1">Category</label>
              <div className="relative">
                <select
                  className="input bg-charcoal text-white pr-8 appearance-none focus:ring-sage focus:border-sage"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
                  <option value="custom">Other (Custom)</option>
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
              {selectedCategory === "custom" && (
                <input
                  className="input mt-2"
                  type="text"
                  placeholder="Custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              )}
            </div>
            <div className="w-full mb-6">
              <label className="block text-peach text-sm mb-1">
                Monthly Limit
              </label>
              <input
                className="input"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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

export default BudgetsPage;
