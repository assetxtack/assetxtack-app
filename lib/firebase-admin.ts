import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminFirestore() {
  if (typeof window !== "undefined") return null;

  try {
    // Prevent re-initialization if app is already running (e.g., during Next.js hot-reloading)
    if (!getApps().length) {
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
      } else {
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

        if (!clientEmail || !privateKey) {
          throw new Error(
            "Missing credentials: Ensure FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local"
          );
        }

        // Clean up quotes and handle newlines safely
        privateKey = privateKey
          .replace(/^["']|["']$/g, "") // Remove starting/ending quotes if present
          .replace(/\\n/g, "\n");       // Convert escaped \n into actual line breaks

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
    }

    const app = getApp();
    adminDb = getFirestore(app);
    return adminDb;
  } catch (error) {
    console.error("Firebase Admin initialization detailed error:", error);
    throw error; // Throws the exact error so you can see what went wrong in server logs
  }
}