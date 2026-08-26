import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";

export const dynamic = "force-dynamic";

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
      listingPlan,
      buyerId,
      rank,
      skinsCount,
      paymentReference,
    } = body;

    console.log("Order creation request:", { listingId, title, amount, buyerId, sellerId, paymentReference });

    const requiredFields: Record<string, unknown> = { listingId, title, amount, buyerId, sellerId, paymentReference };
    for (const [fieldName, fieldValue] of Object.entries(requiredFields)) {
      if (!fieldValue || (typeof fieldValue === "string" && !fieldValue.trim())) {
        return NextResponse.json({ success: false, error: `Missing required field: ${fieldName}` }, { status: 400 });
      }
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      console.error("Admin Firestore not initialized");
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 });
    }

    const ordersRef = adminDb.collection("orders");
    const listingsRef = adminDb.collection("listings");
    const chatsRef = adminDb.collection("chats");

    const orderRef = await ordersRef.add({
      listingId,
      title,
      amount,
      sellerName: sellerName || "Seller",
      sellerId,
      sellerVerified: Boolean(sellerVerified),
      hasShieldProtection: Boolean(hasShieldProtection),
      listingPlan: listingPlan || (Boolean(hasShieldProtection) ? "shield" : "standard"),
      buyerId,
      status: "IN_ESCROW",
      rank: rank || "",
      skinsCount: skinsCount || 0,
      paymentReference,
      paidAt: new Date(),
      createdAt: new Date(),
    });

    await listingsRef.doc(listingId).update({ status: "sold" });

    await chatsRef.add({
      orderId: orderRef.id,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: `🔒 Escrow Funds locked in Vault. Awaiting seller credential delivery.`,
      isSystemMessage: true,
      buyerId,
      sellerId,
      createdAt: new Date(),
    });

    if (sellerId && amount) {
      await recordWalletTransaction({
        userId: sellerId,
        orderId: orderRef.id,
        type: "ESCROW_LOCK",
        amount: Number(amount),
        description: `Escrow lock for ${title || "listing"}`,
        metadata: { listingId, sellerId, paymentReference },
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId: orderRef.id,
        title: "Payment received",
        message: `A buyer paid for ${title || "your account listing"}. Credentials are now required.`,
        type: "ESCROW_LOCKED",
      });
    }

    console.log("Order created successfully:", orderRef.id);
    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error during order creation";
    console.error("Server-side order creation error:", errorMessage, error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
