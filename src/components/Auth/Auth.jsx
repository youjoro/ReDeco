import { useState } from "react";
import { signIn, signUp } from "../../lib/supabase";
import "./Auth.css";

export default function Auth({ onAuth, initialTab = "login", onBack }) {
  const [tab, setTab]         = useState(initialTab);
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError(""); setSuccess("");
    if (!email || !password)                    return setError("Please fill in all fields.");
    if (tab === "signup" && password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)                    return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      if (tab === "login") { await signIn(email, password); onAuth(); }
      else { await signUp(email, password); setSuccess("Account created! Check your email, then log in."); setTab("login"); }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const onKey = (e) => e.key === "Enter" && submit();

  return (
    <div className="auth-page">
      <div className="auth-card">

        {onBack && (
          <button className="auth-back" onClick={onBack}>← Back to home</button>
        )}

        <div className="auth-logo">
          <span className="auth-logo__icon">🪴</span>
          <p className="auth-logo__title">ReDeco</p>
          <p className="auth-logo__sub">
            {tab === "login" ? "Welcome back — sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        <div className="auth-tabs">
          {["login", "signup"].map((t) => (
            <button key={t} className={`auth-tab${tab === t ? " active" : ""}`}
              onClick={() => { setTab(t); setError(""); setSuccess(""); }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="auth-fields">
          <div>
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} />
          </div>
          <div>
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPass(e.target.value)} onKeyDown={onKey} />
          </div>
          {tab === "signup" && (
            <div>
              <label className="auth-label">Confirm Password</label>
              <input className="auth-input" type="password" placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={onKey} />
            </div>
          )}
        </div>

        {error   && <div className="auth-alert error"  ><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="auth-alert success"><span>✅</span><span>{success}</span></div>}

        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : tab === "login" ? "Log In →" : "Create Account →"}
        </button>

        <p className="auth-hint">
          {tab === "login" ? "No account? Click Sign Up above" : "Already have one? Click Log In above"}
        </p>
      </div>
    </div>
  );
}
