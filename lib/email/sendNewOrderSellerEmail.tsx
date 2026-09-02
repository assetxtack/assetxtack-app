import { resend } from "./resend";
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

    const payload = {
      from: fromEmail,
      to: email,
      subject: `Payment secured for "${title}"`,
      orderId,
      title,
      amount,
    };

    console.log("Resend Payload:", payload);

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Payment secured for "${title}"`,
      react: (
        <NewOrderSellerEmail
          sellerName={String(userData.fullName || userData.storeTagline || "Seller")}
          orderId={orderId}
          listingTitle={title}
          payoutAmount={amount}
          dashboardUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`}
        />
      ),
    });
  } catch (error) {
    console.error("Resend Error Details:", error);
    console.error("Failed to send new order seller email:", error);
  }
}
