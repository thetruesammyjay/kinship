"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, navItemsForRole } from "@/components/shell/navItems";
import { useSession } from "@/lib/session";

export default function BottomNav() {
  const path = usePathname();
  const { session } = useSession();
  const navItems = navItemsForRole(session.role);

  return (
    <nav className="bottomnav">
      <div className="bottomnav-inner">
        {navItems.map(({ href, label, Icon, also }) => {
          const on = isNavActive(path, href, also);
          return (
            <Link
              key={href}
              href={href}
              className={`navbtn${on ? " navon" : ""}`}
              aria-current={on ? "page" : undefined}
              style={{
                width: "auto",
                minWidth: 0,
                flex: 1,
                height: "auto",
                padding: "6px 8px",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
