import { resend } from "./resend";

const RESEND_TIMEOUT_MS = 10000;

async function sendWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = RESEND_TIMEOUT_MS
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Resend API request timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured on the server");
  }

  if (!to) {
    throw new Error("Recipient email is required");
  }

  const fromEmail = String(process.env.RESEND_FROM_EMAIL || "AssetXtack <notifications@assetxtack.com>");

  try {
    const result = await sendWithTimeout(
      resend.emails.send({
        from: fromEmail,
        to,
        subject,
        react,
      })
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Resend dispatch failed:", {
      to,
      subject,
      error: message,
    });
    throw error;
  }
}
