import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface UserBanPayload {
  action: "ban" | "unban";
  reason?: string;
  banCategory?: string;
  banReason?: string;
  force?: boolean;
}

function safeString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function safeNumber(value: unknown): number {
  if (value === undefined || value === null) return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function verifyAdmin(
  decodedToken: { uid: string },
  adminUserData: Record<string, unknown> | undefined
): boolean {
  return (
    adminUserData?.role === "admin" ||
    adminUserData?.isAdmin === true ||
    decodedToken.uid === process.env.ADMIN_UID
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

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
    const adminUserData = adminUserDoc.data() as Record<string, unknown> | undefined;
    if (!verifyAdmin(decodedToken, adminUserData)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const body = (await request.json()) as UserBanPayload;
    if (!body.action || (body.action !== "ban" && body.action !== "unban")) {
      return NextResponse.json({ error: "Invalid action. Must be 'ban' or 'unban'" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const currentStatus = safeString(userData.status || "active");

    if (body.action === "ban") {
      if (currentStatus === "banned") {
        return NextResponse.json({ error: "User is already banned" }, { status: 400 });
      }

      const activeOrdersSnapshot = await adminDb
        .collection("orders")
        .where("buyerId", "==", userId)
        .where("status", "in", ["pending", "active", "disputed"])
        .limit(1)
        .get();

      const activeOrdersAsSellerSnapshot = await adminDb
        .collection("orders")
        .where("sellerId", "==", userId)
        .where("status", "in", ["pending", "active", "disputed"])
        .limit(1)
        .get();

      const hasActiveOrders = !activeOrdersSnapshot.empty || !activeOrdersAsSellerSnapshot.empty;

      const walletBalance = safeNumber(userData.walletBalance);
      const hasFunds = walletBalance > 0;

      const isForceBan = body.force === true;

      if (!isForceBan && (hasActiveOrders || hasFunds)) {
        return NextResponse.json(
          {
            error: "User has active orders or wallet funds",
            requiresConfirmation: true,
            details: {
              hasActiveOrders,
              hasFunds,
              walletBalance,
              activeOrderCount: activeOrdersSnapshot.size + activeOrdersAsSellerSnapshot.size,
            },
          },
          { status: 409 }
        );
      }

      const adminAuth = getAdminAuth();
      if (!adminAuth) {
        return NextResponse.json({ error: "Authentication not available" }, { status: 500 });
      }
      await adminAuth.updateUser(userId, { disabled: true });

      const bannedAt = new Date().toISOString();
      await userRef.update({
        status: "banned",
        bannedAt,
        bannedBy: decodedToken.uid,
        banReason: body.banReason || body.reason || "Violated platform terms",
        banCategory: body.banCategory || "Other",
        walletStatus: "frozen",
        updatedAt: new Date().toISOString(),
      });

      const walletRef = adminDb.collection("wallets").doc(userId);
      const walletDoc = await walletRef.get();
      if (walletDoc.exists) {
        await walletRef.update({
          isFrozen: true,
          frozenAt: new Date(),
          frozenBy: decodedToken.uid,
          updatedAt: new Date(),
        });
      } else {
        await walletRef.set({
          userId,
          isFrozen: true,
          frozenAt: new Date(),
          frozenBy: decodedToken.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "User banned successfully",
          userId,
          status: "banned",
        },
        { status: 200 }
      );
    }

    if (body.action === "unban") {
      if (currentStatus !== "banned") {
        return NextResponse.json({ error: "User is not banned" }, { status: 400 });
      }

      const adminAuth = getAdminAuth();
      if (adminAuth) {
        try {
          await adminAuth.updateUser(userId, { disabled: false });
        } catch (authError) {
          console.error("Failed to re-enable Firebase Auth user:", authError);
        }
      }

      await userRef.update({
        status: "active",
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        banCategory: null,
        walletStatus: "active",
        updatedAt: new Date().toISOString(),
      });

      const walletRef = adminDb.collection("wallets").doc(userId);
      const walletDoc = await walletRef.get();
      if (walletDoc.exists) {
        await walletRef.update({
          isFrozen: false,
          frozenAt: null,
          frozenBy: null,
          updatedAt: new Date(),
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "User unbanned successfully",
          userId,
          status: "active",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_USER_BAN_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to update user status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
