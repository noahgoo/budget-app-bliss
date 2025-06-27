import React from "react";

const dummyUser = {
  name: "Bliss User",
  email: "bliss@example.com",
  currency: "USD",
  theme: "Light",
};

const ProfilePage = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-charcoal border border-sage/30 rounded-xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="text-sage text-2xl font-semibold mb-2">Profile</div>
        <div className="text-peach mb-6">Account & Settings</div>
        <div className="w-full space-y-4 mb-8">
          <div>
            <div className="text-xs text-peach">Name</div>
            <div className="text-sage font-medium">{dummyUser.name}</div>
          </div>
          <div>
            <div className="text-xs text-peach">Email</div>
            <div className="text-sage font-medium">{dummyUser.email}</div>
          </div>
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-peach">Currency</div>
              <div className="text-sage font-medium">{dummyUser.currency}</div>
            </div>
            <div>
              <div className="text-xs text-peach">Theme</div>
              <div className="text-sage font-medium">{dummyUser.theme}</div>
            </div>
          </div>
        </div>
        <button className="btn-accent w-full">Log out</button>
      </div>
    </div>
  );
};

export default ProfilePage;
