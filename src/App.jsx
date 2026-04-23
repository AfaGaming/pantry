import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { getUsers } from "./services/dbService";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import DetailScreen from "./screens/DetailScreen";
import AddItemScreen from "./screens/AddItemScreen";
import { Spinner } from "./components/SharedComponents";

// Auto-unclaim interval: check every 60s, unclaim after 30min
import { unclaimItem } from "./services/dbService";
const CLAIM_TIMEOUT_MS = 30 * 60 * 1000;

export default function App() {
  const { user, loading: authLoading }          = useAuth();
  const { items, locations, categories, loadingData } = useFirestore();
  const [usersMap,  setUsersMap]  = useState({});
  const [view,      setView]      = useState("home"); // home | detail | add
  const [selected,  setSelected]  = useState(null);   // item object

  // Fetch all users for display names (claimed by, added by)
  useEffect(() => {
    if (!user) return;
    getUsers().then((users) => {
      const map = {};
      users.forEach((u) => { map[u.uid] = u; });
      setUsersMap(map);
    });
  }, [user]);

  // Auto-unclaim stale claims
  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      items.forEach((item) => {
        if (item.claimedAt) {
          const claimedMs = item.claimedAt.toDate
            ? item.claimedAt.toDate().getTime()
            : new Date(item.claimedAt).getTime();
          if (Date.now() - claimedMs > CLAIM_TIMEOUT_MS) {
            unclaimItem(item.id);
          }
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [items]);

  if (authLoading)              return <Spinner />;
  if (!user)                    return <LoginScreen />;
  if (authLoading || loadingData) return <Spinner />;

  if (view === "add") return (
    <AddItemScreen
      currentUser={user}
      locations={locations}
      categories={categories}
      onBack={() => setView("home")}
    />
  );

  if (view === "detail" && selected) {
    // Always use the live item from Firestore (handles real-time updates like claims)
    const liveItem = items.find((i) => i.id === selected.id) || selected;
    return (
      <DetailScreen
        item={liveItem}
        location={locations.find((l) => l.id === liveItem.locationId)}
        currentUser={user}
        usersMap={usersMap}
        onBack={() => { setView("home"); setSelected(null); }}
      />
    );
  }

  return (
    <HomeScreen
      currentUser={user}
      items={items}
      locations={locations}
      categories={categories}
      usersMap={usersMap}
      onSelectItem={(item) => { setSelected(item); setView("detail"); }}
      onAddItem={() => setView("add")}
    />
  );
}
