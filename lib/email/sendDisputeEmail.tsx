import { sendEmail } from "./dispatch";
import DisputeOpenedEmail from "./templates/DisputeOpenedEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendDisputeEmail({
  userId,
  orderId,
  listingTitle,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
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
      subject: `Dispute opened for "${listingTitle}"`,
      react: (
        <DisputeOpenedEmail
          recipientName={String(userData.fullName || userData.storeTagline || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send dispute email for order ${orderId}:`, error);
  }
}
