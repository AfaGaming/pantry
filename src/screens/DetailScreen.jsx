import { useState } from "react";
import { deleteItem, claimItem, unclaimItem } from "../services/dbService";
import { deleteItemImage } from "../services/storageService";
import { MetaRow } from "../components/SharedComponents";
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

export default function DetailScreen({ item, location, currentUser, usersMap, onBack }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const days           = daysUntil(item.expiryDate);
  const color          = expiryColor(days);
  const addedByName    = usersMap?.[item.addedBy]?.displayName || "Someone";
  const claimedByName  = usersMap?.[item.claimedBy]?.displayName;
  const isMineClaim    = item.claimedBy === currentUser?.uid;
  const addedDate      = item.addedAt?.toDate ? item.addedAt.toDate() : new Date(item.addedAt);
  const expiryDate     = item.expiryDate?.toDate ? item.expiryDate.toDate() : item.expiryDate ? new Date(item.expiryDate) : null;

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

  return (
    <div style={styles.screen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <button
          style={{ ...styles.backBtn, color: "#ff3b30" }}
          onClick={() => setConfirming(true)}
          disabled={loading}
        >
          Delete
        </button>
      </div>

      <div style={styles.detailImg}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={styles.imgPlaceholder}><span style={{ fontSize: 48 }}>📦</span></div>}
      </div>

      <div style={styles.detailBody}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={styles.detailName}>{item.name}</h2>
          {color && (
            <span style={{ ...styles.expiryBadge, background: color }}>
              {days <= 0 ? "Expired" : `${days}d left`}
            </span>
          )}
        </div>
        {item.description && <p style={styles.detailDesc}>{item.description}</p>}

        <div style={styles.detailMeta}>
          <MetaRow icon="📍" label={location?.name || "Unknown location"} />
          {item.category  && <MetaRow icon="🏷️" label={item.category} />}
          {item.quantity  && <MetaRow icon="📊" label={item.quantity} />}
          <MetaRow icon="👤" label={`Added by ${addedByName}`} />
          <MetaRow icon="📅" label={`Added ${addedDate.toLocaleDateString()}`} />
          {expiryDate && <MetaRow icon="⏰" label={`Expires ${expiryDate.toLocaleDateString()}`} />}
        </div>

        {item.claimedBy ? (
          <div style={styles.claimedBanner}>
            <span>{isMineClaim ? "You claimed this" : `Claimed by ${claimedByName || "someone"}`}</span>
            {isMineClaim && (
              <button style={styles.unclaimBtn} onClick={handleUnclaim} disabled={loading}>
                Unclaim
              </button>
            )}
          </div>
        ) : (
          <button style={styles.claimBtn} onClick={handleClaim} disabled={loading}>
            {loading ? "..." : "Claim this 🙋"}
          </button>
        )}
      </div>

      {/* Delete confirmation modal */}
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
