import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AuthShell } from "./Login";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft || {};
  const [email, setEmail] = useState(location.state?.email || draft.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleBack() {
    navigate("/register", {
      state: {
        editMode: true,
        draft: {
          ...draft,
          email: email || draft.email,
        },
      },
    });
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.verifyOtp({ email, otp });
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    try {
      const data = await api.resendOtp({
        email,
        delivery_method: draft.delivery_method || "email",
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell
      title="Check your code"
      lede="Enter the 6-digit code we sent so we know it’s really you."
      onBack={handleBack}
      backLabel="Back to edit details"
      foot={
        <p className="auth-foot">
          Ready to sign in? <Link to="/login">Go to login</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleVerify}>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="otp">One-time code</label>
          <input
            id="otp"
            required
            maxLength={6}
            inputMode="numeric"
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>
        <button className="btn" disabled={loading}>
          {loading ? "Verifying…" : "Verify account"}
        </button>
        <button type="button" className="btn secondary" onClick={handleResend}>
          Resend code
        </button>
      </form>
    </AuthShell>
  );
}
