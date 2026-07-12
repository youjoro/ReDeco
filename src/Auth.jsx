import { useState } from "react";
import { signIn, signUp } from "./supabase";

export default function Auth({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (tab === "signup" && password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        await signIn(email, password);
        onAuth();
      } else {
        await signUp(email, password);
        setSuccess("Account created! Check your email to confirm, then log in.");
        setTab("login");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    // Page
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fdf6f0 0%, #f5e6d8 50%, #ede0d4 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px",
    },
    // Card
    card: {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
      borderRadius: "24px",
      padding: "40px 36px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 8px 40px rgba(139,90,60,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid rgba(210,180,160,0.3)",
    },
    // Logo area
    logo: {
      textAlign: "center",
      marginBottom: "28px",
    },
    logoIcon: {
      fontSize: "48px",
      marginBottom: "10px",
      display: "block",
    },
    logoTitle: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#5c3d2e",
      margin: "0 0 4px",
      letterSpacing: "-0.3px",
    },
    logoSub: {
      fontSize: "13px",
      color: "#a07850",
      margin: 0,
    },
    // Tabs
    tabWrap: {
      display: "flex",
      background: "#f5ede6",
      borderRadius: "12px",
      padding: "4px",
      marginBottom: "24px",
      gap: "4px",
    },
    tab: (active) => ({
      flex: 1,
      padding: "8px 0",
      borderRadius: "9px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      background: active ? "white" : "transparent",
      color: active ? "#5c3d2e" : "#a07850",
      boxShadow: active ? "0 1px 6px rgba(139,90,60,0.15)" : "none",
      transition: "all 0.18s",
    }),
    // Fields
    fieldWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginBottom: "16px",
    },
    label: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#7a5540",
      marginBottom: "4px",
      display: "block",
      letterSpacing: "0.3px",
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: "10px",
      border: "1.5px solid #e8d5c4",
      fontSize: "14px",
      outline: "none",
      background: "#fdf8f5",
      color: "#3d2b1f",
      boxSizing: "border-box",
      transition: "border 0.15s",
    },
    // Alerts
    error: {
      padding: "11px 14px",
      borderRadius: "10px",
      background: "#fff5f5",
      border: "1px solid #fac8c8",
      color: "#c0392b",
      fontSize: "13px",
      marginBottom: "14px",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
    },
    success: {
      padding: "11px 14px",
      borderRadius: "10px",
      background: "#f0faf4",
      border: "1px solid #b2dfcc",
      color: "#1e6e45",
      fontSize: "13px",
      marginBottom: "14px",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
    },
    // Button
    btn: (disabled) => ({
      width: "100%",
      padding: "12px 0",
      background: disabled
        ? "#c9a98a"
        : "linear-gradient(135deg, #c47a45 0%, #a05a2c 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: "700",
      fontSize: "14px",
      letterSpacing: "0.2px",
      boxShadow: disabled ? "none" : "0 4px 14px rgba(160,90,44,0.35)",
      transition: "all 0.18s",
    }),
    // Divider
    divider: {
      textAlign: "center",
      fontSize: "12px",
      color: "#b09080",
      margin: "18px 0 0",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoIcon}>🛋️</span>
          <p style={s.logoTitle}>Room Planner</p>
          <p style={s.logoSub}>
            {tab === "login" ? "Welcome back — sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        {/* Tabs */}
        <div style={s.tabWrap}>
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              style={s.tab(tab === t)}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={s.fieldWrap}>
          <div>
            <label style={s.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={s.input}
              onFocus={(e) => e.target.style.border = "1.5px solid #c47a45"}
              onBlur={(e) => e.target.style.border = "1.5px solid #e8d5c4"}
            />
          </div>
          <div>
            <label style={s.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={s.input}
              onFocus={(e) => e.target.style.border = "1.5px solid #c47a45"}
              onBlur={(e) => e.target.style.border = "1.5px solid #e8d5c4"}
            />
          </div>
          {tab === "signup" && (
            <div>
              <label style={s.label}>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={s.input}
                onFocus={(e) => e.target.style.border = "1.5px solid #c47a45"}
                onBlur={(e) => e.target.style.border = "1.5px solid #e8d5c4"}
              />
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div style={s.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={s.success}>
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={s.btn(loading)}
          onMouseEnter={(e) => !loading && (e.target.style.opacity = "0.9")}
          onMouseLeave={(e) => !loading && (e.target.style.opacity = "1")}
        >
          {loading
            ? "Please wait..."
            : tab === "login" ? "Log In →" : "Create Account →"}
        </button>

        <p style={s.divider}>
          {tab === "login"
            ? "Don't have an account? Click Sign Up above"
            : "Already have an account? Click Log In above"}
        </p>
      </div>
    </div>
  );
}
