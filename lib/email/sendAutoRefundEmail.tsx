import { sendEmail } from "./dispatch";
import AutoRefundEmail from "./templates/AutoRefundEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendAutoRefundEmail({
  userId,
  orderId,
  listingTitle,
  reason,
  amount,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
  reason: string;
  amount?: number;
}) {
  if (!userId) return;

  try {
    const adminDb = getAdminFirestore();
    if (!adminDb) return;

    const userSnap = await adminDb.collection("users").doc(userId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data() as Record<string, unknown>;
    const email = String(userData.email || "").trim();
    if (!email) return;

    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    await sendEmail({
      to: email,
      subject: `Refund processed for "${listingTitle}"`,
      react: (
        <AutoRefundEmail
          recipientName={String(userData.fullName || userData.storeTaggable || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
          reason={reason}
          amount={amount}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send auto refund email for order ${orderId}:`, error);
  }
}
