export const TRANSACTION_CATEGORIES = [
  { id: "food", name: "Food & Dining", color: "#ef4444", icon: "🍽️" },
  { id: "transport", name: "Transportation", color: "#3b82f6", icon: "🚗" },
  { id: "entertainment", name: "Entertainment", color: "#8b5cf6", icon: "🎬" },
  { id: "shopping", name: "Shopping", color: "#f59e0b", icon: "🛍️" },
  { id: "health", name: "Healthcare", color: "#10b981", icon: "🏥" },
  { id: "education", name: "Education", color: "#06b6d4", icon: "📚" },
  { id: "utilities", name: "Utilities", color: "#f97316", icon: "⚡" },
  { id: "housing", name: "Housing", color: "#84cc16", icon: "🏠" },
  { id: "insurance", name: "Insurance", color: "#6366f1", icon: "🛡️" },
  { id: "savings", name: "Savings", color: "#22c55e", icon: "💰" },
  { id: "other", name: "Other", color: "#6b7280", icon: "📝" },
];

export const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", color: "#22c55e", icon: "💼" },
  { id: "freelance", name: "Freelance", color: "#10b981", icon: "💻" },
  { id: "investment", name: "Investment", color: "#f59e0b", icon: "📈" },
  { id: "gift", name: "Gift", color: "#8b5cf6", icon: "🎁" },
  { id: "other_income", name: "Other Income", color: "#6b7280", icon: "📝" },
];

export const getCategoryById = (id) => {
  return [...TRANSACTION_CATEGORIES, ...INCOME_CATEGORIES].find(
    (cat) => cat.id === id
  );
};

export const getCategoryColor = (id) => {
  const category = getCategoryById(id);
  return category ? category.color : "#6b7280";
};

export const getCategoryName = (id) => {
  const category = getCategoryById(id);
  return category ? category.name : "Unknown";
};
