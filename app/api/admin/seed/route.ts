import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

const SEED_SECRET = process.env.SEED_SECRET || process.env.NEXT_PUBLIC_SEED_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedSecret = body.secret || request.headers.get("x-seed-secret");

    if (!SEED_SECRET || providedSecret !== SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = [
      "users",
      "listings",
      "orders",
      "reviews",
      "chats",
      "notifications",
      "wallets",
      "walletTransactions",
      "withdrawalRequests",
      "kyc",
      "disputes",
      "escrow",
      "supportTickets",
      "transfers",
      "reviewStats",
    ];

    const results: { name: string; status: string }[] = [];

    for (const name of collections) {
      const ref = doc(db, name, "seed_check");
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          _seed: true,
          collection: name,
          createdAt: serverTimestamp(),
        });
        results.push({ name, status: "created" });
      } else {
        results.push({ name, status: "exists" });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Firestore collections verified/created successfully.",
      results,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed API error:", errorMessage, error);
    return NextResponse.json({ error: `Seeding failed: ${errorMessage}` }, { status: 500 });
  }
}
