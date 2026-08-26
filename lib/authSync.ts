import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user";
  isVerified: boolean;
  kycStatus: "unverified";
  createdAt: Date;
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

  const now = new Date();
  const profile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    role: "user",
    isVerified: false,
    kycStatus: "unverified",
    createdAt: now,
  };

  await setDoc(userRef, profile, { merge: true });
  return profile;
}
