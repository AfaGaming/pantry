import { useState } from "react";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from "../services/authService";
import { styles } from "../components/styles";

export default function LoginScreen() {
  const [mode,        setMode]     = useState("login"); // login | register
  const [email,       setEmail]    = useState("");
  const [password,    setPassword] = useState("");
  const [displayName, setName]     = useState("");
  const [error,       setError]    = useState("");
  const [loading,     setLoading]  = useState(false);

  const handle = async (fn) => {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = () => {
    if (mode === "login") {
      handle(() => signInWithEmail(email, password));
    } else {
      if (!displayName.trim()) { setError("Please enter your name."); return; }
      handle(() => registerWithEmail(email, password, displayName.trim()));
    }
  };

  return (
    <div style={styles.screen}>
      <div style={loginStyles.container}>
        <div style={loginStyles.logo}>🏠</div>
        <h1 style={loginStyles.title}>Pantry</h1>
        <p style={loginStyles.sub}>Your household inventory</p>

        {/* Google */}
        <button
          style={loginStyles.googleBtn}
          onClick={() => handle(signInWithGoogle)}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={loginStyles.divider}><span>or</span></div>

        {/* Email form */}
        <div style={loginStyles.form}>
          {mode === "register" && (
            <input
              style={styles.input}
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitEmail()}
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitEmail()}
          />
          {error && <p style={loginStyles.error}>{error}</p>}
          <button
            style={{ ...styles.btnPrimary, width: "100%", padding: "13px 0", fontSize: 15 }}
            onClick={submitEmail}
            disabled={loading}
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <button
          style={loginStyles.switchMode}
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "No account? Register" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

const friendlyError = (code) => {
  const map = {
    "auth/user-not-found":       "No account found with that email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/email-already-in-use": "That email is already registered.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] || "Something went wrong. Please try again.";
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const loginStyles = {
  container: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    padding:        "60px 24px 40px",
    maxWidth:       360,
    margin:         "0 auto",
  },
  logo:  { fontSize: 56, marginBottom: 8 },
  title: { margin: "0 0 4px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 },
  sub:   { margin: "0 0 32px", color: "#666", fontSize: 14 },
  googleBtn: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          "100%",
    padding:        "12px 0",
    background:     "#1a1a1a",
    border:         "1px solid #333",
    borderRadius:   10,
    color:          "#fff",
    fontSize:       15,
    fontWeight:     600,
    cursor:         "pointer",
    marginBottom:   16,
  },
  divider: {
    width:          "100%",
    textAlign:      "center",
    borderBottom:   "1px solid #222",
    lineHeight:     "0.1em",
    margin:         "8px 0 20px",
    "& span": { background: "#0a0a0a", padding: "0 8px", color: "#555", fontSize: 12 },
  },
  form:       { display: "flex", flexDirection: "column", gap: 10, width: "100%" },
  error:      { color: "#ff3b30", fontSize: 13, margin: "0 0 4px" },
  switchMode: {
    background: "none",
    border:     "none",
    color:      "#007aff",
    fontSize:   13,
    cursor:     "pointer",
    marginTop:  16,
  },
};
