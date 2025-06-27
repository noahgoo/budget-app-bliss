import React, { createContext, useContext, useState } from "react";
import { dummyBudgets } from "../constants/dummyBudgets";

const BudgetsContext = createContext();

export function useBudgets() {
  return useContext(BudgetsContext);
}

export function BudgetsProvider({ children }) {
  const [budgets, setBudgets] = useState(dummyBudgets);

  function addBudget(newBudget) {
    setBudgets((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((b) => b.id)) + 1 : 1,
        ...newBudget,
        spent: 0,
      },
    ]);
  }

  function deleteBudget(id) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <BudgetsContext.Provider value={{ budgets, addBudget, deleteBudget }}>
      {children}
    </BudgetsContext.Provider>
  );
}
