import { Bell, GitBranch, Menu, Search } from "lucide-react";

import type { AppView } from "../../types";

type NavbarProps = {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
};

const navItems: Array<{ id: AppView; label: string }> = [
  { id: "dashboard", label: "Home" },
  { id: "register", label: "Register" },
  { id: "tree", label: "Tree" },
  { id: "verify", label: "Verify" },
];

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  return (
    <header className="topbar">
      <button className="icon-button" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <button className="brand-lockup" onClick={() => onViewChange("dashboard")}>
        <span className="brand-mark">
          <GitBranch size={18} />
        </span>
        <span>Kinship</span>
      </button>
      <nav className="desktop-nav" aria-label="Primary">
        {navItems.map((item) => (
          <button
            className={item.id === currentView ? "nav-pill active" : "nav-pill"}
            key={item.id}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Search records">
          <Search size={19} />
        </button>
        <button className="icon-button alert" aria-label="Notifications">
          <Bell size={19} />
        </button>
      </div>
    </header>
  );
}
