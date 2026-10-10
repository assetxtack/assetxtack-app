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
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { syncUserToFirestore } from "@/lib/authSync";

// Custom user interface extending Firebase Auth User with Firestore profile fields
export interface AppUser extends User {
  isVerified?: boolean;
  kycStatus?: "none" | "pending" | "verified" | "rejected";
  username?: string;
  phoneNumberProfile?: string;
}

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLinkSignIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_STORAGE_KEY = "assetxtack_email_for_signin";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let authEventId = 0;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (authUser) => {
        const currentEventId = ++authEventId;
        setLoading(true);
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }

        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          await syncUserToFirestore(authUser);
        } catch (error) {
          console.error("Failed to sync authenticated user profile:", error);
          if (currentEventId === authEventId) {
            setUser(null);
            setLoading(false);
            if (auth.currentUser?.uid === authUser.uid) {
              void firebaseSignOut(auth);
            }
          }
          return;
        }

        const userDocRef = doc(db, "users", authUser.uid);
        if (currentEventId !== authEventId) return;

        unsubscribeFirestore = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (currentEventId !== authEventId) return;
            const profileData = docSnap.exists() ? docSnap.data() : {};

            if (profileData.status === "banned") {
              const bannedUid = authUser.uid;
              void firebaseSignOut(auth).finally(() => {
                window.location.replace(`/suspended?uid=${encodeURIComponent(bannedUid)}`);
              });
              return;
            }

            setUser({
      ...authUser,
      photoURL: (authUser as any).photoURL || "",
      isVerified: Boolean(profileData.sellerVerified || profileData.isVerified),
              kycStatus: profileData.kycStatus || "none",
              username: profileData.username || authUser.displayName || "",
            } as AppUser);

            setLoading(false);
          },
          (error) => {
            if (currentEventId !== authEventId) return;
            console.error("Error fetching user profile from Firestore:", error);
            setUser(authUser as AppUser);
            setLoading(false);
          }
        );
      },
      (authError) => {
        console.error("Auth state listener error:", authError);
        authEventId += 1;
        setUser(null);
        setLoading(false);
        if (unsubscribeFirestore) unsubscribeFirestore();
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) await syncUserToFirestore(result.user);
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
