import React from "react";

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

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const TransactionsPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sage text-2xl font-semibold">Transactions</h1>
        <button className="btn-accent">+ Add Transaction</button>
      </div>
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6 min-h-[180px]">
        <div className="text-peach font-medium mb-4">Your Transactions</div>
        <ul className="divide-y divide-sage/20">
          {dummyTransactions.map((tx) => (
            <li key={tx.id} className="py-3 flex items-center justify-between">
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TransactionsPage;
