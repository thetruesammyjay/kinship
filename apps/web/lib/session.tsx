"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest, SESSION_KEY } from "@/lib/api";
import type { TokenResponse, UserRead } from "@/lib/types";
import type { UserRole } from "@/lib/types";

export type Session = {
  status: "guest" | "signed";
  token: string | null;
  email: string;
  fullName: string;
  role: UserRole | null;
};

const GUEST: Session = { status: "guest", token: null, email: "", fullName: "", role: null };

type SessionContextValue = {
  session: Session;
  ready: boolean;
  busy: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phoneNumber?: string,
  ) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(GUEST);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<Session>;
          if (stored.token) {
            const user = await apiRequest<UserRead>("/auth/me", {
              headers: { Authorization: `Bearer ${stored.token}` },
            });
            if (!cancelled) {
              setSession({
                status: "signed",
                token: stored.token,
                email: user.email,
                fullName: user.full_name,
                role: user.role as UserRole,
              });
            }
          }
        }
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
        if (!cancelled) setSession(GUEST);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Session) => {
    setSession(next);
    if (next.status === "signed") {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      try {
        const { access_token } = await apiRequest<TokenResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const user = await apiRequest<UserRead>("/auth/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        persist({
          status: "signed",
          token: access_token,
          email: user.email,
          fullName: user.full_name,
          role: user.role as UserRole,
        });
      } finally {
        setBusy(false);
      }
    },
    [persist],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string, phoneNumber?: string) => {
      setBusy(true);
      try {
        const user = await apiRequest<UserRead>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            phone_number: phoneNumber || null,
          }),
        });
        const { access_token } = await apiRequest<TokenResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        persist({
          status: "signed",
          token: access_token,
          email: user.email,
          fullName: user.full_name,
          role: user.role as UserRole,
        });
      } finally {
        setBusy(false);
      }
    },
    [persist],
  );

  const signOut = useCallback(() => persist(GUEST), [persist]);

  return (
    <SessionContext.Provider value={{ session, ready, busy, login, register, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}
