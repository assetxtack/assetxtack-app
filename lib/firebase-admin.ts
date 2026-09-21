import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminDb: ReturnType<typeof getFirestore> | null = null;

function initializeAdminApp() {
  if (typeof window !== "undefined") return;
  if (getApps().length) return;

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error("FIREBASE_ADMIN_SERVICE_ACCOUNT JSON parse error:", parseError);
      throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT is not valid JSON.");
    }
    initializeApp({
      credential: cert(serviceAccount),
    });
    return;
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing credentials: Ensure FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local"
    );
  }

  privateKey = privateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  if (typeof window !== "undefined") return null;
  try {
    initializeAdminApp();
    return getAuth(getApp());
  } catch (error) {
    console.error("Firebase Admin auth initialization detailed error:", error);
    throw error;
  }
}

export function getAdminFirestore() {
  if (typeof window !== "undefined") return null;

  try {
    initializeAdminApp();

    const app = getApp();
    adminDb = getFirestore(app);
    return adminDb;
  } catch (error) {
    console.error("Firebase Admin initialization detailed error:", error);
    throw error;
  }
}
