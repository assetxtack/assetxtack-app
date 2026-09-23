import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface EscrowAuditEntry {
  id: string;
  orderId: string;
  action: string;
  amount: number;
  buyerId: string | null;
  sellerId: string | null;
  title?: string;
  reason?: string;
  resolution?: string;
  disputeResolution?: string;
  sellerPayout?: number;
  platformFee?: number;
  feePercentage?: number;
  feeTier?: string;
  originalCredentials?: string;
  returnedCredentials?: string;
  deliveryNotes?: string;
  verificationChecklist?: Record<string, unknown>;
  disputeReclamationDeadline?: Date;
  sellerVerificationDeadline?: Date;
  credentialsDeliveredAt?: Date;
  returnedCredentialsAt?: Date;
  disputedAt?: Date;
  accountSecuredAt?: Date;
  createdAt: string;
}

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

    const isAdmin =
      adminUserData?.role === "admin" ||
      adminUserData?.isAdmin === true ||
      decodedToken.uid === process.env.ADMIN_UID;

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("escrowAudit").get();

    const entries: EscrowAuditEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;

      const parseDate = (value: unknown): Date | undefined => {
        if (value instanceof Date) return value;
        if (value && typeof value === "object" && "toDate" in value) {
          try {
            return (value as { toDate: () => Date }).toDate();
          } catch {
            return undefined;
          }
        }
        if (typeof value === "string" || typeof value === "number") {
          const d = new Date(value);
          return isNaN(d.getTime()) ? undefined : d;
        }
        return undefined;
      };

      return {
        id: doc.id,
        orderId: String(data.orderId || ""),
        action: String(data.action || "UNKNOWN"),
        amount: Number(data.amount) || 0,
        buyerId: data.buyerId ? String(data.buyerId) : null,
        sellerId: data.sellerId ? String(data.sellerId) : null,
        title: data.title ? String(data.title) : undefined,
        reason: data.reason ? String(data.reason) : undefined,
        resolution: data.resolution ? String(data.resolution) : undefined,
        disputeResolution: data.disputeResolution ? String(data.disputeResolution) : undefined,
        sellerPayout: data.sellerPayout ? Number(data.sellerPayout) : undefined,
        platformFee: data.platformFee ? Number(data.platformFee) : undefined,
        feePercentage: data.feePercentage ? Number(data.feePercentage) : undefined,
        feeTier: data.feeTier ? String(data.feeTier) : undefined,
        originalCredentials: data.originalCredentials ? String(data.originalCredentials) : undefined,
        returnedCredentials: data.returnedCredentials ? String(data.returnedCredentials) : undefined,
        deliveryNotes: data.deliveryNotes ? String(data.deliveryNotes) : undefined,
        verificationChecklist: data.verificationChecklist as Record<string, unknown> | undefined,
        disputeReclamationDeadline: parseDate(data.disputeReclamationDeadline),
        sellerVerificationDeadline: parseDate(data.sellerVerificationDeadline),
        credentialsDeliveredAt: parseDate(data.credentialsDeliveredAt),
        returnedCredentialsAt: parseDate(data.returnedCredentialsAt),
        disputedAt: parseDate(data.disputedAt),
        accountSecuredAt: parseDate(data.accountSecuredAt),
        createdAt: parseDate(data.createdAt)?.toISOString() || new Date().toISOString(),
      };
    });

    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const userIds = new Set<string>();
    for (const entry of entries) {
      if (entry.buyerId) userIds.add(entry.buyerId);
      if (entry.sellerId) userIds.add(entry.sellerId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data();
      if (ud) {
        usersMap.set(uid, {
          fullName: ud.fullName,
          email: ud.email,
        });
      }
    }

    const enrichedEntries = entries.map((entry) => ({
      ...entry,
      buyerName: entry.buyerId ? usersMap.get(entry.buyerId)?.fullName || null : null,
      buyerEmail: entry.buyerId ? usersMap.get(entry.buyerId)?.email || null : null,
      sellerName: entry.sellerId ? usersMap.get(entry.sellerId)?.fullName || null : null,
      sellerEmail: entry.sellerId ? usersMap.get(entry.sellerId)?.email || null : null,
    }));

    return NextResponse.json({ success: true, auditEntries: enrichedEntries }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_ESCROW_AUDIT_ERROR]:", error);
    return NextResponse.json({ error: `Failed to fetch escrow audit: ${errorMessage}` }, { status: 500 });
  }
}
