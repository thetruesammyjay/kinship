"use client";

import { GitBranch, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, navItemsForRole } from "@/components/shell/navItems";
import { useSession } from "@/lib/session";

export default function LeftRail() {
  const path = usePathname();
  const { session, signOut } = useSession();
  const navItems = navItemsForRole(session.role);

  return (
    <div className="lrail">
      <Link href="/" className="logo" aria-label="Kinship home">
        <GitBranch size={22} />
      </Link>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 30,
          width: "100%",
          alignItems: "center",
        }}
      >
        {navItems.map(({ href, label, Icon, also }) => {
          const on = isNavActive(path, href, also);
          return (
            <Link
              key={href}
              href={href}
              className={`railbtn${on ? " railon" : ""}`}
              aria-current={on ? "page" : undefined}
              style={{ width: 68, padding: "9px 0", flexDirection: "column", gap: 4 }}
            >
              <Icon size={21} />
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  lineHeight: 1,
                  color: on ? "#fff" : "#74656b",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div style={{ marginTop: "auto" }}>
        <button
          onClick={signOut}
          title="Sign out"
          className="railbtn"
          style={{ width: 46, height: 46, border: "1.5px dashed #ffb0c0", color: "#ff3358" }}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
