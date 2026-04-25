import { styles } from "./styles";
import Avatar from "./Avatar";

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

export default function ItemCard({ item, location, currentUser, usersMap, onClick }) {
  const days          = daysUntil(item.expiryDate);
  const color         = expiryColor(days);
  const claimedByName = usersMap?.[item.claimedBy]?.displayName;
  const isMineClaim   = item.claimedBy === currentUser?.uid;
  const addedByUser   = usersMap?.[item.addedBy];

  return (
    <div
      style={{ ...styles.card, border: color ? `2px solid ${color}` : "2px solid transparent" }}
      onClick={onClick}
    >
      <div style={styles.cardImg}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px 10px 0 0" }} />
          : <div style={{ ...styles.imgPlaceholder, borderRadius: "10px 10px 0 0" }}><span style={{ fontSize: 32 }}>📦</span></div>}

        {/* Pin indicator */}
        {item.pinned && (
          <div style={{
            position:   "absolute",
            top:        6,
            left:       6,
            fontSize:   14,
            lineHeight: 1,
            filter:     "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
          }}>
            📌
          </div>
        )}

        {color && (
          <div style={{ ...styles.expiryBadge, position: "absolute", top: 6, right: 6, background: color }}>
            {days <= 0 ? "Expired" : `${days}d`}
          </div>
        )}

        {/* Avatar — bottom left of image */}
        {addedByUser && (
          <div style={{ position: "absolute", bottom: 6, left: 6 }}>
            <Avatar user={addedByUser} size={22} />
          </div>
        )}

        {item.claimedBy && (
          <div style={styles.claimedOverlay}>
            {isMineClaim ? "You" : (claimedByName || "Claimed")}
          </div>
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardName}>{item.name}</div>
        {item.quantity && <div style={styles.cardMeta}>{item.quantity}</div>}
        {location && <div style={styles.cardLoc}>📍 {location.name}</div>}
      </div>
    </div>
  );
}
