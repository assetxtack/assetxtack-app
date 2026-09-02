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

interface CredentialsDeliveredEmailProps {
  buyerName?: string;
  orderId: string;
  listingTitle: string;
  orderUrl: string;
}

export default function CredentialsDeliveredEmail({
  buyerName = "Buyer",
  orderId,
  listingTitle,
  orderUrl,
}: CredentialsDeliveredEmailProps) {
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
                Credentials Delivered
              </Heading>
              <Text className="mt-2 text-base text-brand-muted">
                Good news, {buyerName}! The seller has submitted credentials for your order.
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
                The seller has securely delivered the account credentials to the vault. Your{" "}
                <strong className="text-white">24-hour Inspection Period</strong> has officially started.
              </Text>
              <Text className="m-0 mt-4 text-base leading-relaxed text-brand-muted">
                Please inspect the credentials carefully. If you do not confirm delivery or open a dispute within{" "}
                <strong className="text-white">24 hours</strong>, the funds will be automatically released to the seller.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button
                href={orderUrl}
                className="rounded-md bg-brand-gold px-8 py-3 text-base font-semibold text-brand-dark no-underline"
              >
                Inspect Credentials
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
                AssetXtack Escrow System. Funds are protected until delivery is confirmed.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}