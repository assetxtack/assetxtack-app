import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { parseTimestamp, safeString, safeNumber, verifyAdmin } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export type WalletTransactionType =
  | "ESCROW_LOCK"
  | "ESCROW_RELEASE"
  | "ESCROW_CANCELLED"
  | "WITHDRAWAL_INITIATED"
  | "WITHDRAWAL_COMPLETED"
  | "WITHDRAWAL_FAILED"
  | "LISTING_SALE"
  | "PLATFORM_FEE"
  | "REFUND"
  | "CREDIT";

export type WalletTransactionStatus = "pending" | "completed" | "failed";

interface WalletTransactionEntry {
  id: string;
  userId: string;
  orderId: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  metadata: Record<string, unknown>;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken: { uid: string };
    try {
      const adminAuth = getAdminAuth();
      if (!adminAuth) {
        return NextResponse.json({ error: "Authentication not available" }, { status: 500 });
      }
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const adminUserDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const adminUserData = adminUserDoc.data() as Record<string, unknown> | undefined;

    if (!verifyAdmin(decodedToken, adminUserData)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("walletTransactions").get();

    const transactions: WalletTransactionEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtDate = parseTimestamp(data.createdAt);

      return {
        id: doc.id,
        userId: safeString(data.userId),
        orderId: data.orderId ? safeString(data.orderId) : null,
        type: safeString(data.type) || "UNKNOWN",
        amount: safeNumber(data.amount),
        currency: safeString(data.currency) || "NGN",
        status: safeString(data.status) || "pending",
        description: safeString(data.description) || "",
        metadata: (data.metadata as Record<string, unknown>) || {},
        balanceBefore: safeNumber(data.balanceBefore),
        balanceAfter: safeNumber(data.balanceAfter),
        createdAt: createdAtDate?.toISOString() || new Date().toISOString(),
        userName: null,
        userEmail: null,
      };
    });

    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    for (const tx of transactions) {
      userIds.add(tx.userId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data() as Record<string, unknown> | undefined;
      if (ud) {
        usersMap.set(uid, {
          fullName: typeof ud.fullName === "string" ? ud.fullName : undefined,
          email: typeof ud.email === "string" ? ud.email : undefined,
        });
      }
    }

    const enrichedTransactions = transactions.map((tx) => {
      const userInfo = usersMap.get(tx.userId);
      return {
        ...tx,
        userName: userInfo?.fullName || null,
        userEmail: userInfo?.email || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        transactions: enrichedTransactions,
        count: enrichedTransactions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_WALLET_TRANSACTIONS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch wallet transactions: ${errorMessage}` },
      { status: 500 }
    );
  }
}
