export function FilterChip({ label, active, onClick, alert, dashed }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink:   0,
        padding:      "6px 14px",
        borderRadius: 20,
        border:       dashed ? "1.5px dashed #555" : "none",
        background:   active ? "#fff" : "transparent",
        color:        active ? "#000" : alert ? "#ff9500" : "#888",
        fontSize:     13,
        fontWeight:   active ? 700 : 500,
        cursor:       "pointer",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function MetaRow({ icon, label }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 14, color: "#ccc" }}>{label}</span>
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 4, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

export function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 28 }}>⏳</div>;
}
