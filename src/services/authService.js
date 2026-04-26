import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebase";

export const upsertUserDoc = async (firebaseUser) => {
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      displayName: firebaseUser.displayName || "Unnamed",
      email:       firebaseUser.email,
      photoURL:    firebaseUser.photoURL || null,
      approved:    false,
      disabled:    false,
      role:        "user",
      createdAt:   serverTimestamp(),
    });
  } else {
    // Update photoURL on every login in case it changed
    await updateDoc(ref, {
      photoURL: firebaseUser.photoURL || null,
    });
  }
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await upsertUserDoc(result.user);
  return result.user;
};

export const handleGoogleRedirect = async () => {
  try {
    console.log("Checking redirect result...");
    const result = await getRedirectResult(auth);
    console.log("Redirect result:", result);
    if (result) {
      console.log("User:", result.user);
      console.log("Credential:", result.credential);
    } else {
      console.log("No redirect result — either no redirect happened or it was already consumed");
    }
    return result;
  } catch (e) {
    console.error("Redirect error code:", e.code);
    console.error("Redirect error message:", e.message);
    console.error("Full error:", e);
    return null;
  }
};

export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const registerWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  // Small delay to let auth token propagate before Firestore write
  await new Promise(resolve => setTimeout(resolve, 500));
  await upsertUserDoc({ ...result.user, displayName });
  return result.user;
};

export const logOut = () => signOut(auth);

export const onAuth = (callback) => onAuthStateChanged(auth, callback);

// Returns full user doc: { approved, disabled, isAdmin, ...rest }
export const checkApproval = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return { approved: false, disabled: false, isAdmin: false };
  const data = snap.data();
  return {
    ...data,
    approved: data.approved === true,
    disabled: data.disabled === true,
    isAdmin:  data.role === "admin",
  };
};