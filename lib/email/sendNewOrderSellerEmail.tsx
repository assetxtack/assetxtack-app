import { sendEmail } from "./dispatch";
import NewOrderSellerEmail from "./templates/NewOrderSellerEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendNewOrderSellerEmail({
  sellerId,
  orderId,
  title,
  amount,
}: {
  sellerId: string;
  orderId: string;
  title: string;
  amount: number;
}) {
  if (!sellerId) {
    return;
  }

  try {
    const adminDb = getAdminFirestore();
    if (!adminDb) return;

    const userSnap = await adminDb.collection("users").doc(sellerId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data() as Record<string, unknown>;
    const email = String(userData.email || "").trim();
    if (!email) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    await sendEmail({
      to: email,
      subject: `Payment secured for "${title}"`,
      react: (
        <NewOrderSellerEmail
          sellerName={String(userData.fullName || userData.storeTagline || "Seller")}
          orderId={orderId}
          listingTitle={title}
          payoutAmount={amount}
          dashboardUrl={dashboardUrl}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send new-order seller email for order ${orderId}:`, error);
  }
}
