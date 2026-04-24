import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useFirestore } from "./hooks/useFirestore";
import { getUsers } from "./services/dbService";
import { checkApproval, logOut } from "./services/authService";
import { getPendingCount } from "./services/adminService";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import DetailScreen from "./screens/DetailScreen";
import AddItemScreen from "./screens/AddItemScreen";
import AdminScreen from "./screens/AdminScreen";
import { Spinner } from "./components/SharedComponents";
import { unclaimItem } from "./services/dbService";
import { styles } from "./components/styles";

const CLAIM_TIMEOUT_MS = 30 * 60 * 1000;

export default function App() {
  const { user, loading: authLoading }                = useAuth();
  const { items, locations, categories, loadingData } = useFirestore();
  const [usersMap,     setUsersMap]     = useState({});
  const [userDoc,      setUserDoc]      = useState(null);
  const [view,         setView]         = useState("home");
  const [selected,     setSelected]     = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch current user's Firestore doc (approved, disabled, role)
  useEffect(() => {
    if (!user) { setUserDoc(null); return; }
    checkApproval(user.uid).then(setUserDoc);
  }, [user]);

  // Poll pending count for admin badge
  useEffect(() => {
    if (!userDoc?.isAdmin) return;
    getPendingCount().then(setPendingCount);
    const interval = setInterval(() => getPendingCount().then(setPendingCount), 30_000);
    return () => clearInterval(interval);
  }, [userDoc]);

  // Fetch users map for display names
  useEffect(() => {
    if (!user || !userDoc?.approved) return;
    getUsers().then((users) => {
      const map = {};
      users.forEach((u) => { map[u.uid] = u; });
      setUsersMap(map);
    });
  }, [user, userDoc]);

  // Auto-unclaim stale claims
  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      items.forEach((item) => {
        if (item.claimedAt) {
          const ms = item.claimedAt.toDate
            ? item.claimedAt.toDate().getTime()
            : new Date(item.claimedAt).getTime();
          if (Date.now() - ms > CLAIM_TIMEOUT_MS) unclaimItem(item.id);
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [items]);

  if (authLoading)      return <Spinner />;
  if (!user)            return <LoginScreen />;
  if (userDoc === null) return <Spinner />;

  // Disabled account
  if (userDoc.disabled) {
    return (
      <div style={{ ...styles.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Account Disabled</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Your account has been disabled. Please contact the household admin.
        </p>
        <button style={{ ...styles.btnSecondary, padding: "12px 24px" }} onClick={logOut}>Sign out</button>
      </div>
    );
  }

  // Pending approval
  if (!userDoc.approved) {
    return (
      <div style={{ ...styles.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Awaiting Approval</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Your account is pending approval. Hang tight — someone will let you in shortly.
        </p>
        <button style={{ ...styles.btnSecondary, padding: "12px 24px" }} onClick={logOut}>Sign out</button>
      </div>
    );
  }

  if (loadingData) return <Spinner />;

  if (view === "admin") return (
    <AdminScreen
      currentUser={user}
      onBack={() => setView("home")}
    />
  );

  if (view === "add") return (
    <AddItemScreen
      currentUser={user}
      locations={locations}
      categories={categories}
      onBack={() => setView("home")}
    />
  );

  if (view === "detail" && selected) {
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
      isAdmin={userDoc?.isAdmin || false}
      pendingCount={pendingCount}
      onSelectItem={(item) => { setSelected(item); setView("detail"); }}
      onAddItem={() => setView("add")}
      onAdmin={() => setView("admin")}
    />
  );
}