import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendDisputeEmail } from "@/lib/email/sendDisputeEmail";
import { sendOrderCompletedEmail } from "@/lib/email/sendOrderCompletedEmail";
import { sendCredentialsReturnedEmail } from "@/lib/email/sendCredentialsReturnedEmail";

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
    const {
      orderId,
      status,
      completedAt,
      disputedAt,
      initiatorId,
      disputeReason,
      disputeDetails,
      disputeImageUrl,
      returnedCredentials,
      returnedCredentialsAt,
      isTimerFrozen,
    } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const validStatuses = ["IN_ESCROW", "AWAITING_CREDENTIALS", "INSPECTION_PERIOD", "DELIVERED", "COMPLETED", "DISPUTED", "CANCELLED", "ADMIN_INTERVENTION", "RETURNED_CREDENTIALS"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
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
    const listingTitle = String(orderData.title || "Unknown listing");

    const updateData: Record<string, unknown> = { status };
    if (isTimerFrozen !== undefined) {
      updateData.isTimerFrozen = Boolean(isTimerFrozen);
    }
    if (status === "COMPLETED" && completedAt) {
      updateData.completedAt = new Date(completedAt);
    }
    if (status === "DISPUTED" && disputedAt) {
      updateData.disputedAt = new Date(disputedAt);
      updateData.disputeRaisedAt = new Date(disputedAt);
      const reclamationDeadline = new Date(disputedAt);
      reclamationDeadline.setHours(reclamationDeadline.getHours() + 24);
      updateData.disputeReclamationDeadline = reclamationDeadline;
      updateData.isTimerFrozen = false;
      if (disputeReason) {
        updateData.disputeReason = disputeReason;
      }
      if (disputeDetails) {
        updateData.disputeDetails = disputeDetails;
      }
      if (disputeImageUrl) {
        updateData.disputeImageUrl = disputeImageUrl;
      }
    }
    if (status === "RETURNED_CREDENTIALS" && returnedCredentials) {
      updateData.returnedCredentials = returnedCredentials;
      updateData.returnedCredentialsAt = returnedCredentialsAt ? new Date(returnedCredentialsAt) : new Date();
      const verificationDeadline = new Date(returnedCredentialsAt || new Date());
      verificationDeadline.setHours(verificationDeadline.getHours() + 24);
      updateData.sellerVerificationDeadline = verificationDeadline;
    }
    if (status === "ADMIN_INTERVENTION") {
      updateData.adminInterventionAt = new Date();
    }

    const now = new Date();
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

      const sellerSnap = await adminDb.collection("users").doc(sellerId).get();
      const sellerData = sellerSnap.exists ? sellerSnap.data() : null;
      const sellerEmail = String(sellerData?.email || "").trim();

      console.log("Checking sellerId for order-completed email:", sellerId);
      console.log("Fetched sellerEmail from Firestore:", sellerEmail);

      await sendOrderCompletedEmail({
        sellerId,
        orderId,
        listingTitle: String(orderData.title || ""),
        payoutAmount: sellerPayout,
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

        const oppositeSnap = await adminDb.collection("users").doc(oppositeParty).get();
        const oppositeData = oppositeSnap.exists ? oppositeSnap.data() : null;
        const oppositeEmail = String(oppositeData?.email || "").trim();

        console.log("Checking oppositePartyId for dispute email:", oppositeParty);
        console.log("Fetched oppositeEmail from Firestore:", oppositeEmail);

        await sendDisputeEmail({
          userId: oppositeParty,
          orderId,
          listingTitle: String(orderData.title || ""),
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

        const initiatorSnap = await adminDb.collection("users").doc(initiatorId).get();
        const initiatorData = initiatorSnap.exists ? initiatorSnap.data() : null;
        const initiatorEmail = String(initiatorData?.email || "").trim();

        console.log("Checking initiatorId for dispute email:", initiatorId);
        console.log("Fetched initiatorEmail from Firestore:", initiatorEmail);

        await sendDisputeEmail({
          userId: String(initiatorId),
          orderId,
          listingTitle: String(orderData.title || ""),
        });
      }
    }

    if (status === "RETURNED_CREDENTIALS") {
      console.log(`[orders PATCH] Credentials returned for order ${orderId?.slice(0, 8)}, sending notifications and system chat message`);

      const systemChatPayload: Record<string, unknown> = {
        orderId,
        senderId: "SYSTEM",
        senderName: "System Guard",
        text: "Buyer has returned account credentials. Seller has 24 hours to verify account security and confirm. If the seller does not verify within 24 hours, a full refund will be processed automatically.",
        imageUrl: null,
        isSystemMessage: true,
        isRedacted: false,
        buyerId,
        sellerId,
        createdAt: now,
      };

      try {
        await adminDb.collection("chats").add(systemChatPayload);
      } catch (chatErr) {
        console.error("[orders PATCH] Failed to post system chat message for RETURNED_CREDENTIALS:", chatErr);
      }

      if (sellerId) {
        await sendNotification({
          userId: sellerId,
          orderId,
          title: "Credentials Returned",
          message: "The buyer has returned credentials. You have 24 hours to verify account security.",
          type: "DISPUTE",
        });

        await sendCredentialsReturnedEmail({
          userId: sellerId,
          orderId,
          listingTitle,
        });
      }

      if (buyerId) {
        await sendNotification({
          userId: buyerId,
          orderId,
          title: "Credentials Returned to Seller",
          message: "You have returned the account credentials. The seller now has 24 hours to verify account security.",
          type: "DISPUTE",
        });
      }
    }

    if (status === "ADMIN_INTERVENTION") {
      if (buyerId) {
        await sendNotification({
          userId: buyerId,
          orderId,
          title: "Admin Intervention Required",
          message: "An admin has been assigned to review this dispute. Please cooperate with the investigation.",
          type: "DISPUTE",
        });
      }
      if (sellerId) {
        await sendNotification({
          userId: sellerId,
          orderId,
          title: "Admin Intervention Required",
          message: "An admin has been assigned to review this dispute. Please cooperate with the investigation.",
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
