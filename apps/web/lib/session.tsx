"use client";

/**
 * Client session — "who's signed in" — backed by the FastAPI JWT auth
 * endpoints (POST /auth/login, POST /auth/register). Mirrors the shape of the
 * ChumBucket example's lib/session.tsx, minus the wallet/money concerns:
 *
 *   login(email, pw)          -> POST /auth/login, store {token, email}
 *   register(name, email, pw) -> POST /auth/register, then login()
 *   signOut()                 -> clear the stored session
 *
 * The session persists to localStorage so a refresh keeps you signed in. The
 * API has no /me endpoint yet, so the display identity (email / full name) is
 * whatever was captured at sign-in time.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest, SESSION_KEY } from "@/lib/api";
import type { TokenResponse, UserRead } from "@/lib/types";

export type Session = {
  status: "guest" | "signed";
  token: string | null;
  email: string;
  fullName: string;
};

const GUEST: Session = { status: "guest", token: null, email: "", fullName: "" };

type Ctx = {
  session: Session;
  ready: boolean; // hydrated from localStorage — safe to make routing decisions
  busy: boolean; // an auth call is in flight
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(GUEST);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Hydrate once on mount; localStorage isn't available during SSR.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Session>;
        if (stored.token) {
          setSession({
            status: "signed",
            token: stored.token,
            email: stored.email ?? "",
            fullName: stored.fullName ?? "",
          });
        }
      }
    } catch {
      // corrupt entry — treat as guest
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Session) => {
    setSession(next);
    if (next.status === "signed") {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: next.token, email: next.email, fullName: next.fullName }),
      );
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
        persist({ status: "signed", token: access_token, email, fullName: "" });
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
        persist({ status: "signed", token: access_token, email: user.email, fullName: user.full_name });
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

export function useSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
