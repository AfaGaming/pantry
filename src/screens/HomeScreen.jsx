import { useState } from "react";
import { addLocation } from "../services/dbService";
import { logOut } from "../services/authService";
import { FilterChip } from "../components/SharedComponents";
import ItemCard from "../components/ItemCard";
import { styles } from "../components/styles";

const daysUntil = (ts) => {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return Math.ceil((date - new Date()) / 86400000);
};

export default function HomeScreen({ currentUser, items, locations, categories, usersMap, onSelectItem, onAddItem }) {
  const [filter,          setFilter]          = useState("all");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName,      setNewLocName]      = useState("");
  const [locError,        setLocError]        = useState("");

  const expiringSoonCount = items.filter((i) => {
    const d = daysUntil(i.expiryDate);
    return d !== null && d <= 14;
  }).length;

  const filteredItems = items
    .filter((i) => {
      if (filter === "expiring") { const d = daysUntil(i.expiryDate); return d !== null && d <= 14; }
      if (filter === "all") return true;
      return i.locationId === filter;
    })
    .sort((a, b) => {
      if (filter === "expiring") {
        return (daysUntil(a.expiryDate) ?? 9999) - (daysUntil(b.expiryDate) ?? 9999);
      }
      // Sort by addedAt descending
      const aTime = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt || 0);
      const bTime = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(b.addedAt || 0);
      return bTime - aTime;
    });

  const handleAddLocation = async () => {
    if (!newLocName.trim()) { setLocError("Please enter a name."); return; }
    try {
      await addLocation(newLocName.trim(), currentUser.uid);
      setNewLocName("");
      setShowAddLocation(false);
      setLocError("");
    } catch (e) {
      setLocError("Failed to add location.");
    }
  };

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>🏠 Pantry</div>
          <div style={styles.headerSub}>Hey, {currentUser.displayName}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.iconBtn} onClick={onAddItem}>＋</button>
          <button style={{ ...styles.iconBtn, fontSize: 15 }} onClick={logOut} title="Sign out">⎋</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip
          label={`⚠️ Expiring${expiringSoonCount > 0 ? ` (${expiringSoonCount})` : ""}`}
          active={filter === "expiring"}
          onClick={() => setFilter("expiring")}
          alert={expiringSoonCount > 0}
        />
        {locations.map((loc) => (
          <FilterChip key={loc.id} label={loc.name} active={filter === loc.id} onClick={() => setFilter(loc.id)} />
        ))}
        <FilterChip label="＋ Location" active={false} onClick={() => setShowAddLocation(true)} dashed />
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {filteredItems.length === 0 && (
          <div style={styles.empty}>
            {filter === "expiring" ? "Nothing expiring soon. 🎉" : "Nothing here yet.\nTap ＋ to add something."}
          </div>
        )}
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            location={locations.find((l) => l.id === item.locationId)}
            currentUser={currentUser}
            usersMap={usersMap}
            onClick={() => onSelectItem(item)}
          />
        ))}
      </div>

      {/* Add Location Modal */}
      {showAddLocation && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowAddLocation(false)}>
          <div style={styles.modalBox}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>New Location</h3>
            <input
              style={styles.input}
              placeholder="e.g. Bedroom Drawer"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
              autoFocus
            />
            {locError && <p style={{ color: "#ff3b30", fontSize: 13, marginTop: 6 }}>{locError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={styles.btnSecondary} onClick={() => setShowAddLocation(false)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleAddLocation}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
