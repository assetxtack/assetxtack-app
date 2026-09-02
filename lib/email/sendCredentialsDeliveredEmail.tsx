import { resend } from "./resend";
import CredentialsDeliveredEmail from "./templates/CredentialsDeliveredEmail";

export async function sendCredentialsDeliveredEmail({
  buyerEmail,
  orderId,
  listingTitle,
}: {
  buyerEmail: string;
  orderId: string;
  listingTitle: string;
}) {
  if (!process.env.RESEND_API_KEY || !buyerEmail) {
    return;
  }

  try {
    const fromEmail = String(process.env.RESEND_FROM_EMAIL || "AssetXtack <notifications@assetxtack.com>");
    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    const payload = {
      from: fromEmail,
      to: buyerEmail,
      subject: `Credentials delivered for "${listingTitle}"`,
      orderId,
      listingTitle,
      orderUrl,
    };

    console.log("Resend Payload:", payload);

    await resend.emails.send({
      from: fromEmail,
      to: buyerEmail,
      subject: `Credentials delivered for "${listingTitle}"`,
      react: (
        <CredentialsDeliveredEmail
          buyerName="Buyer"
          orderId={orderId}
          listingTitle={listingTitle}
          orderUrl={orderUrl}
        />
      ),
    });
  } catch (error) {
    console.error("Resend Error Details:", error);
    console.error("Failed to send credentials delivered email:", error);
  }
}
