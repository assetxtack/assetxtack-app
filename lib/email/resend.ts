import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("RESEND_API_KEY is not configured. Email delivery will fail.");
}

export const resend = apiKey ? new Resend(apiKey) : null;
