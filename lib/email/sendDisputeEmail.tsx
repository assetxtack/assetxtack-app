import { resend } from "./resend";
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
  if (!process.env.RESEND_API_KEY || !userId) {
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

    const fromEmail = String(process.env.RESEND_FROM_EMAIL || "AssetXtack <notifications@assetxtack.com>");
    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    const payload = {
      from: fromEmail,
      to: email,
      subject: `Dispute opened for "${listingTitle}"`,
      orderId,
      listingTitle,
      orderUrl,
    };

    console.log("Resend Payload:", payload);

    await resend.emails.send({
      from: fromEmail,
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
    console.error("Resend Error Details:", error);
    console.error("Failed to send dispute email:", error);
  }
}
