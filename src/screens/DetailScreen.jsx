import { useState, useEffect, useRef } from "react";
import {
  deleteItem,
  claimItem,
  unclaimItem,
  subscribeToComments,
  addComment,
  deleteComment,
} from "../services/dbService";
import { deleteItemImage } from "../services/storageService";
import { MetaRow } from "../components/SharedComponents";
import Avatar from "../components/Avatar";
import { styles } from "../components/styles";

const daysUntil = (ts) => {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return Math.ceil((date - new Date()) / 86400000);
};
const expiryColor = (days) => {
  if (days === null) return null;
  if (days <= 3)  return "#ff3b30";
  if (days <= 14) return "#ff9500";
  return null;
};

export default function DetailScreen({ item, location, currentUser, usersMap, onBack, onEdit }) {
  const [confirming,   setConfirming]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [comments,     setComments]     = useState([]);
  const [commentText,  setCommentText]  = useState("");
  const [sendingComment, setSending]    = useState(false);
  const commentEndRef = useRef(null);

  const days          = daysUntil(item.expiryDate);
  const color         = expiryColor(days);
  const addedByName   = usersMap?.[item.addedBy]?.displayName || "Someone";
  const addedByUser   = usersMap?.[item.addedBy];
  const claimedByName = usersMap?.[item.claimedBy]?.displayName;
  const isMineClaim   = item.claimedBy === currentUser?.uid;
  const addedDate     = item.addedAt?.toDate ? item.addedAt.toDate() : new Date(item.addedAt);
  const expiryDate    = item.expiryDate?.toDate
    ? item.expiryDate.toDate()
    : item.expiryDate ? new Date(item.expiryDate) : null;

  // Live comments subscription
  useEffect(() => {
    const unsub = subscribeToComments(item.id, setComments);
    return unsub;
  }, [item.id]);

  // Scroll to bottom when comments load
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (item.imageUrl) await deleteItemImage(item.imageUrl);
      await deleteItem(item.id);
      onBack();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setLoading(true);
    try { await claimItem(item.id, currentUser.uid); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUnclaim = async () => {
    setLoading(true);
    try { await unclaimItem(item.id); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment(item.id, currentUser.uid, commentText.trim());
      setCommentText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try { await deleteComment(item.id, commentId); }
    catch (e) { console.error(e); }
  };

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ ...styles.backBtn, color: "#007aff" }} onClick={onEdit}>Edit</button>
          <button style={{ ...styles.backBtn, color: "#ff3b30" }} onClick={() => setConfirming(true)} disabled={loading}>Delete</button>
        </div>
      </div>

      {/* Image */}
      <div style={styles.detailImg}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={styles.imgPlaceholder}><span style={{ fontSize: 48 }}>📦</span></div>}
      </div>

      <div style={styles.detailBody}>
        {/* Title + expiry badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h2 style={styles.detailName}>{item.name}</h2>
          {color && (
            <span style={{ ...styles.expiryBadge, background: color }}>
              {days <= 0 ? "Expired" : `${days}d left`}
            </span>
          )}
        </div>

        {item.description && <p style={styles.detailDesc}>{item.description}</p>}

        {/* Meta */}
        <div style={styles.detailMeta}>
          <MetaRow icon="📍" label={location?.name || "Unknown location"} />
          {item.category && <MetaRow icon="🏷️" label={item.category} />}
          {item.quantity  && <MetaRow icon="📊" label={item.quantity} />}
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
            {addedByUser
              ? <Avatar user={addedByUser} size={20} />
              : <span style={{ fontSize: 16 }}>👤</span>}
            <span style={{ fontSize: 14, color: "#ccc" }}>Added by {addedByName}</span>
          </div>
          <MetaRow icon="📅" label={`Added ${addedDate.toLocaleDateString()}`} />
          {expiryDate && <MetaRow icon="⏰" label={`Expires ${expiryDate.toLocaleDateString()}`} />}
        </div>

        {/* Claim */}
        {item.claimedBy ? (
          <div style={styles.claimedBanner}>
            <span>{isMineClaim ? "You claimed this" : `Claimed by ${claimedByName || "someone"}`}</span>
            {isMineClaim && (
              <button style={styles.unclaimBtn} onClick={handleUnclaim} disabled={loading}>Unclaim</button>
            )}
          </div>
        ) : (
          <button style={styles.claimBtn} onClick={handleClaim} disabled={loading}>
            {loading ? "..." : "Claim this 🙋"}
          </button>
        )}

        {/* ── Comments ─────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Discussion {comments.length > 0 && `· ${comments.length}`}
          </div>

          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>No comments yet. Be the first.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {comments.map((c) => {
              const author    = usersMap?.[c.uid];
              const isMe      = c.uid === currentUser.uid;
              const timestamp = c.createdAt?.toDate ? c.createdAt.toDate() : new Date();
              return (
                <div key={c.id} style={commentStyle(isMe)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <Avatar user={author} size={22} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>
                      {author?.displayName || "Someone"}
                    </span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>
                      {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && (
                      <button
                        style={{ background: "none", border: "none", color: "#ff3b30", fontSize: 11, cursor: "pointer", padding: 0 }}
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "#e0e0e0", margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                </div>
              );
            })}
            <div ref={commentEndRef} />
          </div>

          {/* Comment input */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Avatar user={usersMap?.[currentUser.uid] || currentUser} size={28} />
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                style={{
                  ...styles.input,
                  resize:    "none",
                  minHeight: 42,
                  maxHeight: 120,
                  padding:   "10px 44px 10px 12px",
                  lineHeight: 1.4,
                }}
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                rows={1}
              />
              <button
                onClick={handleSendComment}
                disabled={sendingComment || !commentText.trim()}
                style={{
                  position:   "absolute",
                  right:      8,
                  bottom:     8,
                  background: commentText.trim() ? "#007aff" : "#2a2a2a",
                  border:     "none",
                  borderRadius: 8,
                  color:      "#fff",
                  fontSize:   16,
                  width:      28,
                  height:     28,
                  cursor:     commentText.trim() ? "pointer" : "default",
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirming && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>Delete "{item.name}"?</h3>
            <p style={{ margin: "0 0 16px", color: "#888", fontSize: 14 }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.btnSecondary} onClick={() => setConfirming(false)}>Cancel</button>
              <button style={styles.btnDanger} onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const commentStyle = (isMe) => ({
  background:   isMe ? "#0d1f3c" : "#1a1a1a",
  borderRadius: 10,
  padding:      "10px 12px",
  border:       `1px solid ${isMe ? "#1a3a6a" : "#2a2a2a"}`,
});
