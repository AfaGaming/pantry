import { useState, useEffect } from "react";
import { onAuth } from "../services/authService";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../config/firebase";
import { upsertUserDoc } from "../services/authService";

export const useAuth = () => {
  const [user,    setUser]    = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuth((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
};