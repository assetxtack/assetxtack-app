import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { parseTimestamp, safeString, verifyAdmin } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export type NotificationType =
  | "ESCROW_LOCKED"
  | "ESCROW_DELIVERED"
  | "NEW_MESSAGE"
  | "CHAT"
  | "DISPUTE_RAISED"
  | "DISPUTE"
  | "ORDER_COMPLETED"
  | "CREDENTIALS_DELIVERED"
  | "REVIEW_RECEIVED"
  | "TAMPERING_REPORT";

interface NotificationEntry {
  id: string;
  userId: string;
  orderId: string | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  orderTitle: string | null;
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

    const snapshot = await adminDb.collection("notifications").get();

    const notifications: NotificationEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtDate = parseTimestamp(data.createdAt);

      return {
        id: doc.id,
        userId: safeString(data.userId),
        orderId: data.orderId ? safeString(data.orderId) : null,
        title: safeString(data.title) || "",
        message: safeString(data.message) || "",
        type: safeString(data.type) || "UNKNOWN",
        read: data.read === true,
        createdAt: createdAtDate?.toISOString() || new Date().toISOString(),
        userName: null,
        userEmail: null,
        orderTitle: null,
      };
    });

    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    const orderIds = new Set<string>();
    for (const n of notifications) {
      userIds.add(n.userId);
      if (n.orderId) orderIds.add(n.orderId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const ud = userSnap.data() as Record<string, unknown> | undefined;
        if (ud) {
          usersMap.set(uid, {
            fullName: typeof ud.fullName === "string" ? ud.fullName : undefined,
            email: typeof ud.email === "string" ? ud.email : undefined,
          });
        }
      }
    }

    const ordersMap = new Map<string, { title?: string }>();
    for (const oid of orderIds) {
      const orderSnap = await adminDb.collection("orders").doc(oid).get();
      if (orderSnap.exists) {
        const od = orderSnap.data() as Record<string, unknown> | undefined;
        if (od) {
          ordersMap.set(oid, {
            title: typeof od.title === "string" ? od.title : undefined,
          });
        }
      }
    }

    const enrichedNotifications = notifications.map((n) => {
      const userInfo = usersMap.get(n.userId);
      const orderInfo = n.orderId ? ordersMap.get(n.orderId) : undefined;
      return {
        ...n,
        userName: userInfo?.fullName || null,
        userEmail: userInfo?.email || null,
        orderTitle: orderInfo?.title || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        notifications: enrichedNotifications,
        count: enrichedNotifications.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_NOTIFICATIONS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch notifications: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      userId: string;
      orderId?: string;
      title: string;
      message: string;
      type: string;
    };

    if (!body.userId || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, title, message" },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection("notifications").add({
      userId: body.userId,
      orderId: body.orderId || null,
      title: body.title,
      message: body.message,
      type: body.type || "CHAT",
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification sent successfully",
        id: docRef.id,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_NOTIFICATIONS_POST_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to send notification: ${errorMessage}` },
      { status: 500 }
    );
  }
}
