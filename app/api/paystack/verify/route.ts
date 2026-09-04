import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { reference, listingId } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const rawText = await response.text();

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      console.error("Paystack verify returned non-JSON response:", rawText.slice(0, 300));
      return NextResponse.json(
        { error: "Payment provider returned an invalid response. Please contact support.", raw: rawText.slice(0, 200) },
        { status: 502 }
      );
    }

    const dataInner = data.data as Record<string, unknown> | undefined;
    const status = dataInner?.status;
    const amount = dataInner?.amount;
    const currency = dataInner?.currency;
    const paidAt = dataInner?.paid_at;
    const customer = dataInner?.customer;
    const metadata = dataInner?.metadata as Record<string, unknown> | undefined;

    if (response.status === 404 || String(status).toLowerCase() === "failed") {
      console.warn("Paystack transaction not found or failed:", { reference, status, response: data });
      return NextResponse.json(
        { error: "Payment record not found or payment failed. Please confirm on Paystack or try again.", status, reference },
        { status: 400 })
      ;
    }

    if (String(status).toLowerCase() !== "success") {
      console.warn("Paystack payment not yet successful:", { reference, status, response: data });
      return NextResponse.json(
        { pending: true, status, reference },
        { status: 200 })
      ;
    }

    if (listingId) {
      const adminDb = getAdminFirestore();
      if (adminDb) {
        await adminDb.collection("listings").doc(listingId).update({ status: "sold" });
      }
    }

    return NextResponse.json({
      success: true,
      status,
      amount,
      currency,
      paidAt,
      customer,
      reference,
      metadata,
    });
  } catch (error) {
    console.error("Paystack verify exception:", error);
    return NextResponse.json({ error: "Unable to verify payment. Please try again." }, { status: 500 });
  }
}
