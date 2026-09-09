import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const SENSITIVE_PATTERNS: RegExp[] = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /(https?:\/\/)?(chat\.)?whatsapp\.com\/[a-zA-Z0-9-]+/i,
  /wa\.me\/[0-9]+/i,
  /(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am|ig\.me)\/[a-zA-Z0-9_.]+/i,
  /@[a-zA-Z0-9_.]{3,}/,
  /(https?:\/\/)?t\.me\/[a-zA-Z0-9_]+/i,
  /0(7|8|9)(0|1)\d{8}/,
  /\+\s*234\s*(7|8|9)\d{9}/,
  /(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+/i,
  /(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+/i,
];

function detectSensitiveContent(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

function normalizeTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  return new Date().toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const messagesRef = adminDb.collection("chats");
    const q = messagesRef.where("orderId", "==", orderId);
    const snapshot = await q.get();

    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: String(data.orderId || orderId),
        senderId: String(data.senderId || ""),
        senderName: String(data.senderName || "User"),
        text: String(data.text || ""),
        isSystemMessage: Boolean(data.isSystemMessage),
        isRedacted: Boolean(data.isRedacted),
        imageUrl: data.imageUrl ? String(data.imageUrl) : null,
        buyerId: data.buyerId ? String(data.buyerId) : null,
        sellerId: data.sellerId ? String(data.sellerId) : null,
        createdAt: normalizeTimestamp(data.createdAt),
      };
    });

    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch chat messages:", errorMessage, error);
    return NextResponse.json({ error: `Failed to fetch messages: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = `chat-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    console.log(`[${requestId}] === POST /api/chat START ===`);
    console.log(`[${requestId}] Parsing request body...`);

    const body = await request.json();
    const { orderId, senderId, senderName, text, isSystemMessage, imageUrl } = body;

    console.log(`[${requestId}] Body extracted:`, {
      orderId: orderId ? String(orderId).slice(0, 8) + "..." : "(missing)",
      senderId: senderId ? String(senderId).slice(0, 8) + "..." : "(missing)",
      senderName: senderName || "(missing)",
      hasText: text ? text.length + " chars" : "(empty)",
      hasImage: imageUrl ? "yes" : "no",
      isSystemMessage: Boolean(isSystemMessage),
    });

    if (!orderId || !senderId || (!text && !imageUrl)) {
      console.error(`[${requestId}] Validation failed: missing required fields`, {
        hasOrderId: !!orderId,
        hasSenderId: !!senderId,
        hasText: !!text,
        hasImageUrl: !!imageUrl,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            orderId: !!orderId,
            senderId: !!senderId,
            text: !!text,
            imageUrl: !!imageUrl,
          },
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Initializing Firebase Admin SDK...`);
    const adminDb = getAdminFirestore();

    if (!adminDb) {
      console.error(`[${requestId}] getAdminFirestore() returned null — admin SDK not initialized`);
      return NextResponse.json(
        { error: "Database not available", details: "getAdminFirestore() returned null" },
        { status: 500 }
      );
    }
    console.log(`[${requestId}] Firebase Admin SDK initialized successfully`);

    console.log(`[${requestId}] Fetching order document: orders/${orderId}...`);
    const orderSnap = await adminDb.collection("orders").doc(orderId).get();

    if (!orderSnap.exists) {
      console.error(`[${requestId}] Order document NOT FOUND: orders/${orderId}`);
      return NextResponse.json(
        { error: "Order not found", details: `No order document at orders/${orderId}` },
        { status: 404 }
      );
    }
    console.log(`[${requestId}] Order document found, exists=true`);

    const orderData = orderSnap.data() as Record<string, unknown>;
    const buyerId = String(orderData?.buyerId || "");
    const sellerId = String(orderData?.sellerId || "");

    console.log(`[${requestId}] Order participants:`, {
      buyerId: buyerId ? buyerId.slice(0, 8) + "..." : "(empty)",
      sellerId: sellerId ? sellerId.slice(0, 8) + "..." : "(empty)",
      orderDataKeys: Object.keys(orderData || {}),
    });

    console.log(`[${requestId}] Checking for sensitive content in text...`);
    const isSensitive = text ? detectSensitiveContent(String(text)) : false;
    const isRedacted = isSensitive;
    console.log(`[${requestId}] Sensitive content detected: ${isSensitive}`);

    const payload: Record<string, unknown> = {
      orderId,
      senderId,
      senderName: senderName || "User",
      text: text || "",
      imageUrl: imageUrl || null,
      isSystemMessage: Boolean(isSystemMessage),
      isRedacted,
      buyerId,
      sellerId,
      createdAt: new Date(),
    };

    console.log(`[${requestId}] Writing message to chats collection...`, {
      orderId: String(orderId).slice(0, 8) + "...",
      senderId: String(senderId).slice(0, 8) + "...",
      payloadKeys: Object.keys(payload),
    });

    const messageRef = await adminDb.collection("chats").add(payload);
    console.log(`[${requestId}] Message written successfully — docId: ${messageRef.id}`);

    if (!isSystemMessage && orderId) {
      const recipientId = senderId === buyerId ? sellerId : buyerId;

      if (recipientId && recipientId !== senderId) {
        const preview = imageUrl
          ? "Sent an image attachment"
          : isSensitive
          ? `${senderName || "User"}: sent a redacted message`
          : `${senderName || "User"}: "${String(text).slice(0, 40)}${String(text).length > 40 ? "..." : ""}"`;

        console.log(`[${requestId}] Sending notification to recipient: ${recipientId.slice(0, 8)}...`);
        try {
          await sendNotification({
            userId: recipientId,
            orderId,
            title: `New message on order #${orderId.slice(0, 6)}`,
            message: preview,
            type: "CHAT",
          });
          console.log(`[${requestId}] Notification sent successfully`);
        } catch (notifErr) {
          const notifErrMsg = notifErr instanceof Error ? notifErr.message : String(notifErr);
          console.error(`[${requestId}] Notification sending failed (non-blocking):`, notifErrMsg);
        }
      } else {
        console.log(`[${requestId}] Skipping notification — recipientId: "${recipientId}", senderId matches or empty`);
      }
    }

    if (isSensitive) {
      console.log(`[${requestId}] Posting system redaction notice to chats collection...`);
      try {
        const systemNoticeRef = await adminDb.collection("chats").add({
          orderId,
          senderId: "SYSTEM",
          senderName: "System Guard",
          text: "A message was automatically redacted because it may contain sensitive contact information (email, phone numbers, or social media links). Sharing off-platform contact details is prohibited. Please keep all communication within this secure Trade Chat.",
          imageUrl: null,
          isSystemMessage: true,
          isRedacted: false,
          buyerId,
          sellerId,
          createdAt: new Date(),
        });
        console.log(`[${requestId}] System notice posted — docId: ${systemNoticeRef.id}`);
      } catch (sysErr) {
        const sysErrMsg = sysErr instanceof Error ? sysErr.message : String(sysErr);
        console.error(`[${requestId}] System notice posting failed (non-blocking):`, sysErrMsg);
      }
    }

    console.log(`[${requestId}] === POST /api/chat SUCCESS ===`);
    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      redacted: isRedacted,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${requestId}] === POST /api/chat FAILED ===`);
    console.error(`[${requestId}] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`[${requestId}] Error message:`, errorMessage);
    console.error(`[${requestId}] Full error:`, error);

    if (error instanceof Error && error.stack) {
      console.error(`[${requestId}] Stack trace:`, error.stack);
    }

    return NextResponse.json(
      {
        error: `Failed to send message: ${errorMessage}`,
        details: {
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
