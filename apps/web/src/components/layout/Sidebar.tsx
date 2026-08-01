import { BarChart3, GitFork, Home, Network, ShieldCheck, UserPlus } from "lucide-react";

import type { AppView } from "../../types";

type SidebarProps = {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
};

const items: Array<{ id: AppView; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "register", label: "Register", icon: UserPlus },
  { id: "tree", label: "Family Tree", icon: Network },
  { id: "verify", label: "Verify", icon: ShieldCheck },
  { id: "evaluation", label: "Metrics", icon: BarChart3 },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-title">
            <GitFork size={18} />
            <span>Registry</span>
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={item.id === currentView ? "side-link active" : "side-link"}
                key={item.id}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <nav className="mobile-tabbar" aria-label="Mobile primary">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={item.id === currentView ? "mobile-tab active" : "mobile-tab"}
              key={item.id}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
