import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin2@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lampOn, setLampOn] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/dashboard" : "/pos");
    } catch (err) {
      setError(err.message || "Login fail ho gaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, background: lampOn ? "#1a1410" : "#0a0a0a" }}>
      {/* Ambient glow when lamp is on */}
      {lampOn && <div style={styles.ambientGlow} />}

      <div style={styles.container}>
        {/* Left — Lamp */}
        <div style={styles.lampSide}>
          <h1 style={{ ...styles.brand, color: lampOn ? "#f5c842" : "#444" }}>
            Tech POS
          </h1>

          {/* Lamp */}
          <div style={styles.lampWrapper} onClick={() => setLampOn(!lampOn)}>
            {/* Light beam */}
            {lampOn && <div style={styles.lightBeam} />}

            {/* Lamp shade */}
            <div style={{
              ...styles.lampShade,
              background: lampOn
                ? "radial-gradient(ellipse at 50% 30%, #fff9e6, #f5c842 60%, #c8860a)"
                : "radial-gradient(ellipse at 50% 30%, #3a3a3a, #222)",
              boxShadow: lampOn ? "0 0 40px 10px rgba(245,200,66,0.4)" : "none",
            }} />

            {/* Lamp stem */}
            <div style={styles.lampStem} />

            {/* Lamp base */}
            <div style={{
              ...styles.lampBase,
              background: lampOn ? "linear-gradient(#c8860a, #8b5e0a)" : "linear-gradient(#333, #111)",
            }} />

            {/* Toggle button on stem */}
            <div style={{
              ...styles.toggleDot,
              backgroundColor: lampOn ? "#f5c842" : "#555",
              boxShadow: lampOn ? "0 0 8px #f5c842" : "none",
            }} />
          </div>

          <p style={{ ...styles.lampHint, color: lampOn ? "rgba(245,200,66,0.6)" : "#333" }}>
            {lampOn ? "Click lamp to turn off" : "Click lamp to turn on"}
          </p>
        </div>

        {/* Right — Login Form */}
        <div style={{
          ...styles.formCard,
          background: lampOn
            ? "rgba(255,248,220,0.08)"
            : "rgba(255,255,255,0.03)",
          borderColor: lampOn ? "rgba(245,200,66,0.2)" : "rgba(255,255,255,0.05)",
          boxShadow: lampOn
            ? "0 8px 40px rgba(245,200,66,0.15)"
            : "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ ...styles.welcome, color: lampOn ? "#f5c842" : "#555" }}>
            Welcome Back
          </h2>
          <p style={{ ...styles.subtitle, color: lampOn ? "rgba(255,248,220,0.5)" : "#333" }}>
            Sign in to your account
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={{ ...styles.label, color: lampOn ? "rgba(255,248,220,0.7)" : "#444" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  ...styles.input,
                  background: lampOn ? "rgba(255,248,220,0.07)" : "rgba(255,255,255,0.03)",
                  borderColor: lampOn ? "rgba(245,200,66,0.3)" : "rgba(255,255,255,0.08)",
                  color: lampOn ? "#fff9e6" : "#555",
                }}
              />
            </div>

            <div style={styles.field}>
              <label style={{ ...styles.label, color: lampOn ? "rgba(255,248,220,0.7)" : "#444" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  ...styles.input,
                  background: lampOn ? "rgba(255,248,220,0.07)" : "rgba(255,255,255,0.03)",
                  borderColor: lampOn ? "rgba(245,200,66,0.3)" : "rgba(255,255,255,0.08)",
                  color: lampOn ? "#fff9e6" : "#555",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                background: lampOn
                  ? "linear-gradient(135deg, #f5c842, #c8860a)"
                  : "#222",
                color: lampOn ? "#1a1410" : "#444",
                boxShadow: lampOn ? "0 4px 20px rgba(245,200,66,0.4)" : "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 0.95; }
          94% { opacity: 0.85; }
          96% { opacity: 0.95; }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.22; }
        }
        input::placeholder { color: rgba(200,180,100,0.3); }
        input:focus { outline: none; border-color: rgba(245,200,66,0.6) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.8s ease",
    position: "relative", overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: "20%", left: "30%",
    width: 400, height: 400,
    background: "radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    animation: "beamPulse 3s ease-in-out infinite",
  },
  container: {
    display: "flex", alignItems: "center",
    gap: 60, zIndex: 1,
    padding: "0 20px",
  },
  lampSide: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8,
  },
  brand: {
    fontSize: 28, fontWeight: "800",
    letterSpacing: 2, transition: "color 0.8s",
    fontFamily: "Georgia, serif",
    marginBottom: 20,
  },
  lampWrapper: {
    position: "relative", cursor: "pointer",
    display: "flex", flexDirection: "column",
    alignItems: "center", width: 120,
    userSelect: "none",
  },
  lightBeam: {
    position: "absolute", top: 30,
    left: "50%", transform: "translateX(-50%)",
    width: 0, height: 0,
    borderLeft: "80px solid transparent",
    borderRight: "80px solid transparent",
    borderTop: "200px solid rgba(245,200,66,0.08)",
    animation: "beamPulse 3s ease-in-out infinite",
    pointerEvents: "none",
  },
  lampShade: {
    width: 100, height: 60,
    borderRadius: "50% 50% 10% 10%",
    transition: "all 0.8s ease",
    animation: "flicker 8s ease-in-out infinite",
    zIndex: 2,
  },
  lampStem: {
    width: 8, height: 120,
    background: "linear-gradient(#888, #555)",
    borderRadius: 4, zIndex: 2,
  },
  lampBase: {
    width: 80, height: 16,
    borderRadius: 8,
    transition: "background 0.8s",
    zIndex: 2,
  },
  toggleDot: {
    position: "absolute",
    top: 108, left: "50%",
    transform: "translateX(-50%)",
    width: 12, height: 12,
    borderRadius: "50%",
    transition: "all 0.4s",
    zIndex: 3,
  },
  lampHint: {
    fontSize: 11, marginTop: 8,
    transition: "color 0.8s",
    letterSpacing: 0.5,
  },
  formCard: {
    width: 360, padding: "40px 36px",
    borderRadius: 20,
    border: "1px solid",
    backdropFilter: "blur(20px)",
    transition: "all 0.8s ease",
  },
  welcome: {
    fontSize: 24, fontWeight: "bold",
    margin: "0 0 6px", transition: "color 0.8s",
  },
  subtitle: {
    fontSize: 13, margin: "0 0 28px",
    transition: "color 0.8s",
  },
  error: {
    backgroundColor: "rgba(220,38,38,0.15)",
    color: "#f87171", padding: "10px 14px",
    borderRadius: 8, marginBottom: 16, fontSize: 13,
    border: "1px solid rgba(220,38,38,0.3)",
  },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 12, fontWeight: "600", marginBottom: 6, transition: "color 0.8s" },
  input: {
    width: "100%", padding: "11px 14px",
    borderRadius: 10, border: "1px solid",
    fontSize: 14, transition: "all 0.4s",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%", padding: "13px",
    border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: "700",
    marginTop: 8, transition: "all 0.4s",
    letterSpacing: 0.5,
  },
};