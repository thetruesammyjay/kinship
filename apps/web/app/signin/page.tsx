"use client";

import { GitBranch, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import { useSession } from "@/lib/session";

export default function SignInPage() {
  const { session, ready, busy, login, register } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Signed in → straight to the dashboard.
  useEffect(() => {
    if (!ready || session.status !== "signed") return;
    router.replace("/dashboard");
  }, [ready, session.status, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (mode === "register") {
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Could not reach the API. Is the backend running?");
    }
  }

  return (
    <div className="signin">
      <form className="signin-card" onSubmit={onSubmit}>
        <span className="brand-icon" style={{ width: 34, height: 34 }}>
          <GitBranch size={19} />
        </span>
        <div>
          <span className="eyebrow">registrar access</span>
          <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
        </div>

        {mode === "register" && (
          <label className="field">
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Adaeze Worlu"
              required
              minLength={1}
            />
          </label>
        )}
        <label className="field">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="registrar@example.com"
            type="email"
            required
          />
        </label>
        <label className="field">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
            required
            minLength={8}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btnp full" type="submit" disabled={busy}>
          {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
          {busy ? "Working…" : mode === "login" ? "Continue" : "Register"}
        </button>

        <button
          className="signin-toggle"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "New registrar? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
