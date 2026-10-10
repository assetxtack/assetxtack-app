import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken: { uid: string };
    try {
      const adminAuth = getAdminAuth();
      if (!adminAuth) {
        return NextResponse.json({ error: "Authentication not available" }, { status: 500 });
      }
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const adminUserDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const adminUserData = adminUserDoc.data();
    if (!adminUserData) {
      return NextResponse.json({ error: "Unauthorized: Admin user not found" }, { status: 403 });
    }

    const userData = adminUserData;
    const isAdmin =
      userData?.role === "admin" ||
      userData?.isAdmin === true ||
      decodedToken.uid === process.env.ADMIN_UID;

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const usersSnapshot = await adminDb.collection("users").get();
    const users: Array<{
      uid: string;
      fullName?: string;
      email?: string;
      kycStatus?: "unverified" | "pending" | "VERIFIED" | "rejected";
      sellerVerified?: boolean;
      walletBalance?: number;
      escrowBalance?: number;
      lifetimeSales?: number;
      averageRating?: number;
      totalReviews?: number;
      phoneNumber?: string;
      bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string };
      verificationProvider?: string;
      createdAt?: string | Date;
      status?: string;
      banCategory?: string;
      banReason?: string;
      bannedAt?: string | Date;
      bannedBy?: string;
      walletStatus?: { isFrozen: boolean };
    }> = [];

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      users.push({
        uid: doc.id,
        fullName: data.fullName,
        email: data.email,
        kycStatus: data.kycStatus,
        sellerVerified: data.sellerVerified,
        walletBalance: Number(data.walletBalance) || 0,
        escrowBalance: Number(data.escrowBalance) || 0,
        lifetimeSales: Number(data.lifetimeSales) || 0,
        averageRating: data.averageRating,
        totalReviews: data.totalReviews,
        phoneNumber: data.phoneNumber,
        bankAccount: data.bankAccount,
        verificationProvider: data.verificationProvider,
        createdAt: data.createdAt,
        status: data.status || "active",
        banCategory: data.banCategory,
        banReason: data.banReason,
        bannedAt: data.bannedAt?.toDate?.()?.toISOString?.() || data.bannedAt,
        bannedBy: data.bannedBy,
        walletStatus: {
          isFrozen: data.walletStatus === "frozen" || data.walletStatus?.isFrozen === true,
        },
      });
    }

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_USERS_ERROR]:", error);
    return NextResponse.json({ error: `Failed to fetch users: ${errorMessage}` }, { status: 500 });
  }
}
