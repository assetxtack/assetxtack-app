import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bankAccount } = body;

    if (!userId || !bankAccount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, bankAccount" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await userRef.set(
      {
        bankAccount,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Bank account saved successfully",
      bankAccount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save bank account";
    console.error("Save bank account error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
