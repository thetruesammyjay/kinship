import { LogIn } from "lucide-react";

export function Login() {
  return (
    <section className="login-screen">
      <div className="login-card">
        <span className="eyebrow">registrar access</span>
        <h1>Sign in</h1>
        <label>
          Email
          <input placeholder="registrar@example.com" type="email" />
        </label>
        <label>
          Password
          <input placeholder="••••••••" type="password" />
        </label>
        <button className="primary-button full" type="button">
          <LogIn size={18} />
          Continue
        </button>
      </div>
    </section>
  );
}
