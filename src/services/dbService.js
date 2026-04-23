import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS
// Collection: "items"
// ─────────────────────────────────────────────────────────────────────────────

export const subscribeToItems = (callback) => {
  const q = query(collection(db, "items"), orderBy("addedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
};

export const addItem = async (itemData) => {
  return addDoc(collection(db, "items"), {
    ...itemData,
    addedAt:   serverTimestamp(),
    claimedBy: null,
    claimedAt: null,
  });
};

export const updateItem = async (itemId, updates) => {
  return updateDoc(doc(db, "items", itemId), updates);
};

export const deleteItem = async (itemId) => {
  return deleteDoc(doc(db, "items", itemId));
};

export const claimItem = async (itemId, uid) => {
  return updateDoc(doc(db, "items", itemId), {
    claimedBy: uid,
    claimedAt: serverTimestamp(),
  });
};

export const unclaimItem = async (itemId) => {
  return updateDoc(doc(db, "items", itemId), {
    claimedBy: null,
    claimedAt: null,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCATIONS
// Collection: "locations"
// ─────────────────────────────────────────────────────────────────────────────

export const subscribeToLocations = (callback) => {
  const q = query(collection(db, "locations"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const locations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(locations);
  });
};

export const addLocation = async (name, uid) => {
  return addDoc(collection(db, "locations"), {
    name,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
};

export const deleteLocation = async (locationId) => {
  return deleteDoc(doc(db, "locations", locationId));
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// Collection: "categories"
// ─────────────────────────────────────────────────────────────────────────────

export const subscribeToCategories = (callback) => {
  const q = query(collection(db, "categories"), orderBy("usageCount", "desc"));
  return onSnapshot(q, (snap) => {
    const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(cats);
  });
};

export const upsertCategory = async (name) => {
  // Check if already exists (case-insensitive)
  const snap = await getDocs(collection(db, "categories"));
  const existing = snap.docs.find(
    (d) => d.data().name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    await updateDoc(doc(db, "categories", existing.id), {
      usageCount: (existing.data().usageCount || 0) + 1,
    });
  } else {
    await addDoc(collection(db, "categories"), {
      name,
      usageCount: 1,
      createdAt: serverTimestamp(),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// Collection: "users"
// ─────────────────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
