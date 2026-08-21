import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";

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

    await orderRef.update({
      status: "COMPLETED",
      completedAt: new Date(),
    });

    if (sellerId && amount) {
      const orderHasShield = Boolean(orderData?.hasShieldProtection);
      const feePercentage = orderHasShield ? 0.10 : 0.05;
      const orderAmount = Number(amount);
      const platformFee = orderAmount * feePercentage;
      const netPayout = orderAmount - platformFee;

      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "ESCROW_RELEASE",
        amount: netPayout,
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

    await adminDb.collection("chats").add({
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Buyer confirmed delivery. Escrow funds released to the seller.",
      isSystemMessage: true,
      createdAt: new Date(),
    });

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Payment Released",
        message: "Buyer has confirmed delivery. Escrow funds have been released to your wallet.",
        type: "ORDER_COMPLETED",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to complete order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to complete order: ${errorMessage}` }, { status: 500 });
  }
}
