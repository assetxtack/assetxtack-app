import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import * as fs from "fs";
import * as path from "path";

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) env[key] = value;
  }

  return env;
}

const ROOT = process.cwd();
const envLocal = loadEnvFile(path.join(ROOT, ".env.local"));
const envFile = loadEnvFile(path.join(ROOT, ".env"));

const mergedEnv = { ...envFile, ...envLocal, ...process.env };

const firebaseConfig = {
  apiKey: mergedEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: mergedEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: mergedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: mergedEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: mergedEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: mergedEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in environment.");
  console.error("Checked .env.local and .env. Please ensure Firebase config is set.");
  process.exit(1);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const SEEDABLE_COLLECTIONS = [
  {
    name: "users",
    docId: (uid: string) => uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "users",
      userId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "listings",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "listings",
      sellerId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "orders",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "orders",
      buyerId: uid,
      sellerId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "reviews",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "reviews",
      buyerId: uid,
      sellerId: uid,
      rating: 5,
      createdAt: new Date(),
    }),
  },
  {
    name: "chats",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "chats",
      senderId: uid,
      orderId: "seed_" + uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "disputes",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "disputes",
      buyerId: uid,
      sellerId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "withdrawalRequests",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "withdrawalRequests",
      sellerId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "kyc",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "kyc",
      userId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "supportTickets",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "supportTickets",
      userId: uid,
      createdAt: new Date(),
    }),
  },
  {
    name: "transfers",
    docId: (uid: string) => "seed_" + uid,
    data: (uid: string) => ({
      _seed: true,
      collection: "transfers",
      sellerId: uid,
      createdAt: new Date(),
    }),
  },
];

const SERVER_ONLY_COLLECTIONS = [
  "notifications",
  "wallets",
  "walletTransactions",
  "escrow",
  "reviewStats",
];

async function seedFirestore() {
  console.log("Seeding Firestore collections using client Firebase...\n");

  let anonymousUid: string | null = null;
  try {
    const cred = await signInAnonymously(auth);
    anonymousUid = cred.user.uid;
    console.log(`Signed in anonymously as ${anonymousUid}\n`);
  } catch (authError) {
    console.error("ERROR: Anonymous authentication failed.");
    console.error("Please enable Anonymous auth in Firebase Console > Authentication > Sign-in method.");
    console.error("Details:", authError);
    process.exit(1);
  }

  if (!anonymousUid) {
    console.error("ERROR: Anonymous UID is null. Authentication did not complete.");
    process.exit(1);
  }

  console.log("--- Seeding client-writable collections ---");
  const results: { name: string; status: string }[] = [];

  for (const collection of SEEDABLE_COLLECTIONS) {
    try {
      const ref = doc(db, collection.name, collection.docId(anonymousUid));
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, collection.data(anonymousUid), { merge: true });
        console.log(`  Created: ${collection.name}`);
        results.push({ name: collection.name, status: "created" });
      } else {
        console.log(`  Exists:  ${collection.name}`);
        results.push({ name: collection.name, status: "exists" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`  Failed:  ${collection.name} — ${message}`);
      results.push({ name: collection.name, status: `failed: ${message}` });
    }
  }

  console.log("\n--- Server-only collections (skipped) ---");
  for (const name of SERVER_ONLY_COLLECTIONS) {
    console.log(`  Skipped: ${name} (write rules restrict to server/admin only)`);
  }

  console.log("\n--- Summary ---");
  const created = results.filter((r) => r.status === "created").length;
  const exists = results.filter((r) => r.status === "exists").length;
  const failed = results.filter((r) => r.status.startsWith("failed")).length;

  console.log(`  Created: ${created}`);
  console.log(`  Already existed: ${exists}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Server-only (skipped): ${SERVER_ONLY_COLLECTIONS.length}`);

  if (failed > 0) {
    console.log("\nSome collections failed. Check the messages above.");
    console.log("Common causes:");
    console.log("  - Anonymous auth not enabled in Firebase Console");
    console.log("  - Firestore rules not deployed recently");
    console.log("  - Network/Firebase project misconfiguration");
    process.exit(1);
  }

  console.log("\nDone.");
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
