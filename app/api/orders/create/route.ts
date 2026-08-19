import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      listingId,
      title,
      amount,
      sellerName,
      sellerId,
      sellerVerified,
      hasShieldProtection,
      buyerId,
      rank,
      skinsCount,
      paymentReference,
    } = body;

    console.log("Order creation request:", { listingId, title, amount, buyerId, sellerId, paymentReference });

    if (!listingId || !title || !amount || !buyerId || !sellerId || !paymentReference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      console.error("Admin Firestore not initialized");
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const orderRef = await adminDb.collection("orders").add({
      listingId,
      title,
      amount,
      sellerName: sellerName || "Seller",
      sellerId,
      sellerVerified: Boolean(sellerVerified),
      hasShieldProtection: Boolean(hasShieldProtection),
      buyerId,
      status: "IN_ESCROW",
      rank: rank || "",
      skinsCount: skinsCount || 0,
      paymentReference,
      paidAt: new Date(),
      createdAt: new Date(),
    });

    await adminDb.collection("listings").doc(listingId).update({ status: "sold" });

    await adminDb.collection("chats").add({
      orderId: orderRef.id,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: `🔒 Escrow Funds locked in Vault. Awaiting seller credential delivery.`,
      isSystemMessage: true,
      createdAt: new Date(),
    });

    if (sellerId) {
      await adminDb.collection("notifications").add({
        userId: sellerId,
        title: "Payment received",
        message: `A buyer paid for ${title || "your account listing"}. Credentials are now required.`,
        type: "ESCROW_LOCKED",
        orderId: orderRef.id,
        read: false,
        createdAt: new Date(),
      });
    }

    console.log("Order created successfully:", orderRef.id);
    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Server-side order creation error:", errorMessage, error);
    return NextResponse.json(
      { 
        error: "Failed to create order. Please contact support.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
