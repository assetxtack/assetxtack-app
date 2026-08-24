import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: { id: orderSnap.id, ...orderSnap.data() },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to fetch order: ${errorMessage}` }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, completedAt, disputedAt, initiatorId } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data() as Record<string, unknown>;
    const buyerId = String(orderData.buyerId || "");
    const sellerId = String(orderData.sellerId || "");

    const updateData: Record<string, unknown> = { status };
    if (status === "COMPLETED" && completedAt) {
      updateData.completedAt = new Date(completedAt);
    }
    if (status === "DISPUTED" && disputedAt) {
      updateData.disputedAt = new Date(disputedAt);
    }

    await orderRef.update(updateData);

    if (status === "COMPLETED" && sellerId) {
      const orderAmount = Number(orderData.amount || 0);
      const listingPlan = String(orderData.listingPlan || "");
      const orderHasShield = Boolean(orderData.hasShieldProtection);
      const feePercentage = (listingPlan === "shield" || listingPlan === "featured" || orderHasShield) ? 0.10 : 0.05;
      const platformFee = Math.round(orderAmount * feePercentage);
      const sellerPayout = orderAmount - platformFee;

      if (orderAmount > 0) {
        await recordWalletTransaction({
          userId: sellerId,
          orderId,
          type: "ESCROW_RELEASE",
          amount: sellerPayout,
          escrowAmount: orderAmount,
          description: `Escrow release for order ${orderId.slice(0, 6)}`,
          metadata: { buyerId, orderId, platformFee, feePercentage, grossAmount: orderAmount },
        });

        await recordWalletTransaction({
          userId: sellerId,
          orderId,
          type: "PLATFORM_FEE",
          amount: platformFee,
          description: `Platform fee for order ${orderId.slice(0, 6)} (${orderHasShield ? "Featured" : "Standard"})`,
          metadata: { buyerId, orderId, feePercentage, grossAmount: orderAmount },
        });
      }

      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Order Completed",
        message: "Buyer confirmed delivery. Escrow funds have been released to your wallet.",
        type: "ORDER_COMPLETED",
      });
    }

    if (status === "DISPUTED") {
      const oppositeParty = String(initiatorId || "") === buyerId ? sellerId : buyerId;

      if (oppositeParty) {
        await sendNotification({
          userId: oppositeParty,
          orderId,
          title: `Dispute opened on order #${orderId.slice(0, 6)}`,
          message: "A dispute has been raised. Support will review the trade details.",
          type: "DISPUTE",
        });
      }

      if (initiatorId) {
        await sendNotification({
          userId: String(initiatorId),
          orderId,
          title: "Dispute submitted",
          message: `Your dispute request for order #${orderId.slice(0, 6)} is under review.`,
          type: "DISPUTE",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to update order: ${errorMessage}` }, { status: 500 });
  }
}
