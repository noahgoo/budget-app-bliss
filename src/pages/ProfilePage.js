import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PlaidDiagnostic from "../components/PlaidDiagnostic";

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Assuming you have a /login route
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="min-h-[60vh] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-charcoal border border-sage/30 rounded-xl p-8 mb-6">
          <div className="text-sage text-2xl font-semibold mb-2">Profile</div>
          <div className="text-peach mb-6">Account & Settings</div>
          <div className="w-full space-y-4 mb-8">
            <div>
              <div className="text-xs text-peach">Name</div>
              <div className="text-sage font-medium">
                {currentUser?.displayName || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs text-peach">Email</div>
              <div className="text-sage font-medium">
                {currentUser?.email || "N/A"}
              </div>
            </div>
            <div className="flex gap-8"></div>
          </div>
          <button className="btn-accent w-full" onClick={handleLogout}>
            Log out
          </button>
        </div>

        {/* Plaid Diagnostic Section */}
        <PlaidDiagnostic />
      </div>
    </div>
  );
};

export default ProfilePage;
