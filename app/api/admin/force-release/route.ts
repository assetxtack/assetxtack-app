import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { recordWalletTransaction } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerId, grossAmount, netAmount } = body;

    if (!sellerId || !grossAmount || !netAmount) {
      return NextResponse.json(
        { error: "Missing required fields: sellerId, grossAmount, netAmount" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const result = await recordWalletTransaction({
      userId: sellerId,
      type: "ESCROW_RELEASE",
      amount: Number(netAmount),
      escrowAmount: Number(grossAmount),
      description: `Force release escrow for seller ${sellerId.slice(0, 6)}`,
      metadata: { grossAmount: Number(grossAmount), forceRelease: true },
    });

    return NextResponse.json({
      success: true,
      txId: result.txId,
      balanceAfter: result.balanceAfter,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[FORCE_RELEASE_ERROR]:", error);
    return NextResponse.json({ error: `Force release failed: ${errorMessage}` }, { status: 500 });
  }
}
