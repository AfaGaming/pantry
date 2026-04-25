import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../config/firebase";

// ── Live listener for all users (admin only) ──────────────────────────────────
export const subscribeToUsers = (callback) => {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(users);
  });
};

// ── Live pending count — updates instantly on any user doc change ─────────────
export const subscribeToPendingCount = (callback) => {
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snap) => {
    const count = snap.docs.filter((d) => {
      const data = d.data();
      return data.approved === false && !data.disabled;
    }).length;
    callback(count);
  });
};

// ── Approve ───────────────────────────────────────────────────────────────────
export const approveUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { approved: true, disabled: false });
};

// ── Reject — moves to disabled tab, off pending ───────────────────────────────
export const rejectUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { disabled: true });
};

// ── Disable ───────────────────────────────────────────────────────────────────
export const disableUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { disabled: true });
};

// ── Re-enable ────────────────────────────────────────────────────────────────
export const enableUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { disabled: false });
};

// ── Set admin role ────────────────────────────────────────────────────────────
export const setAdminRole = async (uid, makeAdmin) => {
  return updateDoc(doc(db, "users", uid), {
    role: makeAdmin ? "admin" : "user",
  });
};

// ── Password reset ────────────────────────────────────────────────────────────
export const resetUserPassword = async (email) => {
  return sendPasswordResetEmail(auth, email);
};
