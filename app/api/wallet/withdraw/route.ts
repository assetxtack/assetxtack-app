import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { recordWalletTransaction } from "@/lib/wallet";

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
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data() as Record<string, unknown>;
    const currentBalance = Number(userData.walletBalance || 0);
    const requestedAmount = Number(amount);

    if (requestedAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid withdrawal amount" }, { status: 400 });
    }

    if (requestedAmount > currentBalance) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance", availableBalance: currentBalance },
        { status: 400 }
      );
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

    await recordWalletTransaction({
      userId,
      orderId: withdrawalRef.id,
      type: "WITHDRAWAL_INITIATED",
      amount: requestedAmount,
      description: `Withdrawal request to ${bankAccount.bankName || "Bank"} ****${String(bankAccount.accountNumber || "").slice(-4)}`,
      metadata: { bankAccount, reason },
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      requestId: withdrawalRef.id,
      message: "Withdrawal request submitted successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error during withdrawal";
    console.error("Withdrawal request error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
