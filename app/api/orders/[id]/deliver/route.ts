import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { sendCredentialsDeliveredEmail } from "@/lib/email/sendCredentialsDeliveredEmail";

export const dynamic = "force-dynamic";

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
      status: "INSPECTION_PERIOD",
      credentials,
      deliveryNotes: deliveryNotes || "",
      credentialsDeliveredAt: new Date(),
      deliveredAt: new Date(),
    });

    const orderBuyerId = orderData?.buyerId || buyerId;
    const orderSellerId = orderData?.sellerId || sellerId;
    const listingTitle = orderData?.title || "";

    if (orderBuyerId && listingTitle) {
      const buyerSnap = await adminDb.collection("users").doc(orderBuyerId).get();
      const buyerData = buyerSnap.exists ? buyerSnap.data() : null;
      const buyerEmail = String(buyerData?.email || "").trim();

      console.log("Fetched buyerEmail from Firestore:", buyerEmail);

      console.log("Attempting to send credentials-delivered email to:", buyerEmail, { orderId, listingTitle });

      if (buyerEmail) {
        await sendCredentialsDeliveredEmail({
          buyerEmail,
          orderId,
          listingTitle,
        });
      }
    }

    await adminDb.collection("chats").add({
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Seller has submitted account credentials. Buyer has 24 hours to inspect and verify. Funds auto-release when timer ends.",
      isSystemMessage: true,
      buyerId: orderBuyerId,
      sellerId: orderSellerId,
      createdAt: new Date(),
    });

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Credentials delivered",
        message: "Seller has submitted account credentials. You have 24 hours to inspect and verify the account.",
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
