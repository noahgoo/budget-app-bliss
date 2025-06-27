import React, { createContext, useContext, useState } from "react";

const dummyTransactions = [
  {
    id: 1,
    category: "Food",
    desc: "Groceries",
    amount: -45.5,
    date: "2024-06-25",
  },
  {
    id: 2,
    category: "Transport",
    desc: "Gas",
    amount: -20,
    date: "2024-06-24",
  },
  {
    id: 3,
    category: "Entertainment",
    desc: "Movie",
    amount: -15,
    date: "2024-06-23",
  },
  {
    id: 4,
    category: "Food",
    desc: "Lunch",
    amount: -12.75,
    date: "2024-06-22",
  },
  {
    id: 5,
    category: "Income",
    desc: "Paycheck",
    amount: 2000,
    date: "2024-06-20",
  },
  {
    id: 6,
    category: "Shopping",
    desc: "Clothes",
    amount: -80,
    date: "2024-06-19",
  },
  {
    id: 7,
    category: "Savings",
    desc: "Transfer to Savings",
    amount: -100,
    date: "2024-06-18",
  },
];

const TransactionsContext = createContext();

export function useTransactions() {
  return useContext(TransactionsContext);
}

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState(dummyTransactions);

  function addTransaction(newTx) {
    setTransactions((prev) => [
      {
        id: prev.length ? Math.max(...prev.map((t) => t.id)) + 1 : 1,
        ...newTx,
      },
      ...prev,
    ]);
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <TransactionsContext.Provider
      value={{ transactions, addTransaction, deleteTransaction }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
