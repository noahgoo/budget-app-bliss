import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const Notification = ({
  message,
  type = "success",
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green/20 border-green/30";
      case "error":
        return "bg-red/20 border-red/30";
      default:
        return "bg-sage/20 border-sage/30";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-sage";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg ${getBgColor()}`}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className={`text-sm font-medium ${getTextColor()}`}>{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sage/60 hover:text-sage transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
