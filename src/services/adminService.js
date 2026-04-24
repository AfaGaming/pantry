import {
  collection,
  doc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

// ── Live listener for all users (admin only) ──────────────────────────────────
export const subscribeToUsers = (callback) => {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(users);
  });
};

// ── Approve a user ────────────────────────────────────────────────────────────
export const approveUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { approved: true, disabled: false });
};

// ── Reject / remove pending user ──────────────────────────────────────────────
export const rejectUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { approved: false });
};

// ── Disable an active user ────────────────────────────────────────────────────
export const disableUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { disabled: true });
};

// ── Re-enable a disabled user ─────────────────────────────────────────────────
export const enableUser = async (uid) => {
  return updateDoc(doc(db, "users", uid), { disabled: false });
};

// ── Send password reset email (Firebase Auth) ─────────────────────────────────
// This uses Firebase Auth's built-in reset — no Cloud Function needed.
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

export const resetUserPassword = async (email) => {
  return sendPasswordResetEmail(auth, email);
};

// ── Get pending count (one-time fetch) ───────────────────────────────────────
export const getPendingCount = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.filter((d) => {
    const data = d.data();
    return data.approved === false && !data.disabled;
  }).length;
};
