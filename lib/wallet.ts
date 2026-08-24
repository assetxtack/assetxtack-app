import { getAdminFirestore } from "./firebase-admin";

export type WalletTransactionType =
  | "ESCROW_LOCK"
  | "ESCROW_RELEASE"
  | "WITHDRAWAL_INITIATED"
  | "WITHDRAWAL_COMPLETED"
  | "WITHDRAWAL_FAILED"
  | "LISTING_SALE"
  | "PLATFORM_FEE"
  | "REFUND"
  | "CREDIT";

export interface WalletTransactionPayload {
  userId: string;
  orderId?: string;
  type: WalletTransactionType;
  amount: number;
  escrowAmount?: number;
  currency?: string;
  status?: "pending" | "completed" | "failed";
  description: string;
  metadata?: Record<string, unknown>;
  balanceBefore?: number;
  balanceAfter?: number;
}

export async function recordWalletTransaction({
  userId,
  orderId,
  type,
  amount,
  escrowAmount,
  currency = "NGN",
  status = "completed",
  description,
  metadata,
  balanceBefore,
  balanceAfter,
}: WalletTransactionPayload & { escrowAmount?: number }) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const txRef = adminDb.collection("walletTransactions").doc();
  const now = new Date();
  let finalBalanceAfter = 0;

  await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {};
    const currentBalance = Number(userData.walletBalance || 0);
    const currentEscrow = Number(userData.escrowBalance || 0);
    const currentLifetime = Number(userData.lifetimeSales || 0);

    let nextBalance = currentBalance;
    let nextEscrow = currentEscrow;
    let nextLifetime = currentLifetime;

    switch (type) {
      case "ESCROW_LOCK":
        nextEscrow = currentEscrow + amount;
        break;
      case "ESCROW_RELEASE": {
        const releaseAmount = Number(amount);
        const escrowDeduction = escrowAmount !== undefined ? Number(escrowAmount) : releaseAmount;
        nextBalance = currentBalance + releaseAmount;
        nextEscrow = Math.max(0, currentEscrow - escrowDeduction);
        nextLifetime = currentLifetime + escrowDeduction;
        break;
      }
      case "WITHDRAWAL_COMPLETED":
        nextBalance = currentBalance - amount;
        break;
      case "LISTING_SALE":
        nextBalance = currentBalance + amount;
        nextLifetime = currentLifetime + amount;
        break;
      case "PLATFORM_FEE":
        break;
      case "REFUND":
        nextBalance = currentBalance + amount;
        nextEscrow = Math.max(0, currentEscrow - amount);
        break;
      default:
        break;
    }

    finalBalanceAfter = nextBalance;

    transaction.set(txRef, {
      userId,
      orderId: orderId || null,
      type,
      amount,
      currency,
      status,
      description,
      metadata: metadata || {},
      balanceBefore: balanceBefore ?? currentBalance,
      balanceAfter: balanceAfter ?? nextBalance,
      createdAt: now,
    });

    const updateData: Record<string, unknown> = {
      walletBalance: nextBalance,
      escrowBalance: nextEscrow,
      lifetimeSales: nextLifetime,
      updatedAt: now,
    };

    transaction.set(userRef, updateData, { merge: true });
  });

  return { txId: txRef.id, balanceAfter: finalBalanceAfter };
}

export async function getWalletTransactions(userId: string, limit = 50) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const snapshot = await adminDb
    .collection("walletTransactions")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
