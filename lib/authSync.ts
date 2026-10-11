import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user";
  status: "active";
  isVerified: boolean;
  emailVerified?: boolean;
  createdAt: string;
}

export async function syncUserToFirestore(firebaseUser: User): Promise<UserProfile> {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "New User",
    photoURL: firebaseUser.photoURL || "",
    role: "user",
    status: "active",
    isVerified: false,
    createdAt: now,
  };

  if (snapshot.exists()) {
    const existingData = snapshot.data() as UserProfile;
    const updates: Record<string, unknown> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || existingData.displayName || "New User",
      photoURL: firebaseUser.photoURL || existingData.photoURL || "",
      status: "active",
      isVerified: existingData.isVerified ?? false,
      // NEVER change emailVerified via sync for existing users.
      // It's only set:
      // 1. On new document creation (not written here - register pages handle it)
      // 2. On the verify-email page after applyActionCode succeeds
      // This prevents premature setting of emailVerified: true on sign-in.
      createdAt: existingData.createdAt || now,
    };

    if (!existingData.role) {
      (updates as Record<string, unknown>).role = "user";
    }

    await setDoc(userRef, updates, { merge: true });
    return { ...existingData, ...updates } as UserProfile;
  }

  await setDoc(userRef, profile, { merge: true });
  return profile;
}
