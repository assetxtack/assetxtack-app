import { sendEmail } from "./dispatch";
import DisputeResolvedEmail from "./templates/DisputeResolvedEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendDisputeResolvedEmail({
  userId,
  orderId,
  listingTitle,
  resolution,
  amount,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
  resolution: string;
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
      subject: `Dispute resolved for "${listingTitle}"`,
      react: (
        <DisputeResolvedEmail
          recipientName={String(userData.fullName || userData.storeTagline || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
          resolution={resolution}
          amount={amount}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send dispute resolved email for order ${orderId}:`, error);
  }
}
