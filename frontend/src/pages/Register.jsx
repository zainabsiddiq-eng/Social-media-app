import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AuthShell } from "./Login";

const COUNTRY_CODES = [
  { code: "+92", label: "Pakistan (+92)", flag: "🇵🇰" },
  { code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { code: "+966", label: "Saudi Arabia (+966)", flag: "🇸🇦" },
  { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
  { code: "+1", label: "USA / Canada (+1)", flag: "🇺🇸" },
  { code: "+880", label: "Bangladesh (+880)", flag: "🇧🇩" },
];

function splitPhone(phone = "") {
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.code.length - a.code.length
  );
  for (const item of sorted) {
    if (phone.startsWith(item.code)) {
      return {
        countryCode: item.code,
        phoneLocal: phone.slice(item.code.length),
      };
    }
  }
  return { countryCode: "+92", phoneLocal: phone.replace(/^\+/, "") };
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = Boolean(location.state?.editMode);
  const draft = location.state?.draft || {};

  const initialPhone = splitPhone(draft.phone || "");

  const [form, setForm] = useState({
    name: draft.name || "",
    email: draft.email || "",
    countryCode: draft.countryCode || initialPhone.countryCode,
    phoneLocal: draft.phoneLocal || initialPhone.phoneLocal,
    password: "",
    delivery_method: draft.delivery_method || "email",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhoneLocal(value) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    update("phoneLocal", digits.slice(0, 12));
  }

  function buildDraft(phone) {
    return {
      name: form.name,
      email: form.email,
      phone,
      countryCode: form.countryCode,
      phoneLocal: form.phoneLocal,
      delivery_method: form.delivery_method,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.phoneLocal.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }

    const phone = `${form.countryCode}${form.phoneLocal}`;
    if (phone.length > 20) {
      setError("Phone number is too long.");
      return;
    }

    if (!editMode && !form.password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      if (editMode) {
        const payload = {
          email: form.email,
          name: form.name,
          phone,
          delivery_method: form.delivery_method,
        };
        if (form.password) payload.password = form.password;

        const data = await api.editUser(payload);
        setMessage(data.message || "Details updated.");
        navigate("/verify-otp", {
          state: { email: form.email, draft: buildDraft(phone) },
        });
      } else {
        await api.register({
          name: form.name,
          email: form.email,
          phone,
          password: form.password,
          delivery_method: form.delivery_method,
        });
        navigate("/verify-otp", {
          state: { email: form.email, draft: buildDraft(phone) },
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={editMode ? "Edit details" : "Join Kith"}
      lede={
        editMode
          ? "Update your details, then we’ll continue with verification."
          : "Create your place in the circle. We’ll send a short code to verify you."
      }
      foot={
        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            readOnly={editMode}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {editMode && (
            <small className="field-hint">
              Email can’t be changed here — it identifies your account.
            </small>
          )}
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <div className="phone-row">
            <select
              id="countryCode"
              aria-label="Country code"
              className="phone-code"
              value={form.countryCode}
              onChange={(e) => update("countryCode", e.target.value)}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              required
              placeholder="3001234567"
              value={form.phoneLocal}
              onChange={(e) => handlePhoneLocal(e.target.value)}
            />
          </div>
          <small className="field-hint">
            Saves as {form.countryCode}
            {form.phoneLocal || "…"}
          </small>
        </div>
        <div className="field">
          <label htmlFor="password">
            Password{editMode ? " (optional)" : ""}
          </label>
          <input
            id="password"
            type="password"
            required={!editMode}
            placeholder={editMode ? "Leave blank to keep current password" : ""}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="delivery_method">Send code via</label>
          <select
            id="delivery_method"
            value={form.delivery_method}
            onChange={(e) => update("delivery_method", e.target.value)}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <button className="btn" disabled={loading}>
          {loading
            ? editMode
              ? "Saving…"
              : "Creating…"
            : editMode
              ? "Save & continue"
              : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
