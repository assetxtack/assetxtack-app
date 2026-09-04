import { sendEmail } from "./dispatch";
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
  if (!buyerEmail) {
    return;
  }

  try {
    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}`;

    await sendEmail({
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
    console.error(`Failed to send credentials-delivered email for order ${orderId}:`, error);
  }
}
