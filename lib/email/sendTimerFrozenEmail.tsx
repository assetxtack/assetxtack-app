import { sendEmail } from "./dispatch";
import TimerFrozenEmail from "./templates/TimerFrozenEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendTimerFrozenEmail({
  userId,
  orderId,
  listingTitle,
  frozenBy,
  reason,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
  frozenBy: string;
  reason?: string;
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
      subject: `Timer frozen for order "${listingTitle}"`,
      react: (
        <TimerFrozenEmail
          recipientName={String(userData.fullName || userData.storeTagline || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
          frozenBy={frozenBy}
          reason={reason}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send timer frozen email for order ${orderId}:`, error);
  }
}
