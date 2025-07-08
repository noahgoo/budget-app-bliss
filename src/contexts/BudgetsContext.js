import React, { createContext, useContext, useState, useMemo } from "react";
import { dummyBudgets } from "../constants/dummyBudgets";
import { useTransactions } from "./TransactionsContext";
import { parseISO } from "date-fns";

const BudgetsContext = createContext();

export function useBudgets() {
  return useContext(BudgetsContext);
}

// Map transaction category names to budget category names
const mapTransactionCategoryToBudget = (transactionCategory) => {
  const categoryMapping = {
    "Food & Dining": "Food",
    Transportation: "Transport",
    Entertainment: "Entertainment",
    Shopping: "Shopping",
    Healthcare: "Health",
    Education: "Education",
    Utilities: "Utilities",
    Housing: "Housing",
    Insurance: "Insurance",
    Savings: "Savings",
    Other: "Other",
  };

  return categoryMapping[transactionCategory] || transactionCategory;
};

export function BudgetsProvider({ children }) {
  const [budgets, setBudgets] = useState(
    dummyBudgets.map((budget) => ({ ...budget, spent: 0 }))
  );
  const { transactions } = useTransactions();

  // Calculate spent amounts from transactions for each budget category
  const budgetsWithCalculatedSpent = useMemo(() => {
    return budgets.map((budget) => {
      // Find all expense transactions for this budget category
      const categoryTransactions = transactions.filter((tx) => {
        const mappedCategory = mapTransactionCategoryToBudget(tx.category);
        return mappedCategory === budget.category && tx.amount < 0; // Only negative amounts (expenses)
      });

      // Calculate total spent (convert negative amounts to positive)
      const totalSpent = categoryTransactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      );

      return {
        ...budget,
        spent: totalSpent,
      };
    });
  }, [budgets, transactions]);

  // Calculate overall budget vs spending summary
  const budgetSummary = useMemo(() => {
    const totalBudget = budgetsWithCalculatedSpent.reduce(
      (sum, b) => sum + b.limit,
      0
    );
    const totalSpent = budgetsWithCalculatedSpent.reduce(
      (sum, b) => sum + b.spent,
      0
    );
    const totalRemaining = totalBudget - totalSpent;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      percentSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [budgetsWithCalculatedSpent]);

  // Calculate current month's balance (income - all expenses)
  const currentMonthBalance = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthTransactions = transactions.filter((tx) => {
      const txDate = parseISO(tx.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    return currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  function addBudget(newBudget) {
    setBudgets((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((b) => b.id)) + 1 : 1,
        ...newBudget,
        spent: 0, // Will be calculated from transactions
      },
    ]);
  }

  function deleteBudget(id) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBudget(id, updates) {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  }

  // Get spending for a specific category
  function getSpendingForCategory(category) {
    const categoryTransactions = transactions.filter((tx) => {
      const mappedCategory = mapTransactionCategoryToBudget(tx.category);
      return mappedCategory === category && tx.amount < 0;
    });
    return categoryTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );
  }

  // Check if a category is over budget
  function isCategoryOverBudget(category) {
    const budget = budgetsWithCalculatedSpent.find(
      (b) => b.category === category
    );
    return budget ? budget.spent > budget.limit : false;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets: budgetsWithCalculatedSpent,
        addBudget,
        deleteBudget,
        updateBudget,
        budgetSummary,
        currentMonthBalance,
        getSpendingForCategory,
        isCategoryOverBudget,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
}
