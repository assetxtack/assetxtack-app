import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendUrgentReminderEmail } from "@/lib/email/sendUrgentReminderEmail";
import { sendDisputeResolvedEmail } from "@/lib/email/sendDisputeResolvedEmail";
import { sendOrderCompletedEmail } from "@/lib/email/sendOrderCompletedEmail";

export const dynamic = "force-dynamic";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const CRON_SECRET = process.env.CRON_SECRET;

function parseTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && "toDate" in ts && typeof (ts as { toDate: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(ts as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getReminderFlags(orderData: Record<string, unknown>) {
  return (
    (orderData.reminderFlags as Record<string, boolean>) || {
      disputePhase1_4hSent: false,
      disputePhase1_1hSent: false,
      disputePhase2_4hSent: false,
      disputePhase2_1hSent: false,
    }
  );
}

async function expirePhase1ReleaseToSeller(
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
      listingPlan === "shield" || listingPlan === "featured" || orderHasShield ? 0.1 : 0.05;
    const platformFee = Math.round(amount * feePercentage);
    const sellerPayout = amount - platformFee;

    const batch = adminDb.batch();

    const orderRef = adminDb.collection("orders").doc(orderId);
    batch.update(orderRef, {
      status: "COMPLETED",
      completedAt: new Date(),
      completionReason: "Phase 1 expiration: Buyer did not return credentials within 24 hours",
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_RELEASE_PHASE1",
      amount,
      sellerPayout,
      platformFee,
      buyerId,
      sellerId,
      reason: "Timer expired: DISPUTED > 24h (buyer failed to return credentials)",
      createdAt: new Date(),
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Dispute Phase 1 expired: Buyer did not return credentials within 24 hours. Funds have been auto-released to the seller.",
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
        description: `Escrow release for order ${orderId.slice(0, 6)} (dispute phase 1 expired)`,
        metadata: {
          buyerId,
          orderId,
          platformFee,
          feePercentage,
          grossAmount: amount,
          autoCompleted: true,
          reason: "Phase 1 expiration",
        },
      });

      await recordWalletTransaction({
        userId: sellerId,
        orderId,
        type: "PLATFORM_FEE",
        amount: platformFee,
        description: `Platform fee for order ${orderId.slice(0, 6)} (dispute phase 1 expired)`,
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
        message: `Buyer did not return credentials within 24 hours. ₦${sellerPayout.toLocaleString()} has been released to your wallet for "${title}".`,
        type: "ORDER_COMPLETED",
      });

      await sendOrderCompletedEmail({
        sellerId,
        orderId,
        listingTitle: title,
        payoutAmount: sellerPayout,
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Dispute Expired",
        message: `You did not return credentials within 24 hours. Funds have been released to the seller for "${title}".`,
        type: "DISPUTE",
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to expire Phase 1 for order ${orderId}:`, error);
    return false;
  }
}

async function expirePhase2RefundBuyer(
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
      cancellationReason: "Phase 2 expiration: Seller did not verify account security within 24 hours",
      disputeResolution: "Auto-refunded",
    });

    const auditRef = adminDb.collection("escrowAudit").doc();
    batch.set(auditRef, {
      orderId,
      action: "AUTO_REFUND_PHASE2",
      amount,
      buyerId,
      sellerId,
      reason: "Timer expired: RETURNED_CREDENTIALS > 24h (seller failed to verify)",
      createdAt: new Date(),
    });

    const chatRef = adminDb.collection("chats").doc();
    batch.set(chatRef, {
      orderId,
      senderId: "SYSTEM",
      senderName: "System Guard",
      text: "Dispute Phase 2 expired: Seller did not verify account security within 24 hours. A full refund has been processed to the buyer.",
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
        description: `Refund for dispute phase 2 expiration: ${title}`,
        metadata: {
          reason: "Phase 2 auto-refund",
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
        description: `Escrow cancelled for dispute phase 2 expiration: ${title}`,
        metadata: {
          reason: "Phase 2 auto-refund",
          buyerId,
          originalAmount: amount,
        },
      });
    }

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Refund Processed",
        message: `Seller did not verify within 24 hours. ₦${amount.toLocaleString()} has been refunded to your wallet for "${title}".`,
        type: "DISPUTE",
      });

      await sendDisputeResolvedEmail({
        userId: buyerId,
        orderId,
        listingTitle: title,
        resolution: "Seller did not verify account security within 24 hours. Full refund processed.",
        amount,
      });
    }

    if (sellerId) {
      await sendNotification({
        userId: sellerId,
        orderId,
        title: "Dispute Expired",
        message: `You did not verify account security within 24 hours. The buyer has been refunded ₦${amount.toLocaleString()} for "${title}".`,
        type: "DISPUTE",
      });

      await sendDisputeResolvedEmail({
        userId: sellerId,
        orderId,
        listingTitle: title,
        resolution: "You did not verify account security within 24 hours. Buyer refund processed.",
        amount,
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to expire Phase 2 for order ${orderId}:`, error);
    return false;
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
    phase1Released: 0,
    phase2Refunded: 0,
    phase1Reminders: 0,
    phase2Reminders: 0,
    errors: [] as string[],
  };

  try {
    const phase1Query = await adminDb
      .collection("orders")
      .where("status", "==", "DISPUTED")
      .get();

    for (const doc of phase1Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      const orderId = doc.id;
      const title = String(orderData.title || "Unknown listing");
      const buyerId = String(orderData.buyerId || "");

      if (orderData.isTimerFrozen) continue;

      const reclamationDeadline = parseTimestamp(orderData.disputeReclamationDeadline);
      if (!reclamationDeadline) continue;

      const remaining = reclamationDeadline.getTime() - now;
      const reminderFlags = getReminderFlags(orderData);

      if (remaining <= 0) {
        const success = await expirePhase1ReleaseToSeller(orderId, orderData);
        if (success) {
          results.phase1Released++;
        } else {
          results.errors.push(`Failed to expire Phase 1 for order ${orderId}`);
        }
        continue;
      }

      if (remaining <= ONE_HOUR_MS && !reminderFlags.disputePhase1_1hSent && buyerId) {
        await sendUrgentReminderEmail({
          userId: buyerId,
          orderId,
          listingTitle: title,
          hoursRemaining: 1,
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.disputePhase1_1hSent": true,
        });
        results.phase1Reminders++;
      } else if (remaining <= FOUR_HOURS_MS && !reminderFlags.disputePhase1_4hSent && buyerId) {
        await sendUrgentReminderEmail({
          userId: buyerId,
          orderId,
          listingTitle: title,
          hoursRemaining: 4,
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.disputePhase1_4hSent": true,
        });
        results.phase1Reminders++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 1 dispute reclamation error: ${msg}`);
    console.error("Phase 1 dispute reclamation error:", error);
  }

  try {
    const phase2Query = await adminDb
      .collection("orders")
      .where("status", "==", "RETURNED_CREDENTIALS")
      .get();

    for (const doc of phase2Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      const orderId = doc.id;
      const title = String(orderData.title || "Unknown listing");
      const sellerId = String(orderData.sellerId || "");

      if (orderData.isTimerFrozen) continue;

      const verificationDeadline = parseTimestamp(orderData.sellerVerificationDeadline);
      if (!verificationDeadline) continue;

      const remaining = verificationDeadline.getTime() - now;
      const reminderFlags = getReminderFlags(orderData);

      if (remaining <= 0) {
        const success = await expirePhase2RefundBuyer(orderId, orderData);
        if (success) {
          results.phase2Refunded++;
        } else {
          results.errors.push(`Failed to expire Phase 2 for order ${orderId}`);
        }
        continue;
      }

      if (remaining <= ONE_HOUR_MS && !reminderFlags.disputePhase2_1hSent && sellerId) {
        await sendUrgentReminderEmail({
          userId: sellerId,
          orderId,
          listingTitle: title,
          hoursRemaining: 1,
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.disputePhase2_1hSent": true,
        });
        results.phase2Reminders++;
      } else if (remaining <= FOUR_HOURS_MS && !reminderFlags.disputePhase2_4hSent && sellerId) {
        await sendUrgentReminderEmail({
          userId: sellerId,
          orderId,
          listingTitle: title,
          hoursRemaining: 4,
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.disputePhase2_4hSent": true,
        });
        results.phase2Reminders++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 2 dispute reclamation error: ${msg}`);
    console.error("Phase 2 dispute reclamation error:", error);
  }

  return NextResponse.json({
    success: true,
    processedAt: new Date().toISOString(),
    ...results,
  });
}
