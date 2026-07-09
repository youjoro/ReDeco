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
      setError(err.message + " | " + JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#1a1a2e",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: 14, padding: 32,
        width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛋️</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#1a1a2e" }}>Room Planner</div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            {tab === "login" ? "Sign in to your account" : "Create a new account"}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f0f0f0", borderRadius: 8, padding: 4 }}>
          {["login", "signup"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }} style={{
              flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
              cursor: "pointer", fontWeight: 500, fontSize: 13,
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#1a1a2e" : "#888",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              padding: "10px 12px", borderRadius: 7,
              border: "1.5px solid #e0e0e0", fontSize: 13, outline: "none",
              transition: "border 0.15s",
            }}
          />
          <input
            type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              padding: "10px 12px", borderRadius: 7,
              border: "1.5px solid #e0e0e0", fontSize: 13, outline: "none",
            }}
          />
          {tab === "signup" && (
            <input
              type="password" placeholder="Confirm password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                padding: "10px 12px", borderRadius: 7,
                border: "1.5px solid #e0e0e0", fontSize: 13, outline: "none",
              }}
            />
          )}
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            marginTop: 12, padding: "9px 12px", borderRadius: 7,
            background: "#fff0f0", border: "1px solid #ffc0c0",
            color: "#cc3333", fontSize: 13,
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            marginTop: 12, padding: "9px 12px", borderRadius: 7,
            background: "#f0fff4", border: "1px solid #b0e0c0",
            color: "#227744", fontSize: 13,
          }}>{success}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: 16,
            padding: "11px 0", background: loading ? "#90b8f8" : "#4f8ef7",
            color: "white", border: "none", borderRadius: 7,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: 14, transition: "background 0.15s",
          }}
        >
          {loading ? "Please wait..." : tab === "login" ? "Log In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}
