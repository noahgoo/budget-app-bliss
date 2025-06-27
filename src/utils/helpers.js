import { format, parseISO } from "date-fns";

// Currency formatting
export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Date formatting
export const formatDate = (date, formatString = "MMM dd, yyyy") => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString);
};

export const formatDateForInput = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
};

// Month formatting
export const formatMonth = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMMM yyyy");
};

export const formatMonthKey = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM");
};

// Budget progress calculation
export const calculateBudgetProgress = (spent, budget) => {
  if (!budget || budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
};

export const getBudgetStatus = (spent, budget) => {
  const progress = calculateBudgetProgress(spent, budget);
  if (progress >= 100) return "danger";
  if (progress >= 80) return "warning";
  return "success";
};

// Validation helpers
export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Local storage helpers
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
};

export const setToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

// Debounce helper
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
