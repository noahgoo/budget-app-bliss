import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { dummyBudgets } from "../constants/dummyBudgets";

const dummyBalance = 3250.0;
const dummyTransactions = [
  {
    id: 1,
    category: "Food",
    amount: -45.5,
    date: "2024-06-25",
    desc: "Groceries",
  },
  {
    id: 2,
    category: "Transport",
    amount: -20,
    date: "2024-06-24",
    desc: "Gas",
  },
  {
    id: 3,
    category: "Entertainment",
    amount: -15,
    date: "2024-06-23",
    desc: "Movie",
  },
  {
    id: 4,
    category: "Food",
    amount: -12.75,
    date: "2024-06-22",
    desc: "Lunch",
  },
  {
    id: 5,
    category: "Income",
    amount: 2000,
    date: "2024-06-20",
    desc: "Paycheck",
  },
];

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

function getBarColor(percent) {
  if (percent <= 60) return "bg-sage";
  if (percent <= 80) return "bg-peach";
  if (percent <= 100) return "bg-coral";
  return "bg-red";
}

const DashboardPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-sage text-2xl font-semibold mb-2">
        Welcome, {currentUser?.displayName || "Friend"}!
      </div>
      <div className="bg-sage/20 rounded-xl p-6 flex flex-col items-center mb-6">
        <div className="text-peach text-lg mb-1">Total Balance</div>
        <div className="text-4xl font-bold text-sage">
          {formatCurrency(dummyBalance)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-charcoal border border-sage/30 rounded-xl p-6 flex flex-col min-h-[180px]">
          <div className="text-peach font-medium mb-4">Budget vs. Spending</div>
          <div className="space-y-4">
            {dummyBudgets.map((b) => {
              const percent = Math.min((b.spent / b.limit) * 100, 100);
              const barColor = getBarColor(percent);
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-sage font-semibold">
                      {b.category}
                    </span>
                    <span className="text-peach">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-peach/10 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-3 rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-charcoal border border-sage/30 rounded-xl p-6 flex flex-col min-h-[180px]">
          <div className="text-peach font-medium mb-4">Recent Transactions</div>
          <ul className="divide-y divide-sage/20">
            {dummyTransactions.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="py-2 flex items-center justify-between"
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
