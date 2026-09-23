import React from "react";

interface TamperingReportEmailProps {
  recipientName: string;
  orderId: string;
  listingTitle: string;
  orderUrl: string;
  recipientRole: "buyer" | "seller";
}

export default function TamperingReportEmail({
  recipientName,
  orderId,
  listingTitle,
  orderUrl,
  recipientRole,
}: TamperingReportEmailProps) {
  const buyerMessage =
    "The seller has reported potential tampering on the returned credentials for your order. The escrow timer has been frozen and funds are securely locked in the vault pending review.";
  const sellerMessage =
    "A tampering report has been registered for your order. Escrow funds are safely locked in the vault pending review. Please cooperate with the investigation.";

  return (
    <div style={{ fontFamily: "sans-serif", color: "#333", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Order Dispute Reported</h2>
      <p>Dear {recipientName},</p>
      <p>
        {recipientRole === "buyer" ? buyerMessage : sellerMessage}
      </p>
      <p>
        <strong>Order ID:</strong> {orderId}
        <br />
        <strong>Listing:</strong> {listingTitle}
      </p>
      <p>
        View your order details: <a href={orderUrl}>{orderUrl}</a>
      </p>
      <p>Thank you for using AssetXtack.</p>
    </div>
  );
}
