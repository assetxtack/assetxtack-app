import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, buyerId, sellerId, amount } = body;

    if (!orderId || !buyerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    const orderData = orderSnap.data();
    if (orderData?.buyerId !== buyerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sellerIdFromOrder = orderData?.sellerId || orderData?.seller_id || orderData?.seller || sellerId;

    if (!sellerIdFromOrder) {
      return NextResponse.json({ error: "Order missing valid seller ID" }, { status: 400 });
    }

    try {
      await orderRef.update({
        status: "COMPLETED",
        completedAt: new Date(),
      });

      if (amount) {
        const listingPlan = orderData?.listingPlan;
        const orderHasShield = Boolean(orderData?.hasShieldProtection);
        const feePercentage = (listingPlan === "shield" || listingPlan === "featured" || orderHasShield) ? 0.10 : 0.05;
        const orderAmount = Number(amount);
        const platformFee = Math.round(orderAmount * feePercentage);
        const sellerPayout = orderAmount - platformFee;

        await recordWalletTransaction({
          userId: sellerIdFromOrder,
          orderId,
          type: "ESCROW_RELEASE",
          amount: sellerPayout,
          escrowAmount: orderAmount,
          description: `Escrow release for order ${orderId.slice(0, 6)}`,
          metadata: { buyerId, orderId, platformFee, feePercentage, grossAmount: orderAmount },
        });

        await recordWalletTransaction({
          userId: sellerIdFromOrder,
          orderId,
          type: "PLATFORM_FEE",
          amount: platformFee,
          description: `Platform fee for order ${orderId.slice(0, 6)} (${orderHasShield ? "Featured" : "Standard"})`,
          metadata: { buyerId, orderId, feePercentage, grossAmount: orderAmount },
        });
      }

      await adminDb.collection("chats").add({
        orderId,
        senderId: "SYSTEM",
        senderName: "System Guard",
        text: "Buyer confirmed delivery. Escrow funds released to the seller.",
        isSystemMessage: true,
        buyerId,
        sellerId: sellerIdFromOrder,
        createdAt: new Date(),
      });

      await sendNotification({
        userId: sellerIdFromOrder,
        orderId,
        title: "Payment Released",
        message: "Buyer has confirmed delivery. Escrow funds have been released to your wallet.",
        type: "ORDER_COMPLETED",
      });

      return NextResponse.json({ success: true });
    } catch (completionError) {
      console.error("[ORDER_COMPLETE_ERROR]:", completionError);
      return NextResponse.json(
        { error: `Failed to complete order: ${completionError instanceof Error ? completionError.message : "Unknown error"}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to complete order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to complete order: ${errorMessage}` }, { status: 500 });
  }
}
