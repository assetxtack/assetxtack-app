"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLinkSignIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_STORAGE_KEY = "assetxtack_email_for_signin";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const sendEmailLink = async (email: string) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/complete`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  };

  const completeEmailLinkSignIn = async (): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;

    let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!email) {
      email = window.prompt("Please confirm your email to complete sign-in");
    }
    if (!email) return false;

    await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    return true;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, sendEmailLink, completeEmailLinkSignIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}