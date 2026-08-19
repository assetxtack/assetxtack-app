import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

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
      const sellerRef = adminDb.collection("users").doc(sellerId);
      await sellerRef.set({
        walletBalance: Number(amount) || 0,
      }, { merge: true });
    }

    await adminDb.collection("chats").add({
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Buyer confirmed delivery. Escrow funds released to the seller.",
      isSystemMessage: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to complete order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to complete order: ${errorMessage}` }, { status: 500 });
  }
}
