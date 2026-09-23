import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { parseTimestamp, safeString, safeNumber, verifyAdmin } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processing";

interface BankAccount {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

interface WithdrawalRequestEntry {
  id: string;
  userId: string;
  sellerId: string;
  amount: number;
  bankAccount: BankAccount | null;
  status: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
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
    const adminUserData = adminUserDoc.data() as Record<string, unknown> | undefined;

    if (!verifyAdmin(decodedToken, adminUserData)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("withdrawalRequests").get();

    const requests: WithdrawalRequestEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtDate = parseTimestamp(data.createdAt);
      const updatedAtDate = parseTimestamp(data.updatedAt);
      const rawBankAccount = data.bankAccount as Record<string, unknown> | undefined;

      return {
        id: doc.id,
        userId: safeString(data.userId),
        sellerId: safeString(data.sellerId || data.userId),
        amount: safeNumber(data.amount),
        bankAccount: rawBankAccount
          ? {
              bankName: typeof rawBankAccount.bankName === "string" ? rawBankAccount.bankName : undefined,
              accountNumber: typeof rawBankAccount.accountNumber === "string" ? rawBankAccount.accountNumber : undefined,
              accountName: typeof rawBankAccount.accountName === "string" ? rawBankAccount.accountName : undefined,
            }
          : null,
        status: safeString(data.status) || "pending",
        reason: safeString(data.reason) || "",
        createdAt: createdAtDate?.toISOString() || new Date().toISOString(),
        updatedAt: updatedAtDate?.toISOString() || new Date().toISOString(),
        userName: null,
        userEmail: null,
      };
    });

    requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    for (const req of requests) {
      userIds.add(req.userId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const ud = userSnap.data() as Record<string, unknown> | undefined;
        if (ud) {
          usersMap.set(uid, {
            fullName: typeof ud.fullName === "string" ? ud.fullName : typeof ud.displayName === "string" ? ud.displayName : undefined,
            email: typeof ud.email === "string" ? ud.email : undefined,
          });
        }
      }
    }

    const enrichedRequests = requests.map((req) => {
      const userInfo = usersMap.get(req.userId);
      return {
        ...req,
        userName: userInfo?.fullName || null,
        userEmail: userInfo?.email || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        withdrawalRequests: enrichedRequests,
        count: enrichedRequests.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_WITHDRAWAL_REQUESTS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch withdrawal requests: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    const adminUserData = adminUserDoc.data() as Record<string, unknown> | undefined;

    if (!verifyAdmin(decodedToken, adminUserData)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = (await request.json()) as {
      requestId: string;
      status: string;
      adminNote?: string;
    };

    if (!body.requestId || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, status" },
        { status: 400 }
      );
    }

    const validStatuses: string[] = ["pending", "approved", "rejected", "processing"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pending: ["approved", "rejected", "processing"],
      processing: ["approved", "rejected"],
      approved: [],
      rejected: [],
    };

    const requestDoc = await adminDb.collection("withdrawalRequests").doc(body.requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    const currentData = requestDoc.data() as Record<string, unknown>;
    const currentStatus = safeString(currentData.status);

    if (currentStatus === body.status) {
      return NextResponse.json(
        { error: `Withdrawal request is already ${body.status}` },
        { status: 400 }
      );
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${currentStatus} -> ${body.status}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: body.status,
      updatedAt: new Date(),
    };

    if (body.adminNote) {
      updateData.adminNote = body.adminNote;
    }

    await adminDb.collection("withdrawalRequests").doc(body.requestId).update(updateData);

    const amount = safeNumber(currentData.amount);
    const userId = safeString(currentData.userId || currentData.sellerId);

    const adminName =
      typeof adminUserData?.fullName === "string"
        ? adminUserData.fullName
        : typeof adminUserData?.displayName === "string"
        ? adminUserData.displayName
        : "Unknown";

    await adminDb.collection("withdrawalAuditLogs").add({
      requestId: body.requestId,
      adminId: decodedToken.uid,
      adminName,
      previousStatus: currentStatus,
      newStatus: body.status,
      amount,
      userId,
      adminNote: body.adminNote || null,
      createdAt: new Date(),
    });

    if (body.status === "approved") {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      const userData = userDoc.data() as Record<string, unknown> | undefined;
      const currentBalance = safeNumber(userData?.walletBalance);
      const balanceBefore = currentBalance;
      const balanceAfter = currentBalance;

      await adminDb.collection("walletTransactions").add({
        userId,
        orderId: body.requestId,
        type: "WITHDRAWAL_COMPLETED",
        amount,
        currency: "NGN",
        status: "completed",
        description: `Withdrawal ${body.requestId.slice(0, 8)} approved and payout initiated`,
        metadata: {
          requestId: body.requestId,
          adminNote: body.adminNote || null,
          bankAccount: currentData.bankAccount,
        },
        balanceBefore,
        balanceAfter,
        createdAt: new Date(),
      });

      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (secretKey) {
        const bankAccount = currentData.bankAccount as Record<string, unknown> | undefined;
        const paystackResponse = await fetch("https://api.paystack.co/transfer", {
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
              name: safeString(bankAccount?.accountName) || "Unknown",
              account_number: safeString(bankAccount?.accountNumber),
              bank_code: safeString(bankAccount?.bankName),
            },
            reason: `Withdrawal payout for request ${body.requestId.slice(0, 8)}`,
          }),
        });

        const paystackData = await paystackResponse.json();

        if (paystackResponse.ok && paystackData.status === "success") {
          await adminDb.collection("transfers").doc(paystackData.data.reference).set({
            requestId: body.requestId,
            sellerId: userId,
            amount,
            status: paystackData.data.status || "pending",
            reference: paystackData.data.reference,
            transferCode: paystackData.data.transfer_code,
            recipient: paystackData.data.recipient,
            createdAt: new Date(),
          });
        } else {
          console.error(
            "Paystack transfer failed for withdrawal:",
            body.requestId,
            paystackData.message
          );
          await adminDb.collection("transferFailures").add({
            requestId: body.requestId,
            withdrawalStatus: "approved",
            amount,
            userId,
            error: safeString(paystackData.message),
            createdAt: new Date(),
          });
        }
      }
    }

    if (body.status === "rejected") {
      const userRef = adminDb.collection("users").doc(userId);

      await adminDb.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User not found for refund");
        }

        const userData = userSnap.data() as Record<string, unknown> | undefined;
        const currentBalance = safeNumber(userData?.walletBalance);
        const newBalance = currentBalance + amount;

        transaction.set(
          userRef,
          { walletBalance: newBalance, updatedAt: new Date() },
          { merge: true }
        );

        transaction.create(adminDb.collection("walletTransactions").doc(), {
          userId,
          orderId: body.requestId,
          type: "WITHDRAWAL_FAILED",
          amount,
          currency: "NGN",
          status: "failed",
          description: `Withdrawal ${body.requestId.slice(0, 8)} rejected — funds refunded`,
          metadata: {
            requestId: body.requestId,
            adminNote: body.adminNote || null,
            reason: safeString(currentData.reason),
          },
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          createdAt: new Date(),
        });
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Withdrawal request status updated",
        requestId: body.requestId,
        status: body.status,
        auditLogged: true,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_WITHDRAWAL_REQUESTS_PATCH_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to update withdrawal request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
