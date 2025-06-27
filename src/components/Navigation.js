import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, PieChart, User } from "lucide-react";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: List,
  },
  {
    to: "/budgets",
    label: "Budgets",
    icon: PieChart,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
  },
];

const Navigation = () => (
  <nav className="w-full bg-charcoal border-t border-sage md:border-t-0 md:border-b mt-2">
    <ul className="flex justify-around md:justify-center md:space-x-8 py-2 md:py-3">
      {navItems.map(({ to, label, icon: Icon }, idx) => (
        <li key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center px-3 py-2 md:flex-row md:space-x-2 rounded-lg transition-colors duration-150 cursor-pointer
              ${
                isActive
                  ? "bg-sage/20 text-sage"
                  : "text-peach hover:bg-peach/10 hover:text-sage"
              }
              `
            }
            {...(to === "/dashboard" ? { end: true } : {})}
            style={{ minWidth: 80 }}
          >
            <Icon className="h-6 w-6 mb-0.5 md:mb-0" />
            <span className="text-xs md:text-base font-medium md:ml-1 hidden md:inline">
              {label}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default Navigation;
