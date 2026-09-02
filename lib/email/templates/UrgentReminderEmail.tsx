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

interface UrgentReminderEmailProps {
  recipientName?: string;
  orderId: string;
  listingTitle: string;
  orderUrl: string;
  hoursRemaining: number;
}

export default function UrgentReminderEmail({
  recipientName = "User",
  orderId,
  listingTitle,
  orderUrl,
  hoursRemaining,
}: UrgentReminderEmailProps) {
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
                Urgent Reminder
              </Heading>
              <Text className="mt-2 text-base text-brand-muted">
                {recipientName}, you have less than <strong className="text-brand-gold">{hoursRemaining} hours</strong> remaining for this order.
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
                This is an urgent reminder that your window for this order is almost over. Please take the required action immediately to avoid cancellation or auto-completion.
              </Text>
            </Section>

            <Section className="mb-8 text-center">
              <Button
                href={orderUrl}
                className="rounded-md bg-brand-gold px-8 py-3 text-base font-semibold text-brand-dark no-underline"
              >
                View Order
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
                AssetXtack Escrow System. Please act now to avoid timeout penalties.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
