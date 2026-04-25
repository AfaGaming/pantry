import { useState, useMemo } from "react";
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

const SORT_OPTIONS = [
  { key: "recent",   label: "Recently Added" },
  { key: "expiring", label: "Expiring Soonest" },
  { key: "name",     label: "Name A→Z" },
  { key: "category", label: "Category" },
];

export default function HomeScreen({
  currentUser, items, locations, categories, usersMap,
  isAdmin, pendingCount, onSelectItem, onAddItem, onAdmin,
}) {
  const [filter,          setFilter]          = useState("all");
  const [sortKey,         setSortKey]         = useState("recent");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [showSearch,      setShowSearch]      = useState(false);
  const [showSortMenu,    setShowSortMenu]    = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName,      setNewLocName]      = useState("");
  const [locError,        setLocError]        = useState("");

  const expiringSoonCount = items.filter((i) => {
    const d = daysUntil(i.expiryDate);
    return d !== null && d <= 14;
  }).length;

  const displayedItems = useMemo(() => {
    let result = [...items];

    // 1. Filter by tab
    if (filter === "expiring") {
      result = result.filter((i) => {
        const d = daysUntil(i.expiryDate);
        return d !== null && d <= 14;
      });
    } else if (filter !== "all") {
      // Could be a locationId or a categoryKey (prefixed)
      if (filter.startsWith("cat:")) {
        const catName = filter.slice(4);
        result = result.filter((i) => i.category === catName);
      } else {
        result = result.filter((i) => i.locationId === filter);
      }
    }

    // 2. Search — respects current filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => {
        const locName = locations.find((l) => l.id === i.locationId)?.name || "";
        return (
          i.name?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          locName.toLowerCase().includes(q)
        );
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortKey) {
        case "expiring": {
          const da = daysUntil(a.expiryDate) ?? 99999;
          const db_ = daysUntil(b.expiryDate) ?? 99999;
          return da - db_;
        }
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        case "recent":
        default: {
          const aTime = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt || 0);
          const bTime = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(b.addedAt || 0);
          return bTime - aTime;
        }
      }
    });

    return result;
  }, [items, filter, sortKey, searchQuery, locations]);

  // Unique categories from actual items for filter chips
  const itemCategories = useMemo(() => {
    const seen = new Set();
    const cats = [];
    items.forEach((i) => {
      if (i.category && !seen.has(i.category)) {
        seen.add(i.category);
        cats.push(i.category);
      }
    });
    return cats.sort();
  }, [items]);

  const handleAddLocation = async () => {
    if (!newLocName.trim()) { setLocError("Please enter a name."); return; }
    try {
      await addLocation(newLocName.trim(), currentUser.uid);
      setNewLocName("");
      setShowAddLocation(false);
      setLocError("");
    } catch {
      setLocError("Failed to add location.");
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  const emptyMessage = () => {
    if (searchQuery.trim()) return `No results for "${searchQuery}"`;
    if (filter === "expiring") return "Nothing expiring soon. 🎉";
    return "Nothing here yet.\nTap ＋ to add something.";
  };

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        {showSearch ? (
          // Search mode — full-width input
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <input
              autoFocus
              style={{ ...styles.input, flex: 1, padding: "8px 12px", fontSize: 15 }}
              placeholder="Search items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              style={{ ...styles.backBtn, color: "#888", whiteSpace: "nowrap" }}
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div>
              <div style={styles.headerTitle}>🏠 Pantry</div>
              <div style={styles.headerSub}>Hey, {currentUser.displayName}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {isAdmin && (
                <button style={{ ...styles.iconBtn, position: "relative" }} onClick={onAdmin} title="Admin portal">
                  🛡️
                  {pendingCount > 0 && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      background: "#ff3b30", color: "#fff",
                      borderRadius: 10, fontSize: 9, fontWeight: 800,
                      padding: "1px 5px", lineHeight: "14px",
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
              <button style={styles.iconBtn} onClick={() => setShowSearch(true)} title="Search">🔍</button>
              <button style={styles.iconBtn} onClick={onAddItem}>＋</button>
              <button style={{ ...styles.iconBtn, fontSize: 15 }} onClick={logOut} title="Sign out">⎋</button>
            </div>
          </>
        )}
      </div>

      {/* Sort bar */}
      <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
        <button
          onClick={() => setShowSortMenu((v) => !v)}
          style={{
            background:   "none",
            border:       "1px solid #2a2a2a",
            borderRadius: 8,
            color:        "#888",
            fontSize:     12,
            padding:      "5px 10px",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            gap:          5,
          }}
        >
          ↕ {currentSortLabel}
        </button>

        {showSortMenu && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 19 }}
              onClick={() => setShowSortMenu(false)}
            />
            <div style={{
              position:     "absolute",
              top:          "100%",
              right:        0,
              marginTop:    6,
              background:   "#1e1e1e",
              border:       "1px solid #2a2a2a",
              borderRadius: 12,
              zIndex:       20,
              overflow:     "hidden",
              minWidth:     180,
            }}>
              {SORT_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                  style={{
                    padding:      "11px 16px",
                    fontSize:     14,
                    cursor:       "pointer",
                    color:        sortKey === opt.key ? "#007aff" : "#e0e0e0",
                    fontWeight:   sortKey === opt.key ? 700 : 400,
                    borderBottom: "1px solid #2a2a2a",
                    background:   sortKey === opt.key ? "#0d1f3c" : "transparent",
                  }}
                >
                  {sortKey === opt.key && "✓ "}{opt.label}
                </div>
              ))}
            </div>
          </>
        )}
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
        {itemCategories.map((cat) => (
          <FilterChip key={`cat:${cat}`} label={`# ${cat}`} active={filter === `cat:${cat}`} onClick={() => setFilter(`cat:${cat}`)} />
        ))}
        <FilterChip label="＋ Location" active={false} onClick={() => setShowAddLocation(true)} dashed />
      </div>

      {/* Search hint when active */}
      {searchQuery.trim() && (
        <div style={{ padding: "6px 16px 0", fontSize: 12, color: "#555" }}>
          {displayedItems.length} result{displayedItems.length !== 1 ? "s" : ""} for "{searchQuery}"
          {filter !== "all" && " in current filter"}
        </div>
      )}

      {/* Grid */}
      <div style={styles.grid}>
        {displayedItems.length === 0 && (
          <div style={styles.empty}>{emptyMessage()}</div>
        )}
        {displayedItems.map((item) => (
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
