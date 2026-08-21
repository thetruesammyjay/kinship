"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/lib/types";
import { useSession } from "@/lib/session";

export default function RoleGate({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const { session } = useSession();

  if (!session.role || !allowed.includes(session.role)) {
    return (
      <section className="panel access-panel">
        <ShieldX size={28} />
        <h2>Restricted workspace</h2>
        <p className="muted-copy">Your account does not have permission to open this page.</p>
        <Link className="btng" href="/dashboard">Return to dashboard</Link>
      </section>
    );
  }
  return <>{children}</>;
}
