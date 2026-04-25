import { useState, useEffect } from "react";
import {
  subscribeToUsers,
  approveUser,
  rejectUser,
  disableUser,
  enableUser,
  setAdminRole,
  resetUserPassword,
} from "../services/adminService";
import { styles } from "../components/styles";

export default function AdminScreen({ currentUser, onBack }) {
  const [users,      setUsers]      = useState([]);
  const [tab,        setTab]        = useState("pending"); // pending | active | disabled
  const [loading,    setLoading]    = useState({});
  const [toast,      setToast]      = useState(null);
  const [resetEmail, setResetEmail] = useState(null); // uid being reset

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return unsub;
  }, []);

  const pending  = users.filter((u) => u.approved === false && !u.disabled && u.uid !== currentUser.uid);
  const active   = users.filter((u) => u.approved === true  && !u.disabled && u.uid !== currentUser.uid);
  const disabled = users.filter((u) => u.disabled === true  && u.uid !== currentUser.uid);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handle = async (uid, fn, successMsg) => {
    setLoading((l) => ({ ...l, [uid]: true }));
    try {
      await fn();
      showToast(successMsg);
    } catch (e) {
      showToast("Something went wrong.");
      console.error(e);
    } finally {
      setLoading((l) => ({ ...l, [uid]: false }));
    }
  };

  const handleReset = async (user) => {
    if (!user.email) { showToast("No email on file for this user."); return; }
    setResetEmail(user.uid);
  };

  const confirmReset = async (user) => {
    setResetEmail(null);
    handle(user.uid, () => resetUserPassword(user.email), `Reset email sent to ${user.email}`);
  };

  const tabs = [
    { key: "pending",  label: "Pending",  count: pending.length },
    { key: "active",   label: "Active",   count: active.length },
    { key: "disabled", label: "Disabled", count: disabled.length },
  ];

  const currentList = tab === "pending" ? pending : tab === "active" ? active : disabled;

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Admin Portal</span>
        <span style={{ width: 60 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex:            1,
              padding:         "12px 0",
              background:      "none",
              border:          "none",
              borderBottom:    tab === t.key ? "2px solid #007aff" : "2px solid transparent",
              color:           tab === t.key ? "#007aff" : "#666",
              fontWeight:      tab === t.key ? 700 : 400,
              fontSize:        13,
              cursor:          "pointer",
              position:        "relative",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft:   5,
                background:   t.key === "pending" ? "#ff3b30" : "#333",
                color:        "#fff",
                borderRadius: 10,
                fontSize:     10,
                fontWeight:   700,
                padding:      "1px 6px",
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User list */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {currentList.length === 0 && (
          <div style={{ textAlign: "center", color: "#444", padding: "48px 0", fontSize: 14 }}>
            {tab === "pending"  && "No pending approvals 🎉"}
            {tab === "active"   && "No active users yet."}
            {tab === "disabled" && "No disabled users."}
          </div>
        )}

        {currentList.map((u) => (
          <div key={u.uid} style={userCardStyle}>
            {/* User info */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{u.displayName || "Unnamed"}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{u.email}</div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                Joined {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "—"}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tab === "pending" && <>
                <ActionBtn
                  label="Approve"
                  color="#34c759"
                  loading={loading[u.uid]}
                  onClick={() => handle(u.uid, () => approveUser(u.uid), `${u.displayName} approved`)}
                />
                <ActionBtn
                  label="Reject"
                  color="#ff3b30"
                  loading={loading[u.uid]}
                  onClick={() => handle(u.uid, () => rejectUser(u.uid), `${u.displayName} rejected`)}
                />
              </>}

              {tab === "active" && <>
                <ActionBtn
                  label="Disable"
                  color="#ff9500"
                  loading={loading[u.uid]}
                  onClick={() => handle(u.uid, () => disableUser(u.uid), `${u.displayName} disabled`)}
                />
                <ActionBtn
                  label={u.role === "admin" ? "Remove Admin" : "Make Admin"}
                  color="#007aff"
                  loading={loading[u.uid]}
                  onClick={() => handle(
                    u.uid,
                    () => setAdminRole(u.uid, u.role !== "admin"),
                    u.role === "admin"
                      ? `${u.displayName} is no longer admin`
                      : `${u.displayName} is now admin`
                  )}
                />
                <ActionBtn
                  label="Reset Password"
                  color="#007aff"
                  loading={loading[u.uid]}
                  onClick={() => handleReset(u)}
                />
              </>}

              {tab === "disabled" && <>
                <ActionBtn
                  label="Re-enable"
                  color="#34c759"
                  loading={loading[u.uid]}
                  onClick={() => handle(u.uid, () => enableUser(u.uid), `${u.displayName} re-enabled`)}
                />
              </>}
            </div>
          </div>
        ))}
      </div>

      {/* Password reset confirmation modal */}
      {resetEmail && (() => {
        const u = users.find((x) => x.uid === resetEmail);
        return (
          <div style={styles.modal} onClick={() => setResetEmail(null)}>
            <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Send Password Reset?</h3>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
                A reset email will be sent to <strong style={{ color: "#fff" }}>{u?.email}</strong>.
                They'll need to check their inbox.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={styles.btnSecondary} onClick={() => setResetEmail(null)}>Cancel</button>
                <button style={styles.btnPrimary}   onClick={() => confirmReset(u)}>Send Email</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{
          position:     "fixed",
          bottom:       32,
          left:         "50%",
          transform:    "translateX(-50%)",
          background:   "#1e1e1e",
          border:       "1px solid #333",
          borderRadius: 12,
          padding:      "10px 20px",
          fontSize:     13,
          color:        "#fff",
          zIndex:       200,
          whiteSpace:   "nowrap",
          boxShadow:    "0 4px 24px rgba(0,0,0,0.4)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, color, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background:   "none",
        border:       `1px solid ${color}`,
        color:        color,
        borderRadius: 8,
        padding:      "6px 14px",
        fontSize:     12,
        fontWeight:   600,
        cursor:       loading ? "not-allowed" : "pointer",
        opacity:      loading ? 0.5 : 1,
      }}
    >
      {loading ? "..." : label}
    </button>
  );
}

const userCardStyle = {
  background:   "#141414",
  borderRadius: 12,
  padding:      "14px",
  border:       "1px solid #1e1e1e",
};
