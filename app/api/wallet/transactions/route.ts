import { NextResponse } from "next/server";
import { getWalletTransactions } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limitParam = searchParams.get("limit");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const limit = limitParam ? Math.min(Number(limitParam), 100) : 50;

    const transactions = await getWalletTransactions(userId, limit);

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch transactions";
    console.error("Fetch transactions error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
