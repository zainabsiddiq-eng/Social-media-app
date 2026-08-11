import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function AuthShell({
  title,
  lede,
  children,
  foot,
  backTo,
  onBack,
  backLabel = "Back",
}) {
  return (
    <div className="auth-layout">
      <aside className="auth-visual">
        <h2 className="brand-huge">Kith</h2>
        <p>A quieter place for the people who matter — share notes, stay close.</p>
      </aside>
      <div className="auth-side">
        <div className="auth-card">
          {onBack ? (
            <button type="button" className="auth-back" onClick={onBack}>
              ← {backLabel}
            </button>
          ) : (
            backTo && (
              <Link to={backTo} className="auth-back">
                ← {backLabel}
              </Link>
            )
          )}
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
          {children}
          {foot}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      lede="Sign in to rejoin your circle."
      foot={
        <p className="auth-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export { AuthShell };
