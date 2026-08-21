import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, buyerId, sellerId, credentials, deliveryNotes } = body;

    if (!orderId || !sellerId || !credentials) {
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
    if (orderData?.sellerId !== sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await orderRef.update({
      status: "DELIVERED",
      credentials,
      deliveryNotes: deliveryNotes || "",
      deliveredAt: new Date(),
    });

    await adminDb.collection("chats").add({
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Seller has submitted account credentials. Buyer, please review and confirm delivery.",
      isSystemMessage: true,
      createdAt: new Date(),
    });

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Credentials delivered",
        message: "Seller has submitted account credentials for your order. Please review and confirm.",
        type: "CREDENTIALS_DELIVERED",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to deliver credentials:", errorMessage, error);
    return NextResponse.json({ error: `Failed to deliver credentials: ${errorMessage}` }, { status: 500 });
  }
}
