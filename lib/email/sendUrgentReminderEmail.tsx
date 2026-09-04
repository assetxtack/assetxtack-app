import { sendEmail } from "./dispatch";
import UrgentReminderEmail from "./templates/UrgentReminderEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendUrgentReminderEmail({
  userId,
  orderId,
  listingTitle,
  hoursRemaining,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
  hoursRemaining: number;
}) {
  if (!userId) {
    return;
  }

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
      subject: `Urgent reminder: ${hoursRemaining}h remaining for "${listingTitle}"`,
      react: (
        <UrgentReminderEmail
          recipientName={String(userData.fullName || userData.storeTagline || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
          hoursRemaining={hoursRemaining}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send urgent reminder email for order ${orderId}:`, error);
  }
}
