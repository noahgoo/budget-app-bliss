import React from "react";
import blissLogo from "../assets/bliss-logo.png";

const Header = () => (
  <header className="bg-transparent">
    <div className="flex items-center px-6 py-4">
      <img
        src={blissLogo}
        alt="Bliss logo"
        className="h-10 w-10 mr-3 rounded-full bg-sage object-cover border-2 border-peach shadow-none"
        style={{ background: "#99B898" }}
      />
      <span
        className="text-2xl font-semibold tracking-widest text-sage select-none"
        style={{ letterSpacing: "0.2em" }}
      >
        BLISS
      </span>
    </div>
  </header>
);

export default Header;
