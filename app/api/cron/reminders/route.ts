import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";
import { recordWalletTransaction } from "@/lib/wallet";
import { sendUrgentReminderEmail } from "@/lib/email/sendUrgentReminderEmail";
import { sendOrderExpiredSellerTimeoutEmail } from "@/lib/email/sendOrderExpiredSellerTimeoutEmail";
import { sendOrderAutoCompletedEmail } from "@/lib/email/sendOrderAutoCompletedEmail";

export const dynamic = "force-dynamic";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
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

function getReminderFlags(orderData: Record<string, unknown>) {
  return (
    (orderData.reminderFlags as Record<string, boolean>) || {
      seller12hSent: false,
      seller2hSent: false,
      buyer12hSent: false,
      buyer2hSent: false,
    }
  );
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

    if (buyerId) {
      await sendNotification({
        userId: buyerId,
        orderId,
        title: "Order Cancelled & Refunded",
        message: `Your order for "${title}" was auto-cancelled. ₦${amount.toLocaleString()} has been refunded to your wallet.`,
        type: "ESCROW_LOCKED",
      });

      await sendOrderExpiredSellerTimeoutEmail({
        sellerId,
        orderId,
        listingTitle: title,
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

      await sendOrderExpiredSellerTimeoutEmail({
        sellerId,
        orderId,
        listingTitle: title,
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

      await sendOrderAutoCompletedEmail({
        userId: sellerId,
        orderId,
        listingTitle: title,
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

      await sendOrderAutoCompletedEmail({
        userId: buyerId,
        orderId,
        listingTitle: title,
      });
    }

    return true;
  } catch (error) {
    console.error(`Failed to complete expired inspection for order ${orderId}:`, error);
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
    phase1Cancelled: 0,
    phase2Completed: 0,
    reminder12hSent: 0,
    reminder2hSent: 0,
    errors: [] as string[],
  };

  try {
    const phase1Query = await adminDb
      .collection("orders")
      .where("status", "==", "AWAITING_CREDENTIALS")
      .get();

    for (const doc of phase1Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (orderData.status === "DISPUTED") continue;

      const paymentVerifiedAt = parseTimestamp(orderData.paymentVerifiedAt);
      if (!paymentVerifiedAt) continue;

      const elapsed = now - paymentVerifiedAt.getTime();
      const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
      const reminderFlags = getReminderFlags(orderData);
      const orderId = doc.id;
      const title = String(orderData.title || "Unknown listing");
      const sellerId = String(orderData.sellerId || "");
      const buyerId = String(orderData.buyerId || "");

      if (remaining <= 0) {
        const success = await cancelExpiredOrder(orderId, orderData);
        if (success) {
          results.phase1Cancelled++;
        } else {
          results.errors.push(`Failed to cancel order ${orderId}`);
        }
        continue;
      }

      if (remaining <= TWO_HOURS_MS && !reminderFlags.seller2hSent && sellerId) {
        await sendUrgentReminderEmail({
          userId: sellerId,
          orderId,
          listingTitle: title,
          hoursRemaining: Math.max(1, Math.ceil(remaining / (60 * 60 * 1000))),
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.seller2hSent": true,
        });
        results.reminder2hSent++;
      } else if (remaining <= TWELVE_HOURS_MS && !reminderFlags.seller12hSent && sellerId) {
        await sendUrgentReminderEmail({
          userId: sellerId,
          orderId,
          listingTitle: title,
          hoursRemaining: Math.max(1, Math.ceil(remaining / (60 * 60 * 1000))),
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.seller12hSent": true,
        });
        results.reminder12hSent++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 1 reminder/expiration error: ${msg}`);
    console.error("Phase 1 reminder/expiration error:", error);
  }

  try {
    const phase2Query = await adminDb
      .collection("orders")
      .where("status", "==", "INSPECTION_PERIOD")
      .get();

    for (const doc of phase2Query.docs) {
      const orderData = doc.data() as Record<string, unknown>;
      if (orderData.status === "DISPUTED") continue;

      const credentialsDeliveredAt = parseTimestamp(orderData.credentialsDeliveredAt);
      if (!credentialsDeliveredAt) continue;

      const elapsed = now - credentialsDeliveredAt.getTime();
      const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
      const reminderFlags = getReminderFlags(orderData);
      const orderId = doc.id;
      const title = String(orderData.title || "Unknown listing");
      const sellerId = String(orderData.sellerId || "");
      const buyerId = String(orderData.buyerId || "");

      if (remaining <= 0) {
        const success = await completeExpiredInspection(orderId, orderData);
        if (success) {
          results.phase2Completed++;
        } else {
          results.errors.push(`Failed to complete order ${orderId}`);
        }
        continue;
      }

      if (remaining <= TWO_HOURS_MS && !reminderFlags.buyer2hSent && buyerId) {
        await sendUrgentReminderEmail({
          userId: buyerId,
          orderId,
          listingTitle: title,
          hoursRemaining: Math.max(1, Math.ceil(remaining / (60 * 60 * 1000))),
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.buyer2hSent": true,
        });
        results.reminder2hSent++;
      } else if (remaining <= TWELVE_HOURS_MS && !reminderFlags.buyer12hSent && buyerId) {
        await sendUrgentReminderEmail({
          userId: buyerId,
          orderId,
          listingTitle: title,
          hoursRemaining: Math.max(1, Math.ceil(remaining / (60 * 60 * 1000))),
        });
        await adminDb.collection("orders").doc(orderId).update({
          "reminderFlags.buyer12hSent": true,
        });
        results.reminder12hSent++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Phase 2 reminder/expiration error: ${msg}`);
    console.error("Phase 2 reminder/expiration error:", error);
  }

  return NextResponse.json({
    success: true,
    processedAt: new Date().toISOString(),
    ...results,
  });
}
