import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { parseTimestamp, safeString, verifyAdmin } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

interface SupportTicketEntry {
  id: string;
  userId: string;
  orderId?: string;
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
}

interface TicketMessageEntry {
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

      const messages: TicketMessageEntry[] = snapshot.docs.map((doc) => {
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

    const snapshot = await adminDb.collection("supportTickets").get();

    const tickets: SupportTicketEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtDate = parseTimestamp(data.createdAt);
      const updatedAtDate = parseTimestamp(data.updatedAt);

      return {
        id: doc.id,
        userId: safeString(data.userId),
        orderId: data.orderId ? safeString(data.orderId) : undefined,
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
      };
    });

    tickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    for (const ticket of tickets) {
      userIds.add(ticket.userId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data() as Record<string, unknown> | undefined;
      if (ud) {
        usersMap.set(uid, {
          fullName: typeof ud.fullName === "string" ? ud.fullName : undefined,
          email: typeof ud.email === "string" ? ud.email : undefined,
        });
      }
    }

    const enrichedTickets = tickets.map((ticket) => {
      const userInfo = usersMap.get(ticket.userId);
      return {
        ...ticket,
        userName: userInfo?.fullName || null,
        userEmail: userInfo?.email || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        tickets: enrichedTickets,
        count: enrichedTickets.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_SUPPORT_TICKETS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch support tickets: ${errorMessage}` },
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
    const { ticketId, status } = body;

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
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await adminDb.collection("supportTickets").doc(ticketId).update({
      status,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, message: "Ticket status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_SUPPORT_TICKETS_POST_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to update ticket: ${errorMessage}` },
      { status: 500 }
    );
  }
}
