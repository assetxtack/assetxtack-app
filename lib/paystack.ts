export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch("/api/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json() as {
    authorizationUrl?: string;
    accessCode?: string;
    reference?: string;
    error?: string;
  };

  if (!response.ok || !data.authorizationUrl) {
    throw new Error(data.error || "Failed to initialize payment");
  }

  return {
    authorizationUrl: data.authorizationUrl,
    accessCode: data.accessCode,
    reference: data.reference,
  };
}
