import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBudgets } from "../contexts/BudgetsContext";
import { useTransactions } from "../contexts/TransactionsContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { RefreshCw } from "lucide-react";
import FirebaseDiagnostic from "../components/FirebaseDiagnostic";
import Notification from "../components/Notification";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const { budgets, budgetSummary, currentMonthBalance } = useBudgets();
  const { transactions, syncing, lastSyncTime, syncPlaidTransactions } =
    useTransactions();
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Prepare data for the balance chart
  const getBalanceChartData = () => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    const balanceHistory = {};
    let runningBalance = 0;

    // Initialize balance for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      balanceHistory[format(date, "yyyy-MM-dd")] = 0;
    }

    sortedTransactions.forEach((tx) => {
      runningBalance += tx.amount;
      const txDate = format(startOfDay(parseISO(tx.date)), "yyyy-MM-dd");
      if (balanceHistory.hasOwnProperty(txDate)) {
        balanceHistory[txDate] = runningBalance;
      }
    });

    // Adjust for gaps: carry forward previous day's balance
    let lastKnownBalance = 0;
    const dates = Object.keys(balanceHistory).sort();
    for (const date of dates) {
      if (balanceHistory[date] === 0 && date !== dates[0]) {
        balanceHistory[date] = lastKnownBalance;
      } else {
        lastKnownBalance = balanceHistory[date];
      }
    }

    const labels = Object.keys(balanceHistory).map((date) =>
      format(parseISO(date), "MMM dd")
    );
    const data = Object.values(balanceHistory);

    return {
      labels,
      datasets: [
        {
          label: "Balance",
          data: data,
          fill: false,
          borderColor: "#99B898", // sage color
          tension: 0.1,
          pointBackgroundColor: "#99B898",
          pointBorderColor: "#99B898",
          pointHoverBackgroundColor: "#99B898",
          pointHoverBorderColor: "#99B898",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return formatCurrency(context.raw);
          },
        },
        backgroundColor: "#2A363B",
        titleColor: "#99B898",
        bodyColor: "#FFCEA8",
        borderColor: "#99B898",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#99B898", // sage
          autoSkip: true,
          maxTicksLimit: 7,
        },
        grid: {
          color: "#3B4742", // dark sage for grid
        },
        border: {
          color: "#99B898",
        },
      },
      y: {
        ticks: {
          color: "#99B898", // sage
          callback: function (value) {
            return formatCurrency(value);
          },
        },
        grid: {
          color: "#3B4742", // dark sage for grid
        },
        border: {
          color: "#99B898",
        },
      },
    },
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
      <div className="flex justify-between items-center mb-2">
        <div className="text-sage text-2xl font-semibold">
          Welcome, {currentUser?.displayName || "Friend"}!
        </div>
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
              className={`h-5 w-5 text-peach ${syncing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className="text-sage/60 hover:text-sage text-sm"
          >
            {showDiagnostic ? "Hide" : "Show"} Diagnostic
          </button>
        </div>
      </div>

      {showDiagnostic && <FirebaseDiagnostic />}

      {/* Balance Overview */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-sage/20 rounded-xl p-6 flex flex-col items-center">
          <div className="text-peach text-lg mb-1">Current Balance</div>
          <div className="text-3xl font-bold text-sage">
            {formatCurrency(currentMonthBalance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-charcoal border border-sage/30 rounded-xl p-6 flex flex-col min-h-[180px]">
          <div className="text-peach font-medium mb-4">Budget vs. Spending</div>
          <div className="space-y-4">
            {budgets.map((b) => {
              const percent = Math.min((b.spent / b.limit) * 100, 100);
              const barColor = getBarColor(percent);
              const remaining = b.limit - b.spent;
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-sage font-semibold">
                      {b.category}
                    </span>
                    <span
                      className={`${
                        remaining >= 0 ? "text-peach" : "text-coral"
                      }`}
                    >
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-peach/10 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-3 rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  {remaining < 0 && (
                    <div className="text-xs text-coral mt-1">
                      Over budget by {formatCurrency(Math.abs(remaining))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {budgets.length === 0 && (
            <div className="flex items-center justify-center h-full text-peach/60">
              No budgets set up yet
            </div>
          )}
        </div>

        <div className="bg-charcoal border border-sage/30 rounded-xl p-6 flex flex-col min-h-[180px]">
          <div className="text-peach font-medium mb-4">Recent Transactions</div>
          <ul className="divide-y divide-sage/20">
            {transactions.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="py-2 flex items-center justify-between"
              >
                <div>
                  <div className="text-sage font-medium text-sm">
                    {tx.description || tx.desc}
                  </div>
                  <div className="text-peach text-xs">
                    {tx.category} • {format(parseISO(tx.date), "MMM dd, yyyy")}
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
          {transactions.length === 0 && (
            <div className="flex items-center justify-center h-full text-peach/60">
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* Total Balance Graph */}
      <div className="bg-charcoal border border-sage/30 rounded-xl p-6">
        <div className="text-peach font-medium mb-4">
          Balance Trend (Last 30 Days)
        </div>
        {transactions.length > 0 ? (
          <Line data={getBalanceChartData()} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-48 text-peach/60">
            No transactions to display balance trend.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
