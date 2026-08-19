import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

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

    const userDocRef = doc(db, "users", sellerId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const bankName = userData.bankName || userData.bank_code;
    const accountNumber = userData.accountNumber;
    const accountName = userData.accountName;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "Seller has not added a payout bank account" }, { status: 400 });
    }

    const transfersRef = collection(db, "transfers");
    const q = query(transfersRef, where("orderId", "==", orderId), where("sellerId", "==", sellerId));
    const existingTransfers = await getDocs(q);
    
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

    const transferRef = doc(collection(db, "transfers"), transferData.data.reference);
    await setDoc(transferRef, {
      orderId,
      sellerId,
      amount,
      status: transferData.data.status || "pending",
      reference: transferData.data.reference,
      transferCode: transferData.data.transfer_code,
      recipient: transferData.data.recipient,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      transfer: transferData.data,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to initiate transfer. Please try again." }, { status: 500 });
  }
}
