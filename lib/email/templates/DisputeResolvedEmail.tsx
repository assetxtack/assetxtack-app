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

interface DisputeResolvedEmailProps {
  recipientName?: string;
  orderId: string;
  listingTitle: string;
  orderUrl: string;
  resolution: string;
  amount?: number;
}

export default function DisputeResolvedEmail({
  recipientName = "User",
  orderId,
  listingTitle,
  orderUrl,
  resolution,
  amount,
}: DisputeResolvedEmailProps) {
  const amountText = amount ? ` ₦${Number(amount).toLocaleString()}` : "";

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
              <Heading className="m-0 text-3xl font-bold text-emerald-400">
                Dispute Resolved
              </Heading>
              <Text className="mt-2 text-base text-brand-muted">
                {recipientName}, the dispute for your order has been resolved.
              </Text>
            </Section>

            <Section className="mb-6 rounded-lg border border-gray-700 bg-black/30 p-6">
              <Text className="m-0 text-sm text-brand-muted">Order ID</Text>
              <Text className="m-0 text-lg font-semibold text-white">#{orderId}</Text>
              <Hr className="my-4 border-gray-700" />
              <Text className="m-0 text-sm text-brand-muted">Listing</Text>
              <Text className="m-0 text-lg font-semibold text-white">{listingTitle}</Text>
              <Hr className="my-4 border-gray-700" />
              <Text className="m-0 text-sm text-brand-muted">Resolution</Text>
              <Text className="m-0 text-lg font-semibold text-brand-gold">{resolution}</Text>
              {amount && (
                <>
                  <Hr className="my-4 border-gray-700" />
                  <Text className="m-0 text-sm text-brand-muted">Amount</Text>
                  <Text className="m-0 text-lg font-semibold text-emerald-400">{amountText}</Text>
                </>
              )}
            </Section>

            <Section className="mb-6">
              <Text className="m-0 text-base leading-relaxed text-brand-muted">
                All sensitive credentials have been archived and wiped from the active
                order record. The chat has been locked for security compliance.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button
                href={orderUrl}
                className="rounded-md bg-brand-gold px-8 py-3 text-base font-semibold text-brand-dark no-underline"
              >
                View Resolved Order
              </Button>
            </Section>

            <Hr className="my-8 border-gray-700" />

            <Section className="text-center">
              <Text className="m-0 text-xs text-gray-500">
                AssetXtack Escrow System. This dispute has been permanently closed.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
