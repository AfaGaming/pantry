import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { addLocation, deleteLocation, renameLocation } from "../services/dbService";
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

// ── Long press hook ───────────────────────────────────────────────────────────
function useLongPress(onLongPress, delay = 500) {
  const timerRef = useRef(null);

  const start = useCallback((e) => {
    // Prevent context menu on desktop
    e.preventDefault();
    timerRef.current = setTimeout(() => onLongPress(e), delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    onMouseDown:   start,
    onMouseUp:     cancel,
    onMouseLeave:  cancel,
    onTouchStart:  start,
    onTouchEnd:    cancel,
    onTouchCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
  };
}

export default function HomeScreen({
  currentUser, items, locations, categories, usersMap,
  isAdmin, pendingCount, onSelectItem, onAddItem, onAdmin,
}) {
  const [filter,          setFilter]          = useState("all");
  const [showTagRow,      setShowTagRow]      = useState(false);
  const [activeTag,       setActiveTag]       = useState(null);
  const [sortKey,         setSortKey]         = useState("recent");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [showSearch,      setShowSearch]      = useState(false);
  const [showSortMenu,    setShowSortMenu]    = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName,      setNewLocName]      = useState("");
  const [locError,        setLocError]        = useState("");

  // Location context menu
  const [ctxMenu,         setCtxMenu]         = useState(null); // { loc, x, y }
  const [renamingLoc,     setRenamingLoc]     = useState(null); // loc object
  const [renameValue,     setRenameValue]     = useState("");
  const [deleteConfirm,   setDeleteConfirm]   = useState(null); // loc object

  const expiringSoonCount = items.filter((i) => {
    const d = daysUntil(i.expiryDate);
    return d !== null && d <= 14;
  }).length;

  const myClaimsCount = items.filter((i) => i.claimedBy === currentUser.uid).length;

  // Unique categories from actual items
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

  const displayedItems = useMemo(() => {
    let result = [...items];

    // 1. My Claims filter
    if (filter === "claimed") {
      result = result.filter((i) => i.claimedBy === currentUser.uid);
    } else if (filter === "expiring") {
      result = result.filter((i) => {
        const d = daysUntil(i.expiryDate);
        return d !== null && d <= 14;
      });
    } else if (filter !== "all") {
      result = result.filter((i) => i.locationId === filter);
    }

    // 2. Tag sub-filter
    if (activeTag) {
      result = result.filter((i) => i.category === activeTag);
    }

    // 3. Search
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

    // 4. Sort — pinned always first, then by sortKey
    result.sort((a, b) => {
      // Pinned items always float to top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

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
  }, [items, filter, activeTag, sortKey, searchQuery, locations, currentUser.uid]);

  const handleAddLocation = async () => {
    if (!newLocName.trim()) { setLocError("Please enter a name."); return; }
    try {
      await addLocation(newLocName.trim(), currentUser.uid);
      setNewLocName(""); setShowAddLocation(false); setLocError("");
    } catch { setLocError("Failed to add location."); }
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !renamingLoc) return;
    try {
      await renameLocation(renamingLoc.id, renameValue.trim());
      setRenamingLoc(null); setRenameValue("");
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (loc) => {
    const inUse = items.some((i) => i.locationId === loc.id);
    if (inUse) {
      setDeleteConfirm({ loc, blocked: true });
      return;
    }
    try {
      await deleteLocation(loc.id);
      if (filter === loc.id) setFilter("all");
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => setCtxMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [ctxMenu]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  const emptyMessage = () => {
    if (searchQuery.trim()) return `No results for "${searchQuery}"`;
    if (filter === "claimed") return "You haven't claimed anything.";
    if (filter === "expiring") return "Nothing expiring soon. 🎉";
    return "Nothing here yet.\nTap ＋ to add something.";
  };

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        {showSearch ? (
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

      {/* Sort + My Claims row */}
      <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        {/* My Claims pill — left side */}
        <button
          onClick={() => setFilter(filter === "claimed" ? "all" : "claimed")}
          style={{
            background:   filter === "claimed" ? "#ff9500" : "none",
            border:       "1px solid #ff9500",
            borderRadius: 20,
            color:        filter === "claimed" ? "#fff" : "#ff9500",
            fontSize:     12,
            fontWeight:   700,
            padding:      "5px 12px",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            gap:          5,
          }}
        >
          🙋 My Claims{myClaimsCount > 0 ? ` (${myClaimsCount})` : ""}
        </button>

        {/* Sort button — right side */}
        <div style={{ position: "relative" }}>
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
              <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setShowSortMenu(false)} />
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 6,
                background: "#1e1e1e", border: "1px solid #2a2a2a",
                borderRadius: 12, zIndex: 20, overflow: "hidden", minWidth: 180,
              }}>
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    style={{
                      padding: "11px 16px", fontSize: 14, cursor: "pointer",
                      color:      sortKey === opt.key ? "#007aff" : "#e0e0e0",
                      fontWeight: sortKey === opt.key ? 700 : 400,
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
      </div>

      {/* Filter Bar — locations only */}
      <div style={styles.filterBar}>
        <FilterChip label="All" active={filter === "all" && !activeTag} onClick={() => { setFilter("all"); setActiveTag(null); setShowTagRow(false); }} />
        <FilterChip
          label={`⚠️ Expiring${expiringSoonCount > 0 ? ` (${expiringSoonCount})` : ""}`}
          active={filter === "expiring"}
          onClick={() => { setFilter("expiring"); setActiveTag(null); }}
          alert={expiringSoonCount > 0}
        />
        {locations.map((loc) => (
          <LocationChip
            key={loc.id}
            loc={loc}
            active={filter === loc.id}
            onClick={() => { setFilter(loc.id); setActiveTag(null); }}
            onLongPress={(e) => {
              e.stopPropagation();
              setCtxMenu({ loc, x: e.clientX || 80, y: e.clientY || 120 });
            }}
          />
        ))}
        {/* Tags toggle chip */}
        <FilterChip
          label={`🏷️ Tags${activeTag ? ` · ${activeTag}` : ""}`}
          active={showTagRow || !!activeTag}
          onClick={() => {
            setShowTagRow((v) => !v);
            if (showTagRow) setActiveTag(null);
          }}
        />
        <FilterChip label="＋ Location" active={false} onClick={() => setShowAddLocation(true)} dashed />
      </div>

      {/* Tag sub-row — slides in when Tags is active */}
      {showTagRow && (
        <div style={{ ...styles.filterBar, borderTop: "1px solid #111", background: "#0d0d0d", paddingLeft: 24 }}>
          <FilterChip
            label="All tags"
            active={!activeTag}
            onClick={() => setActiveTag(null)}
          />
          {itemCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={activeTag === cat}
              onClick={() => setActiveTag(activeTag === cat ? null : cat)}
            />
          ))}
        </div>
      )}

      {/* Search / tag hint */}
      {(searchQuery.trim() || activeTag) && (
        <div style={{ padding: "6px 16px 0", fontSize: 12, color: "#555" }}>
          {displayedItems.length} result{displayedItems.length !== 1 ? "s" : ""}
          {activeTag && ` in "${activeTag}"`}
          {searchQuery.trim() && ` for "${searchQuery}"`}
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

      {/* Location context menu */}
      {ctxMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setCtxMenu(null)} />
          <div
            style={{
              position:     "fixed",
              top:          Math.min(ctxMenu.y, window.innerHeight - 120),
              left:         Math.min(ctxMenu.x, window.innerWidth - 180),
              background:   "#1e1e1e",
              border:       "1px solid #333",
              borderRadius: 12,
              zIndex:       50,
              overflow:     "hidden",
              minWidth:     160,
              boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={ctxItemStyle}>
              <span style={{ fontSize: 12, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {ctxMenu.loc.name}
              </span>
            </div>
            <div
              style={{ ...ctxItemStyle, color: "#e0e0e0", cursor: "pointer" }}
              onClick={() => {
                setRenamingLoc(ctxMenu.loc);
                setRenameValue(ctxMenu.loc.name);
                setCtxMenu(null);
              }}
            >
              ✏️ Rename
            </div>
            <div
              style={{ ...ctxItemStyle, color: "#ff3b30", cursor: "pointer" }}
              onClick={() => {
                setDeleteConfirm({ loc: ctxMenu.loc, blocked: false });
                setCtxMenu(null);
              }}
            >
              🗑️ Delete
            </div>
          </div>
        </>
      )}

      {/* Rename modal */}
      {renamingLoc && (
        <div style={styles.modal} onClick={() => setRenamingLoc(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Rename Location</h3>
            <input
              style={styles.input}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={styles.btnSecondary} onClick={() => setRenamingLoc(null)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {deleteConfirm.blocked ? (
              <>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Can't Delete "{deleteConfirm.loc.name}"</h3>
                <p style={{ color: "#888", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
                  This location still has items in it. Move or delete those items first.
                </p>
                <button style={{ ...styles.btnSecondary, width: "100%" }} onClick={() => setDeleteConfirm(null)}>Got it</button>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Delete "{deleteConfirm.loc.name}"?</h3>
                <p style={{ color: "#888", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
                  This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  <button style={styles.btnDanger} onClick={() => handleDelete(deleteConfirm.loc)}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

// ── LocationChip — supports long press ────────────────────────────────────────
function LocationChip({ loc, active, onClick, onLongPress }) {
  const timerRef = useRef(null);
  const didLongPress = useRef(false);

  const startPress = (e) => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(e);
    }, 500);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (!didLongPress.current) onClick();
  };

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
      style={{
        flexShrink:   0,
        padding:      "6px 14px",
        borderRadius: 20,
        border:       "none",
        background:   active ? "#fff" : "transparent",
        color:        active ? "#000" : "#888",
        fontSize:     13,
        fontWeight:   active ? 700 : 500,
        cursor:       "pointer",
        whiteSpace:   "nowrap",
        userSelect:   "none",
        WebkitUserSelect: "none",
      }}
    >
      {loc.name}
    </button>
  );
}

const ctxItemStyle = {
  padding:      "11px 16px",
  fontSize:     13,
  borderBottom: "1px solid #2a2a2a",
};
