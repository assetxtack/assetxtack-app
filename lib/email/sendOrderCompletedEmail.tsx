import { resend } from "./resend";
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
  if (!process.env.RESEND_API_KEY || !sellerId) {
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

    const fromEmail = String(process.env.RESEND_FROM_EMAIL || "AssetXtack <notifications@assetxtack.com>");
    const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/wallet`;

    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(payoutAmount);

    const payload = {
      from: fromEmail,
      to: email,
      subject: `Order completed for "${listingTitle}"`,
      orderId,
      listingTitle,
      payoutAmount: formattedAmount,
      walletUrl,
    };

    console.log("Resend Payload:", payload);

    await resend.emails.send({
      from: fromEmail,
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
    console.error("Resend Error Details:", error);
    console.error("Failed to send order completed email:", error);
  }
}
