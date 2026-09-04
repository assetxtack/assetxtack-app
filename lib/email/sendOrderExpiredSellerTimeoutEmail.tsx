import { sendEmail } from "./dispatch";
import OrderExpiredSellerTimeoutEmail from "./templates/OrderExpiredSellerTimeoutEmail";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function sendOrderExpiredSellerTimeoutEmail({
  sellerId,
  orderId,
  listingTitle,
}: {
  sellerId: string;
  orderId: string;
  listingTitle: string;
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

    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    await sendEmail({
      to: email,
      subject: `Order expired for "${listingTitle}"`,
      react: (
        <OrderExpiredSellerTimeoutEmail
          sellerName={String(userData.fullName || userData.storeTagline || "Seller")}
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
        />
      ),
    });
  } catch (error) {
    console.error(`Failed to send order-expired email for order ${orderId}:`, error);
  }
}
