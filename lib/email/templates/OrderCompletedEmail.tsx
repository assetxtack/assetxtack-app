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

interface OrderCompletedEmailProps {
  sellerName?: string;
  orderId: string;
  listingTitle: string;
  payoutAmount: number;
  walletUrl: string;
}

export default function OrderCompletedEmail({
  sellerName = "Seller",
  orderId,
  listingTitle,
  payoutAmount,
  walletUrl,
}: OrderCompletedEmailProps) {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(payoutAmount);

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
                Order Completed
              </Heading>
              <Text className="mt-2 text-base text-brand-muted">
                Great news, {sellerName}! The buyer has confirmed delivery.
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

              <Hr className="my-4 border-gray-700" />

              <Text className="m-0 text-sm text-brand-muted">
                Funds Released to Your Wallet
              </Text>
              <Text className="m-0 text-2xl font-bold text-brand-gold">
                {formattedAmount}
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="m-0 text-base leading-relaxed text-brand-muted">
                The inspection period has cleared and the escrow funds have been successfully released to your wallet. You can now withdraw or use your balance.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button
                href={walletUrl}
                className="rounded-md bg-brand-gold px-8 py-3 text-base font-semibold text-brand-dark no-underline"
              >
                Go to Wallet
              </Button>
            </Section>

            <Section className="text-center">
              <Text className="m-0 text-sm text-brand-muted">
                If the button above does not work, copy and paste this link into your browser:
              </Text>
              <Text className="m-0 break-all text-sm text-brand-gold">
                {walletUrl}
              </Text>
            </Section>

            <Hr className="my-8 border-gray-700" />

            <Section className="text-center">
              <Text className="m-0 text-xs text-gray-500">
                AssetXtack Escrow System. Thank you for using our secure marketplace.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
