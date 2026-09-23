import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystemMessage: boolean;
  isRedacted: boolean;
  imageUrl: string | null;
  buyerId: string | null;
  sellerId: string | null;
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

    const snapshot = await adminDb.collection("chats").get();

    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: String(data.orderId || ""),
        senderId: String(data.senderId || ""),
        senderName: String(data.senderName || "User"),
        text: String(data.text || ""),
        isSystemMessage: Boolean(data.isSystemMessage),
        isRedacted: Boolean(data.isRedacted),
        imageUrl: data.imageUrl ? String(data.imageUrl) : null,
        buyerId: data.buyerId ? String(data.buyerId) : null,
        sellerId: data.sellerId ? String(data.sellerId) : null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date(String(data.createdAt)).toISOString(),
      };
    });

    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const orderIds = [...new Set(messages.map((m) => m.orderId))];

    const orderMap = new Map<string, { title?: string; amount?: number; status?: string; buyerId?: string; sellerId?: string; sellerName?: string }>();
    const userIds = new Set<string>();

    for (const orderId of orderIds) {
      const orderSnap = await adminDb.collection("orders").doc(orderId).get();
      const od = orderSnap.data();
      if (od) {
        orderMap.set(orderId, {
          title: od?.title,
          amount: od?.amount,
          status: od?.status,
          buyerId: od?.buyerId,
          sellerId: od?.sellerId,
          sellerName: od?.sellerName,
        });
        if (od?.buyerId) userIds.add(od.buyerId);
        if (od?.sellerId) userIds.add(od.sellerId);
      }
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data();
      if (ud) {
        usersMap.set(uid, {
          fullName: ud?.fullName,
          email: ud?.email,
        });
      }
    }

    const chatSessions: Array<{
      orderId: string;
      title?: string;
      amount?: number;
      status?: string;
      buyerName: string;
      buyerEmail: string;
      sellerName: string;
      sellerEmail: string;
      messageCount: number;
      lastMessageAt: string;
      messages: ChatMessage[];
    }> = [];

    for (const orderId of orderIds) {
      const orderInfo = orderMap.get(orderId) || {};
      const orderMessages = messages.filter((m) => m.orderId === orderId);
      const lastMsg = orderMessages[orderMessages.length - 1];

      const buyerId = orderInfo.buyerId || "";
      const sellerId = orderInfo.sellerId || "";
      const buyerInfo = usersMap.get(buyerId) || {};
      const sellerInfo = usersMap.get(sellerId) || {};

      chatSessions.push({
        orderId,
        title: orderInfo.title,
        amount: orderInfo.amount,
        status: orderInfo.status,
        buyerName: buyerInfo.fullName || buyerId.slice(0, 8),
        buyerEmail: buyerInfo.email || "N/A",
        sellerName: sellerInfo.fullName || sellerId.slice(0, 8),
        sellerEmail: sellerInfo.email || "N/A",
        messageCount: orderMessages.length,
        lastMessageAt: lastMsg?.createdAt || "",
        messages: orderMessages,
      });
    }

    chatSessions.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ success: true, chatSessions }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_CHATS_ERROR]:", error);
    return NextResponse.json({ error: `Failed to fetch chats: ${errorMessage}` }, { status: 500 });
  }
}
