import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebase";

// ── Create or update a user document in Firestore after any sign-in ──────────
const upsertUserDoc = async (firebaseUser) => {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      displayName: firebaseUser.displayName || "Unnamed",
      email:       firebaseUser.email,
      createdAt:   serverTimestamp(),
    });
  }
};

// ── Google Sign-In ────────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await upsertUserDoc(result.user);
  return result.user;
};

// ── Email / Password Sign-In ──────────────────────────────────────────────────
export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// ── Email / Password Register ─────────────────────────────────────────────────
export const registerWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await upsertUserDoc({ ...result.user, displayName });
  return result.user;
};

// ── Sign Out ──────────────────────────────────────────────────────────────────
export const logOut = () => signOut(auth);

// ── Auth state listener ───────────────────────────────────────────────────────
export const onAuth = (callback) => onAuthStateChanged(auth, callback);
