import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");

    if (!uid && !email) {
      return NextResponse.json({ error: "Missing user ID or email" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    let userDoc;
    if (uid) {
      userDoc = await adminDb.collection("users").doc(uid).get();
    } else {
      // Look up by email
      const snapshot = await adminDb.collection("users").where("email", "==", email!.toLowerCase()).limit(1).get();
      if (snapshot.empty) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userDoc = snapshot.docs[0];
    }

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;

    return NextResponse.json({
      banCategory: userData.banCategory || null,
      banReason: userData.banReason || null,
      bannedAt: userData.bannedAt?.toDate?.()?.toISOString() || userData.bannedAt || null,
      bannedBy: userData.bannedBy || null,
      status: userData.status || "active",
      uid: userDoc.id,
      email: userData.email || null,
    });
  } catch (error) {
    console.error("[BAN_STATUS_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to fetch ban status" },
      { status: 500 }
    );
  }
}
