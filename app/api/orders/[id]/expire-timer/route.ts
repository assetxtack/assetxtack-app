import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendDisputeResolvedEmail } from "@/lib/email/sendDisputeResolvedEmail";
import { sendAutoRefundEmail } from "@/lib/email/sendAutoRefundEmail";

export const dynamic = "force-dynamic";

function parseTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  const parsed = new Date(ts as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

async function resolveDisputedPhase1AutoRelease(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const isTimerFrozen = Boolean(orderData.isTimerFrozen);
  if (isTimerFrozen) {
    console.log(`[expire-timer] Order ${orderId}: Phase 1 timer is frozen, skipping auto-release`);
    return false;
  }

  const buyerId = String(orderData.buyerId || "");
  const sellerId = String(orderData.sellerId || "");
  const amount = Number(orderData.amount || 0);
  const title = String(orderData.title || "Unknown listing");
  const credentials = String(orderData.credentials || "");
  const returnedCredentials = String(orderData.returnedCredentials || "");
  const deliveryNotes = String(orderData.deliveryNotes || "");

  try {
    const batch = adminDb.batch();
    const now = new Date();
    const orderRef = adminDb.collection("orders").doc(orderId);

    batch.update(orderRef, {
      status: "COMPLETED",
      completedAt: now,
      completionReason: "Phase 1 expiration: Buyer failed to return credentials within 24 hours",
      disputeResolution: "Released",
      isChatLocked: true,
      credentials: "",
      returnedCredentials: "",
      deliveryNotes: "",
      credentialsPurgedAt: now,
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_RELEASE_PHASE1_DISPUTE",
      amount,
      buyerId,
      sellerId,
      title,
      credentials,
      returnedCredentials,
      deliveryNotes,
      reason: "Timer expired: DISPUTED > disputeReclamationDeadline (buyer failed to return credentials)",
      disputeResolution: "Released to seller",
      createdAt: now,
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Dispute Phase 1 expired: Buyer failed to return credentials within 24 hours. Funds have been auto-released to the seller. All credentials have been archived and purged. Chat locked.",
      isSystemMessage: true,
      buyerId,
      sellerId,
      createdAt: now,
    });

    await batch.commit();

    if (sellerId && amount > 0) {
      const orderAmount = Number(orderData.amount || 0);
      const listingPlan = String(orderData.listingPlan || "");
      const orderHasShield = Boolean(orderData.hasShieldProtection);
      const feePercentage =
        listingPlan === "shield" || listingPlan === "featured" || orderHasShield
          ? 0.1
          : 0.05;
      const platformFee = Math.round(orderAmount * feePercentage);
      const sellerPayout = orderAmount - platformFee;

      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "ESCROW_RELEASE",
        amount: sellerPayout,
        escrowAmount: orderAmount,
        description: `Escrow release (dispute auto-resolve): ${title}`,
        metadata: {
          reason: "Buyer failed to return credentials within dispute window",
          buyerId,
          orderId,
          platformFee,
          feePercentage,
          grossAmount: orderAmount,
          autoResolved: true,
        },
      });

      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "PLATFORM_FEE",
        amount: platformFee,
        description: `Platform fee (dispute auto-resolve): ${title.slice(0, 30)}`,
        metadata: { buyerId, orderId, feePercentage, grossAmount: orderAmount },
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Dispute Resolved — Funds Released",
        message: `Buyer did not return credentials within 24 hours. ₦${amount.toLocaleString()} has been released to your wallet.`,
        type: "ORDER_COMPLETED",
      });

      await sendDisputeResolvedEmail({
        userId: sellerId,
        orderId,
        listingTitle: title,
        resolution: "Buyer failed to return credentials within the 24-hour dispute window. Funds released to seller.",
        amount: 0,
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Dispute Resolved — Funds Released to Seller",
        message: `You did not return credentials within 24 hours. The dispute has been resolved in favor of the seller.`,
        type: "DISPUTE",
      });

      await sendDisputeResolvedEmail({
        userId: buyerId,
        orderId,
        listingTitle: title,
        resolution: "Buyer failed to return credentials within the 24-hour dispute window. Funds released to seller.",
        amount,
      });
    }

    console.log(`[expire-timer] Order ${orderId}: Phase 1 auto-release completed — funds released to seller`);
    return true;
  } catch (error) {
    console.error(`Failed to auto-release dispute Phase 1 for order ${orderId}:`, error);
    return false;
  }
}

async function resolveDisputedPhase2AutoRefund(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const isTimerFrozen = Boolean(orderData.isTimerFrozen);
  if (isTimerFrozen) {
    console.log(`[expire-timer] Order ${orderId}: Phase 2 timer is frozen, skipping auto-refund`);
    return false;
  }

  const buyerId = String(orderData.buyerId || "");
  const sellerId = String(orderData.sellerId || "");
  const amount = Number(orderData.amount || 0);
  const title = String(orderData.title || "Unknown listing");
  const credentials = String(orderData.credentials || "");
  const returnedCredentials = String(orderData.returnedCredentials || "");
  const deliveryNotes = String(orderData.deliveryNotes || "");

  try {
    const batch = adminDb.batch();
    const now = new Date();
    const orderRef = adminDb.collection("orders").doc(orderId);

    batch.update(orderRef, {
      status: "CANCELLED",
      cancelledAt: now,
      refundedAt: now,
      cancellationReason: "Phase 2 expiration: Seller did not verify account security within 24 hours",
      disputeResolution: "Refunded",
      isChatLocked: true,
      credentials: "",
      returnedCredentials: "",
      deliveryNotes: "",
      credentialsPurgedAt: now,
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_REFUND_PHASE2_DISPUTE",
      amount,
      buyerId,
      sellerId,
      title,
      credentials,
      returnedCredentials,
      deliveryNotes,
      reason: "Timer expired: RETURNED_CREDENTIALS > sellerVerificationDeadline (seller failed to verify)",
      disputeResolution: "Refunded to buyer",
      createdAt: now,
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Dispute Phase 2 expired: Seller did not verify account security within 24 hours. Full refund processed to the buyer. All credentials have been archived and purged. Chat locked.",
      isSystemMessage: true,
      buyerId,
      sellerId,
      createdAt: now,
    });

    await batch.commit();

    if (buyerId && amount > 0) {
      await recordWalletTransaction({
        userId: buyerId,
        orderId,
        type: "REFUND",
        amount: amount,
        escrowAmount: amount,
        description: `Refund (dispute auto-resolve): ${title}`,
        metadata: {
          reason: "Seller failed to verify account within dispute window",
          sellerId,
          orderId,
          originalAmount: amount,
          autoResolved: true,
        },
      });
    }

    if (sellerId && amount > 0) {
      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "ESCROW_CANCELLED",
        amount: 0,
        escrowAmount: amount,
        description: `Escrow cancelled (dispute auto-resolve): ${title.slice(0, 30)}`,
        metadata: {
          reason: "Seller failed to verify account within dispute window",
          buyerId,
          orderId,
          originalAmount: amount,
        },
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Dispute Resolved — Refunded",
        message: `Seller did not verify account security within 24 hours. ₦${amount.toLocaleString()} has been refunded to your wallet.`,
        type: "DISPUTE",
      });

      await sendAutoRefundEmail({
        userId: buyerId,
        orderId,
        listingTitle: title,
        reason: "Seller failed to verify account security within the 24-hour dispute window",
        amount,
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Dispute Resolved — Refund Processed",
        message: `You did not verify account security within 24 hours. The buyer has been refunded ₦${amount.toLocaleString()}.`,
        type: "DISPUTE",
      });

      await sendAutoRefundEmail({
        userId: sellerId,
        orderId,
        listingTitle: title,
        reason: "You did not verify account security within the dispute window. Buyer refunded automatically.",
        amount,
      });
    }

    console.log(`[expire-timer] Order ${orderId}: Phase 2 auto-refund completed — funds returned to buyer`);
    return true;
  } catch (error) {
    console.error(`Failed to auto-refund dispute Phase 2 for order ${orderId}:`, error);
    return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { phase } = body as { phase?: "phase1" | "phase2" };

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

    const orderData = orderSnap.data() as Record<string, unknown>;
    const currentStatus = String(orderData.status || "");

    // Idempotency guard: if already resolved, return success no-op
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      return NextResponse.json({ success: true, alreadyResolved: true });
    }

    const now = new Date();
    const reclamationDeadline = parseTimestamp(orderData.disputeReclamationDeadline);
    const verificationDeadline = parseTimestamp(orderData.sellerVerificationDeadline);

    // Phase 1: DISPUTED -> buyer failed to return credentials
    if (currentStatus === "DISPUTED" && (phase === "phase1" || (reclamationDeadline && now.getTime() > reclamationDeadline.getTime()))) {
      const success = await resolveDisputedPhase1AutoRelease(orderId, orderData);
      if (!success) {
        return NextResponse.json({ error: "Failed to resolve dispute Phase 1" }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "phase1_auto_release" });
    }

    // Phase 2: RETURNED_CREDENTIALS -> seller failed to verify
    if (currentStatus === "RETURNED_CREDENTIALS" && (phase === "phase2" || (verificationDeadline && now.getTime() > verificationDeadline.getTime()))) {
      const success = await resolveDisputedPhase2AutoRefund(orderId, orderData);
      if (!success) {
        return NextResponse.json({ error: "Failed to resolve dispute Phase 2" }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "phase2_auto_refund" });
    }

    // Not expired or not in a disputable state
    return NextResponse.json({ success: true, action: "not_expired", status: currentStatus });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to process timer expiration:", errorMessage, error);
    return NextResponse.json({ error: `Failed to process timer expiration: ${errorMessage}` }, { status: 500 });
  }
}