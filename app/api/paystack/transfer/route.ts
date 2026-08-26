import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { orderId, sellerId, amount } = await request.json();

    if (!orderId || !sellerId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const userDocRef = adminDb.collection("users").doc(sellerId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const bankName = userData?.bankName || userData?.bank_code;
    const accountNumber = userData?.accountNumber;
    const accountName = userData?.accountName;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "Seller has not added a payout bank account" }, { status: 400 });
    }

    const existingTransfers = await adminDb
      .collection("transfers")
      .where("orderId", "==", orderId)
      .where("sellerId", "==", sellerId)
      .get();

    if (!existingTransfers.empty) {
      return NextResponse.json({ error: "Transfer already initiated for this order" }, { status: 400 });
    }

    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100,
        transfer_code: `TRF-${Date.now()}`,
        currency: "NGN",
        recipient: {
          type: "nuban",
          name: accountName,
          account_number: accountNumber,
          bank_code: bankName,
        },
        reason: `Payout for order ${orderId}`,
      }),
    });

    const transferData = await transferResponse.json();

    if (!transferResponse.ok || transferData.status !== "success") {
      return NextResponse.json({ error: transferData.message || "Transfer failed" }, { status: transferResponse.status });
    }

    const transferRef = adminDb.collection("transfers").doc(transferData.data.reference);
    await transferRef.set({
      orderId,
      sellerId,
      amount,
      status: transferData.data.status || "pending",
      reference: transferData.data.reference,
      transferCode: transferData.data.transfer_code,
      recipient: transferData.data.recipient,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      transfer: transferData.data,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to initiate transfer. Please try again." }, { status: 500 });
  }
}
