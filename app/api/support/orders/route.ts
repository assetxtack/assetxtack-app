import { NextResponse } from "next/server";
import { getUserOrders } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const orders = await getUserOrders(userId);

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders";
    console.error("Fetch orders error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
