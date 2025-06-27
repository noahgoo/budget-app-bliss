import React from "react";
import { dummyBudgets } from "../constants/dummyBudgets";

const formatCurrency = (amount) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

function getBarColor(percent) {
  if (percent <= 60) return "bg-sage";
  if (percent <= 80) return "bg-peach";
  if (percent <= 100) return "bg-coral";
  return "bg-red";
}

const BudgetsPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sage text-2xl font-semibold">Budgets</h1>
        <button className="btn-accent">+ Add Budget</button>
      </div>
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
        <div className="text-peach font-medium mb-4">Monthly Budgets</div>
        <ul className="space-y-6">
          {dummyBudgets.map((b) => {
            const percent = Math.min((b.spent / b.limit) * 100, 100);
            const barColor = getBarColor(percent);
            return (
              <li key={b.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sage font-semibold">{b.category}</span>
                  <span className="text-peach text-sm">
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </span>
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
    </div>
  );
};

export default BudgetsPage;
