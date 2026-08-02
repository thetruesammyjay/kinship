"use client";

import { GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/session";

/**
 * Gate the app behind sign-in. Guests go to /signin; a signed-in registrar
 * drops straight onto the page they asked for.
 */
export default function AppGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (session.status === "guest") router.replace("/signin");
  }, [ready, session.status, router]);

  if (!ready || session.status === "guest") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf6f7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#988990",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span className="brand-icon">
            <GitBranch size={16} />
          </span>
          Loading Kinship…
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
