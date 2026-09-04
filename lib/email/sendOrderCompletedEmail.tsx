import { sendEmail } from "./dispatch";
import OrderCompletedEmail from "./templates/OrderCompletedEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendOrderCompletedEmail({
  sellerId,
  orderId,
  listingTitle,
  payoutAmount,
}: {
  sellerId: string;
  orderId: string;
  listingTitle: string;
  payoutAmount: number;
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

    const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/wallet`;

    await sendEmail({
      to: email,
      subject: `Order completed for "${listingTitle}"`,
      react: (
        <OrderCompletedEmail
          sellerName={String(userData.fullName || userData.storeTagline || "Seller")}
          orderId={orderId}
          listingTitle={listingTitle}
          payoutAmount={payoutAmount}
          walletUrl={walletUrl}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send order-completed email for order ${orderId}:`, error);
  }
}
