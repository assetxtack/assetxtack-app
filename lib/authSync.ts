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
  createdAt: string;
}

export async function syncUserToFirestore(firebaseUser: User): Promise<UserProfile> {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }

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

  await setDoc(userRef, profile, { merge: true });
  return profile;
}
