import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendDisputeResolvedEmail } from "@/lib/email/sendDisputeResolvedEmail";

export const dynamic = "force-dynamic";

interface VerificationChecklist {
  assetIntegrity: boolean;
  credentialSecurity: boolean;
  noUnauthorizedBinding: boolean;
}

function isValidChecklist(checklist: unknown): checklist is VerificationChecklist {
  if (typeof checklist !== "object" || checklist === null) return false;
  const c = checklist as Record<string, unknown>;
  return (
    typeof c.assetIntegrity === "boolean" &&
    typeof c.credentialSecurity === "boolean" &&
    typeof c.noUnauthorizedBinding === "boolean"
  );
}

export async function POST(request: Request) {
  const requestId = `account-secured-${Date.now()}`;
  try {
    console.log(`[${requestId}] === POST /api/orders/[id]/account-secured START ===`);

    const body = await request.json();
    const { orderId, sellerId, amount, verificationChecklist } = body;

    console.log(`[${requestId}] Body extracted:`, {
      orderId: String(orderId).slice(0, 8) + "...",
      sellerId: String(sellerId).slice(0, 8) + "...",
      hasChecklist: !!verificationChecklist,
      amount,
    });

    if (!orderId || !sellerId) {
      console.error(`[${requestId}] Validation failed: missing orderId or sellerId`);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!verificationChecklist || !isValidChecklist(verificationChecklist)) {
      console.error(`[${requestId}] Validation failed: invalid or missing verification checklist`);
      return NextResponse.json(
        { error: "Verification checklist is required and must include all 3 safety checks" },
        { status: 400 }
      );
    }

    const checklist = verificationChecklist as VerificationChecklist;
    if (!checklist.assetIntegrity || !checklist.credentialSecurity || !checklist.noUnauthorizedBinding) {
      console.error(`[${requestId}] Validation failed: not all checklist items checked`, checklist);
      return NextResponse.json(
        { error: "All 3 safety checklist items must be confirmed" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      console.error(`[${requestId}] getAdminFirestore() returned null`);
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error(`[${requestId}] Order not found: ${orderId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data() as Record<string, unknown>;
    if (orderData.sellerId !== sellerId) {
      console.error(`[${requestId}] Unauthorized: sellerId mismatch`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const validStatuses = ["DISPUTED", "RETURNED_CREDENTIALS"];
    if (!validStatuses.includes(String(orderData.status))) {
      console.error(`[${requestId}] Order status not valid for this action: ${orderData.status}`);
      return NextResponse.json(
        { error: "Order must be in DISPUTED or RETURNED_CREDENTIALS status" },
        { status: 400 }
      );
    }

    const buyerId = String(orderData.buyerId || "");
    const sellerIdFromOrder = String(orderData.sellerId || "");
    const orderAmount = Number(orderData.amount || amount || 0);
    const title = String(orderData.title || "Unknown listing");
    const credentials = String(orderData.credentials || "");
    const returnedCredentials = String(orderData.returnedCredentials || "");
    const deliveryNotes = String(orderData.deliveryNotes || "");

    const now = new Date();
    const batch = adminDb.batch();

    console.log(`[${requestId}] Archiving sensitive data to escrowAudit collection`);
    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "SELLER_ACCOUNT_SECURED_REFUND",
      amount: orderAmount,
      buyerId: buyerId,
      sellerId: sellerIdFromOrder,
      title,
      originalCredentials: credentials,
      returnedCredentials,
      deliveryNotes,
      verificationChecklist: checklist,
      disputeReclamationDeadline: orderData.disputeReclamationDeadline || null,
      sellerVerificationDeadline: orderData.sellerVerificationDeadline || null,
      credentialsDeliveredAt: orderData.credentialsDeliveredAt || null,
      returnedCredentialsAt: orderData.returnedCredentialsAt || null,
      disputedAt: orderData.disputedAt || null,
      accountSecuredAt: now,
      resolution: "Seller confirmed account secured; funds refunded to buyer",
      createdAt: now,
    });

    console.log(`[${requestId}] Updating order: status=CANCELLED, credentials purged, chat locked`);
    batch.update(orderRef, {
      status: "CANCELLED",
      cancelledAt: now,
      refundedAt: now,
      accountSecuredAt: now,
      cancellationReason: "Seller authorized buyer refund: account secured via verification during dispute reclamation",
      disputeResolution: "Refunded",
      isChatLocked: true,
      credentials: "",
      returnedCredentials: "",
      deliveryNotes: "",
      credentialsPurgedAt: now,
    });

    console.log(`[${requestId}] Posting system chat notice for dispute resolution`);
    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Dispute resolved: Seller confirmed account security via 3-point verification checklist. Funds have been auto-refunded to the buyer. All shared credentials have been archived and purged. This chat is now locked for security compliance.",
      imageUrl: null,
      isSystemMessage: true,
      isRedacted: false,
      buyerId: buyerId,
      sellerId: sellerIdFromOrder,
      createdAt: now,
    });

    console.log(`[${requestId}] Committing Firestore batch`);
    await batch.commit();
    console.log(`[${requestId}] Batch committed successfully — escrowAudit docId: ${auditRef.id}`);

    if (buyerId && orderAmount > 0) {
      console.log(`[${requestId}] Recording refund transaction for buyer: ${buyerId.slice(0, 8)}`);
      await recordWalletTransaction({
        userId: buyerId,
        orderId,
        type: "REFUND",
        amount: orderAmount,
        escrowAmount: orderAmount,
        description: `Refund for dispute resolution: seller confirmed account secured for "${title}"`,
        metadata: {
          reason: "Seller account secured via 3-point checklist",
          sellerId: sellerIdFromOrder,
          originalAmount: orderAmount,
          checklistConfirmed: true,
        },
      });
    }

    if (sellerIdFromOrder && orderAmount > 0) {
      console.log(`[${requestId}] Recording escrow cancellation for seller: ${sellerIdFromOrder.slice(0, 8)}`);
      await recordWalletTransaction({
        userId: sellerIdFromOrder,
        orderId,
        type: "ESCROW_CANCELLED",
        amount: 0,
        escrowAmount: orderAmount,
        description: `Escrow cancelled — dispute resolved: account secured ("${title}")`,
        metadata: {
          reason: "Seller confirmed account secured; buyer refunded",
          buyerId,
          originalAmount: orderAmount,
        },
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Dispute Resolved — Refunded",
        message: `The seller confirmed account security. ₦${orderAmount.toLocaleString()} has been refunded to your wallet.`,
        type: "DISPUTE",
      });

      await sendDisputeResolvedEmail({
        userId: buyerId,
        orderId,
        listingTitle: title,
        resolution: "Seller confirmed account secured via verification checklist. Full refund processed.",
        amount: orderAmount,
      });
    }

    if (sellerIdFromOrder) {
      await sendNotification({
        userId: sellerIdFromOrder,
        orderId,
        title: "Dispute Resolved",
        message: `You confirmed account security. The buyer has been refunded ₦${orderAmount.toLocaleString()}.`,
        type: "DISPUTE",
      });

      await sendDisputeResolvedEmail({
        userId: sellerIdFromOrder,
        orderId,
        listingTitle: title,
        resolution: "You confirmed account security. Buyer refund processed successfully.",
        amount: orderAmount,
      });
    }

    console.log(`[${requestId}] === POST /api/orders/[id]/account-secured SUCCESS ===`);
    return NextResponse.json({
      success: true,
      orderId,
      archivedToEscrowAudit: true,
      credentialsPurged: true,
      chatLocked: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${requestId}] === POST /api/orders/[id]/account-secured FAILED ===`);
    console.error(`[${requestId}] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`[${requestId}] Error message:`, errorMessage);
    console.error(`[${requestId}] Full error:`, error);

    if (error instanceof Error && error.stack) {
      console.error(`[${requestId}] Stack trace:`, error.stack);
    }

    return NextResponse.json(
      {
        error: `Failed to process account secured: ${errorMessage}`,
        details: {
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 }
    );
  }
}
