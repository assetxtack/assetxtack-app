import {
  Html,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components";

interface OrderExpiredSellerTimeoutEmailProps {
  sellerName?: string;
  orderId: string;
  listingTitle: string;
  orderUrl: string;
}

export default function OrderExpiredSellerTimeoutEmail({
  sellerName = "Seller",
  orderId,
  listingTitle,
  orderUrl,
}: OrderExpiredSellerTimeoutEmailProps) {
  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              brand: {
                dark: "#0b0c10",
                surface: "#1f2833",
                gold: "#FFB020",
                goldHover: "#e6a300",
                muted: "#c5c6c7",
              },
            },
          },
        },
      }}
    >
      <Html>
        <Body className="bg-brand-dark m-0 px-0 font-sans">
          <Container className="mx-auto max-w-[600px] rounded-lg bg-brand-surface p-8 shadow-lg">
            <Section className="mb-8 text-center">
              <Heading className="m-0 text-3xl font-bold text-white">
                Order Expired
              </Heading>
              <Text className="mt-2 text-base text-brand-muted">
                {sellerName}, the 24-hour window to deliver credentials for this order has expired.
              </Text>
            </Section>

            <Section className="mb-6 rounded-lg border border-gray-700 bg-black/30 p-6">
              <Text className="m-0 text-sm text-brand-muted">Order ID</Text>
              <Text className="m-0 text-lg font-semibold text-white">
                #{orderId}
              </Text>

              <Hr className="my-4 border-gray-700" />

              <Text className="m-0 text-sm text-brand-muted">Listing</Text>
              <Text className="m-0 text-lg font-semibold text-white">
                {listingTitle}
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="m-0 text-base leading-relaxed text-brand-muted">
                You did not submit account credentials within the required 24-hour window. As a result, this order has been automatically cancelled and the buyer has been refunded.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button
                href={orderUrl}
                className="rounded-md bg-brand-gold px-8 py-3 text-base font-semibold text-brand-dark no-underline"
              >
                View Order Details
              </Button>
            </Section>

            <Section className="text-center">
              <Text className="m-0 text-sm text-brand-muted">
                If the button above does not work, copy and paste this link into your browser:
              </Text>
              <Text className="m-0 break-all text-sm text-brand-gold">
                {orderUrl}
              </Text>
            </Section>

            <Hr className="my-8 border-gray-700" />

            <Section className="text-center">
              <Text className="m-0 text-xs text-gray-500">
                AssetXtack Escrow System. Please ensure timely delivery in future trades.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
