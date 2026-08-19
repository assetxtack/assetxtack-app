import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, amount, reference, metadata } = await request.json();

    if (!email || !amount || !reference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const listingId = metadata?.listingId as string | undefined;
    const buyerId = metadata?.buyerId as string | undefined;

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const listingSnap = await adminDb.collection("listings").doc(listingId).get();

    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listingData = listingSnap.data() as Record<string, unknown>;
    const listingStatus = String(listingData.status || "active").toLowerCase();
    const sellerId = String(listingData.sellerId || "");

    if (listingStatus !== "active") {
      return NextResponse.json({ error: "This account is no longer available" }, { status: 400 });
    }

    if (buyerId && sellerId && buyerId === sellerId) {
      return NextResponse.json({ error: "You cannot purchase your own listing" }, { status: 403 });
    }

    const accountPrice = Number(listingData.price || 0);
    const gatewayFee = accountPrice * 0.015 + (accountPrice >= 2500 ? 100 : 0);
    const cappedFee = Math.min(gatewayFee, 2000);
    const totalAmount = accountPrice + Math.round(cappedFee);

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(totalAmount * 100),
        currency: "NGN",
        reference,
        metadata,
      }),
    });

    const rawText = await response.text();

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      console.error("Paystack returned non-JSON response:", rawText.slice(0, 300));
      return NextResponse.json(
        { error: "Payment provider returned an invalid response. Please try again later." },
        { status: 502 }
      );
    }

    const paystackStatus = data.status === true;
    if (!response.ok || !paystackStatus) {
      const paystackMessage = (data as { message?: string }).message || "Failed to initialize payment";
      console.error("Paystack initialization error:", paystackMessage, data);
      return NextResponse.json({ error: paystackMessage }, { status: response.status || 400 });
    }

    const dataInner = data.data as Record<string, unknown> | undefined;
    return NextResponse.json({
      authorizationUrl: dataInner?.authorization_url,
      accessCode: dataInner?.access_code,
      reference: dataInner?.reference,
    });
  } catch (error) {
    console.error("Paystack initialization exception:", error);
    return NextResponse.json(
      { error: "Unable to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
