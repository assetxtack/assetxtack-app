import { sendEmail } from "./dispatch";
import TamperingReportEmail from "./templates/TamperingReportEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendTamperingReportEmail({
  userId,
  orderId,
  listingTitle,
  recipientRole,
}: {
  userId: string;
  orderId: string;
  listingTitle: string;
  recipientRole: "buyer" | "seller";
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
      subject: `Order dispute reported for "${listingTitle}"`,
      react: (
        <TamperingReportEmail
          recipientName={String(userData.fullName || userData.storeTagline || userData.email || "User")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
          recipientRole={recipientRole}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send tampering report email for order ${orderId}:`, error);
  }
}
