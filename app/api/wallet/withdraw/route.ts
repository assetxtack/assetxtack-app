import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, bankAccount, reason } = body;

    if (!userId || !amount || !bankAccount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, amount, bankAccount" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const requestedAmount = Number(amount);

    if (requestedAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid withdrawal amount" }, { status: 400 });
    }

    const withdrawalRef = await adminDb.collection("withdrawalRequests").add({
      userId,
      sellerId: userId,
      amount: requestedAmount,
      bankAccount,
      status: "pending",
      reason: reason || "Wallet withdrawal",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as Record<string, unknown>;
      const currentBalance = Number(userData.walletBalance || 0);

      if (requestedAmount > currentBalance) {
        throw new Error(`Insufficient wallet balance. Available: ${currentBalance}`);
      }

      const newBalance = currentBalance - requestedAmount;

      transaction.set(
        userRef,
        {
          walletBalance: newBalance,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      transaction.set(
        adminDb.collection("walletTransactions").doc(),
        {
          userId,
          orderId: withdrawalRef.id,
          type: "WITHDRAWAL_INITIATED",
          amount: requestedAmount,
          status: "pending",
          description: `Withdrawal request to ${bankAccount.bankName || "Bank"} ****${String(bankAccount.accountNumber || "").slice(-4)}`,
          metadata: { bankAccount, reason },
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          createdAt: new Date(),
        }
      );

      return { newBalance };
    });

    return NextResponse.json({
      success: true,
      requestId: withdrawalRef.id,
      message: "Withdrawal request submitted successfully",
      newBalance: result.newBalance,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error during withdrawal";
    console.error("Withdrawal request error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
