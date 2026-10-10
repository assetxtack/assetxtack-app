import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { parseTimestamp, safeString, verifyAdmin } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

interface AppealEntry {
  id: string;
  userId: string;
  orderId?: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  proofUrls: string[];
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  isAppeal: boolean;
  banCategory?: string | null;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedBy?: string | null;
  bannedUserEmail?: string | null;
  bannedUserName?: string | null;
  originalBanUid?: string | null;
}

interface AppealMessageEntry {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized: No token provided", status: 401, adminDb: null, decodedToken: null };
  }

  const token = authHeader.substring(7);
  let decodedToken: { uid: string };
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return { error: "Authentication not available", status: 500, adminDb: null, decodedToken: null };
    }
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    return { error: "Unauthorized: Invalid token", status: 401, adminDb: null, decodedToken: null };
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return { error: "Database not available", status: 500, adminDb: null, decodedToken: null };
  }

  const adminUserDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
  const adminUserData = adminUserDoc.data() as Record<string, unknown> | undefined;

  if (!verifyAdmin(decodedToken, adminUserData)) {
    return { error: "Unauthorized: Admin access required", status: 403, adminDb: null, decodedToken: null };
  }

  return { adminDb, decodedToken };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messagesFor = searchParams.get("messages");

    const authResult = await authenticate(request);
    if (authResult.adminDb === null) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const adminDb = authResult.adminDb!;

    if (messagesFor) {
      const snapshot = await adminDb
        .collection("supportTickets")
        .doc(messagesFor)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .get();

      const messages: AppealMessageEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const createdAtDate = parseTimestamp(data.createdAt);

        return {
          id: doc.id,
          senderId: safeString(data.senderId),
          senderName: safeString(data.senderName) || "Unknown",
          text: safeString(data.text) || "",
          isAdmin: Boolean(data.isAdmin),
          createdAt:
            createdAtDate?.toISOString() || new Date().toISOString(),
        };
      });

      return NextResponse.json(
        { success: true, messages },
        { status: 200 }
      );
    }

    const snapshot = await adminDb
      .collection("supportTickets")
      .where("isAppeal", "==", true)
      .get();

    const appeals: AppealEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtDate = parseTimestamp(data.createdAt);
      const updatedAtDate = parseTimestamp(data.updatedAt);
      const bannedAtDate = parseTimestamp(data.bannedAt);

      return {
        id: doc.id,
        userId: safeString(data.userId),
        orderId: data.orderId ? safeString(data.orderId) : null,
        subject: safeString(data.subject) || "(No Subject)",
        message: safeString(data.message) || "",
        category: safeString(data.category) || "Uncategorized",
        status: safeString(data.status) || "open",
        priority: safeString(data.priority) || "medium",
        proofUrls: Array.isArray(data.proofUrls)
          ? data.proofUrls.map(String)
          : [],
        createdAt:
          createdAtDate?.toISOString() || new Date().toISOString(),
        updatedAt:
          updatedAtDate?.toISOString() ||
          createdAtDate?.toISOString() ||
          new Date().toISOString(),
        userName: null,
        userEmail: null,
        isAppeal: Boolean(data.isAppeal),
        banCategory: data.banCategory ? safeString(data.banCategory) : null,
        banReason: data.banReason ? safeString(data.banReason) : null,
        bannedAt: bannedAtDate?.toISOString() || null,
        bannedBy: data.bannedBy ? safeString(data.bannedBy) : null,
        bannedUserEmail: data.bannedUserEmail ? safeString(data.bannedUserEmail) : null,
        bannedUserName: data.bannedUserName ? safeString(data.bannedUserName) : null,
        originalBanUid: data.originalBanUid ? safeString(data.originalBanUid) : null,
      };
    });

    appeals.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    for (const appeal of appeals) {
      userIds.add(appeal.userId);
      if (appeal.originalBanUid) userIds.add(appeal.originalBanUid);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string; banCategory?: string; banReason?: string; bannedAt?: unknown; status?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data() as Record<string, unknown> | undefined;
      if (ud) {
        usersMap.set(uid, {
          fullName: typeof ud.fullName === "string" ? ud.fullName : undefined,
          email: typeof ud.email === "string" ? ud.email : undefined,
          banCategory: typeof ud.banCategory === "string" ? ud.banCategory : undefined,
          banReason: typeof ud.banReason === "string" ? ud.banReason : undefined,
          bannedAt: ud.bannedAt,
          status: typeof ud.status === "string" ? ud.status : undefined,
        });
      }
    }

    const enrichedAppeals = appeals.map((appeal) => {
      const userInfo = usersMap.get(appeal.userId);
      const banUserInfo = appeal.originalBanUid ? usersMap.get(appeal.originalBanUid) : null;
      return {
        ...appeal,
        userName: userInfo?.fullName || appeal.bannedUserName || null,
        userEmail: userInfo?.email || appeal.bannedUserEmail || null,
        banCategory: appeal.banCategory || banUserInfo?.banCategory || null,
        banReason: appeal.banReason || banUserInfo?.banReason || null,
        bannedAt: appeal.bannedAt || (banUserInfo?.bannedAt ? parseTimestamp(banUserInfo.bannedAt)?.toISOString() || null : null),
        bannedBy: appeal.bannedBy || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        appeals: enrichedAppeals,
        count: enrichedAppeals.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_APPEALS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch appeals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await authenticate(request);
    if (authResult.adminDb === null) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const adminDb = authResult.adminDb!;

    const body = await request.json();
    const { ticketId, status, sendResponse, responseText } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: ticketId, status" },
        { status: 400 }
      );
    }

    const validStatuses = ["open", "under_review", "resolved", "action_required"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const ticketDoc = await adminDb
      .collection("supportTickets")
      .doc(ticketId)
      .get();
    if (!ticketDoc.exists) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }

    const ticketData = ticketDoc.data() as Record<string, unknown>;
    if (!ticketData.isAppeal) {
      return NextResponse.json(
        { error: "This ticket is not an appeal" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "resolved" && ticketData.originalBanUid) {
      updateData.banResolved = true;
      updateData.banResolvedAt = new Date();
      updateData.banResolvedBy = authResult.decodedToken.uid;
    }

    await adminDb.collection("supportTickets").doc(ticketId).update(updateData);

    if (sendResponse && responseText) {
      await adminDb
        .collection("supportTickets")
        .doc(ticketId)
        .collection("messages")
        .add({
          senderId: authResult.decodedToken.uid,
          senderName: "Admin",
          text: responseText,
          isAdmin: true,
          createdAt: new Date(),
        });
    }

    if (ticketData.isAppeal) {
      const targetUid =
        typeof ticketData.originalBanUid === "string"
          ? ticketData.originalBanUid
          : typeof ticketData.userId === "string"
            ? ticketData.userId
            : "";
      if (!targetUid) {
        return NextResponse.json({ error: "Appeal is missing its user ID" }, { status: 400 });
      }
      const userRef = adminDb.collection("users").doc(targetUid);
      const userSnap = await userRef.get();
      if (userSnap.exists && status === "resolved") {
        await userRef.set(
          {
            banResolved: true,
            banResolvedAt: new Date(),
            status: "active",
          },
          { merge: true }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Appeal updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_APPEALS_POST_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to update appeal: ${errorMessage}` },
      { status: 500 }
    );
  }
}
