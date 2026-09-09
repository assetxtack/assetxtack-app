import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendUrgentReminderEmail } from "@/lib/email/sendUrgentReminderEmail";
import { sendAutoRefundEmail } from "@/lib/email/sendAutoRefundEmail";
import { sendDisputeResolvedEmail } from "@/lib/email/sendDisputeResolvedEmail";

export const dynamic = "force-dynamic";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const CRON_SECRET = process.env.CRON_SECRET;

function parseTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  const parsed = new Date(ts as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

async function cancelExpiredOrder(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const buyerId = String(orderData.buyerId || "");
  const sellerId = String(orderData.sellerId || "");
  const amount = Number(orderData.amount || 0);
  const title = String(orderData.title || "Unknown listing");

  try {
    const batch = adminDb.batch();

    const orderRef = adminDb.collection("orders").doc(orderId);
    batch.update(orderRef, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      refundedAt: new Date(),
      cancellationReason: "Phase 1 expiration: Seller failed to deliver credentials within 24 hours",
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_CANCEL_PHASE1",
      amount,
      buyerId,
      sellerId,
      reason: "Timer expired: AWAITING_CREDENTIALS > 24h",
      createdAt: new Date(),
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Order auto-cancelled: Seller did not deliver credentials within 24 hours. Buyer has been refunded.",
      isSystemMessage: true,
      buyerId,
      sellerId,
      createdAt: new Date(),
    });

    await batch.commit();

    if (buyerId && amount > 0) {
      await recordWalletTransaction({
        userId: buyerId,
        orderId,
        type: "REFUND",
        amount,
        escrowAmount: amount,
        description: `Refund for cancelled order: ${title}`,
        metadata: {
          reason: "Phase 1 auto-cancellation",
          sellerId,
          originalAmount: amount,
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
        description: `Escrow cancelled for expired order: ${title}`,
        metadata: {
          reason: "Phase 1 auto-cancellation",
          buyerId,
          originalAmount: amount,
        },
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Order Cancelled & Refunded",
        message: `Your order for "${title}" was auto-cancelled. ₦${amount.toLocaleString()} has been refunded to your wallet.`,
        type: "ESCROW_LOCKED",
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Order Auto-Cancelled",
        message: `Your order for "${title}" was auto-cancelled because credentials were not delivered within 24 hours.`,
        type: "ESCROW_LOCKED",
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to cancel expired order ${orderId}:`, error);
    return false;
  }
}

async function completeExpiredInspection(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const buyerId = String(orderData.buyerId || "");
  const sellerId = String(orderData.sellerId || "");
  const amount = Number(orderData.amount || 0);
  const title = String(orderData.title || "Unknown listing");
  const listingPlan = String(orderData.listingPlan || "");
  const orderHasShield = Boolean(orderData.hasShieldProtection);

  try {
    const feePercentage =
      listingPlan === "shield" || listingPlan === "featured" || orderHasShield
        ? 0.1
        : 0.05;
    const platformFee = Math.round(amount * feePercentage);
    const sellerPayout = amount - platformFee;

    const batch = adminDb.batch();

    const orderRef = adminDb.collection("orders").doc(orderId);
    batch.update(orderRef, {
      status: "COMPLETED",
      completedAt: new Date(),
      completionReason: "Phase 2 expiration: Buyer did not inspect within 24 hours",
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_COMPLETE_PHASE2",
      amount,
      sellerPayout,
      platformFee,
      buyerId,
      sellerId,
      reason: "Timer expired: INSPECTION_PERIOD > 24h",
      createdAt: new Date(),
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Inspection period expired. Funds have been auto-released to the seller.",
      isSystemMessage: true,
      buyerId,
      sellerId,
      createdAt: new Date(),
    });

    await batch.commit();

    if (sellerId && amount > 0) {
      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "ESCROW_RELEASE",
        amount: sellerPayout,
        escrowAmount: amount,
        description: `Escrow release for order ${orderId.slice(0, 6)} (auto-completed)`,
        metadata: {
          buyerId,
          orderId,
          platformFee,
          feePercentage,
          grossAmount: amount,
          autoCompleted: true,
        },
      });

      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "PLATFORM_FEE",
        amount: platformFee,
        description: `Platform fee for order ${orderId.slice(0, 6)} (auto-completed)`,
        metadata: {
          buyerId,
          orderId,
          feePercentage,
          grossAmount: amount,
        },
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Funds Released",
        message: `Buyer inspection period expired. ₦${sellerPayout.toLocaleString()} has been released to your wallet for "${title}".`,
        type: "ORDER_COMPLETED",
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Order Completed",
        message: `Your order for "${title}" has been auto-completed. Funds have been released to the seller.`,
        type: "ORDER_COMPLETED",
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to complete expired inspection for order ${orderId}:`, error);
    return false;
  }
}

async function resolveDisputedPhase1AutoRelease(
  orderId: string,
  orderData: Record<string, unknown>
): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const isTimerFrozen = Boolean(orderData.isTimerFrozen);
  if (isTimerFrozen) {
    console.log(`[CRON] Order ${orderId}: Phase 1 timer is frozen, skipping auto-release`);
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

    console.log(`[CRON] Order ${orderId}: Phase 1 auto-release completed — funds released to seller`);
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
    console.log(`[CRON] Order ${orderId}: Phase 2 timer is frozen, skipping auto-refund`);
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

    console.log(`[CRON] Order ${orderId}: Phase 2 auto-refund completed — funds returned to buyer`);
    return true;
  } catch (error) {
    console.error(`Failed to auto-refund dispute Phase 2 for order ${orderId}:`, error);
    return false;
  }
}

async function sendDisputeReminder(
  orderId: string,
  orderData: Record<string, unknown>,
  phase: 1 | 2,
  hoursRemaining: number
): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return;

  const buyerId = String(orderData.buyerId || "");
  const sellerId = String(orderData.sellerId || "");
  const title = String(orderData.title || "Unknown listing");

  const flags = (orderData.reminderFlags as Record<string, boolean>) || {};
  const flagKey = phase === 1 ? `disputeP1_${hoursRemaining}h` : `disputeP2_${hoursRemaining}h`;
  if (flags[flagKey]) return;

  const targetUserId = phase === 1 ? buyerId : sellerId;
  if (targetUserId) {
    await sendUrgentReminderEmail({
      userId: targetUserId,
      orderId,
      listingTitle: title,
      hoursRemaining,
    });

    await adminDb.collection("orders").doc(orderId).update({
      [`reminderFlags.${flagKey}`]: true,
    });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  const now = Date.now();
  const results = {
    phase1Cancelled: 0,
    phase2Completed: 0,
    disputePhase1Released: 0,
    disputePhase2Refunded: 0,
    disputeRemindersSent: 0,
    reminder12hSent: 0,
    reminder2hSent: 0,
    errors: [] as string[],
  };

  const nowDate = new Date();

  try {
    const phase1Cutoff = new Date(now - TWENTY_FOUR_HOURS_MS);
    const phase1Query = await adminDb
      .collection("orders")
      .where("status", "==", "AWAITING_CREDENTIALS")
      .where("paymentVerifiedAt", "<", phase1Cutoff)
      .get();

    for (const doc of phase1Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (orderData.status === "DISPUTED") continue;

      const success = await cancelExpiredOrder(doc.id, orderData);
      if (success) {
        results.phase1Cancelled++;
      } else {
        results.errors.push(`Failed to cancel order ${doc.id}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 1 query error: ${msg}`);
    console.error("Phase 1 expiration error:", error);
  }

  try {
    const phase2Cutoff = new Date(now - TWENTY_FOUR_HOURS_MS);
    const phase2Query = await adminDb
      .collection("orders")
      .where("status", "==", "INSPECTION_PERIOD")
      .where("credentialsDeliveredAt", "<", phase2Cutoff)
      .get();

    for (const doc of phase2Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (orderData.status === "DISPUTED") continue;

      const success = await completeExpiredInspection(doc.id, orderData);
      if (success) {
        results.phase2Completed++;
      } else {
        results.errors.push(`Failed to complete order ${doc.id}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 2 query error: ${msg}`);
    console.error("Phase 2 expiration error:", error);
  }

  try {
    const disputeQuery = await adminDb
      .collection("orders")
      .where("status", "==", "DISPUTED")
      .get();

    for (const doc of disputeQuery.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (Boolean(orderData.isTimerFrozen)) continue;

      const reclamationDeadline = parseTimestamp(orderData.disputeReclamationDeadline);
      if (!reclamationDeadline) continue;

      const elapsed = nowDate.getTime() - reclamationDeadline.getTime();
      const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
      const orderId = doc.id;
      const buyerId = String(orderData.buyerId || "");

      if (remaining <= 0) {
        const success = await resolveDisputedPhase1AutoRelease(orderId, orderData);
        if (success) {
          results.disputePhase1Released++;
        } else {
          results.errors.push(`Failed to resolve dispute Phase 1 for order ${orderId}`);
        }
        continue;
      }

      if (remaining <= FOUR_HOURS_MS && buyerId) {
        await sendDisputeReminder(orderId, orderData, 1, 4);
        results.disputeRemindersSent++;
      } else if (remaining <= ONE_HOUR_MS && buyerId) {
        await sendDisputeReminder(orderId, orderData, 1, 1);
        results.disputeRemindersSent++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Dispute Phase 1 query error: ${msg}`);
    console.error("Dispute Phase 1 expiration error:", error);
  }

  try {
    const returnedQuery = await adminDb
      .collection("orders")
      .where("status", "==", "RETURNED_CREDENTIALS")
      .get();

    for (const doc of returnedQuery.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (Boolean(orderData.isTimerFrozen)) continue;

      const verificationDeadline = parseTimestamp(orderData.sellerVerificationDeadline);
      if (!verificationDeadline) continue;

      const elapsed = nowDate.getTime() - verificationDeadline.getTime();
      const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
      const orderId = doc.id;
      const sellerId = String(orderData.sellerId || "");

      if (remaining <= 0) {
        const success = await resolveDisputedPhase2AutoRefund(orderId, orderData);
        if (success) {
          results.disputePhase2Refunded++;
        } else {
          results.errors.push(`Failed to resolve dispute Phase 2 for order ${orderId}`);
        }
        continue;
      }

      if (remaining <= FOUR_HOURS_MS && sellerId) {
        await sendDisputeReminder(orderId, orderData, 2, 4);
        results.disputeRemindersSent++;
      } else if (remaining <= ONE_HOUR_MS && sellerId) {
        await sendDisputeReminder(orderId, orderData, 2, 1);
        results.disputeRemindersSent++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Dispute Phase 2 query error: ${msg}`);
    console.error("Dispute Phase 2 expiration error:", error);
  }

  return NextResponse.json({
    success: true,
    processedAt: new Date().toISOString(),
    ...results,
  });
}
