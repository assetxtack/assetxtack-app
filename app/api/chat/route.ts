import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

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
    const q = messagesRef.where("orderId", "==", orderId).orderBy("createdAt", "asc");
    const snapshot = await q.get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
  try {
    const body = await request.json();
    const { orderId, senderId, senderName, text, isSystemMessage, isRedacted } = body;

    if (!orderId || !senderId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const messageRef = await adminDb.collection("chats").add({
      orderId,
      senderId,
      senderName: senderName || "User",
      text,
      isSystemMessage: Boolean(isSystemMessage),
      isRedacted: Boolean(isRedacted),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send message:", errorMessage, error);
    return NextResponse.json({ error: `Failed to send message: ${errorMessage}` }, { status: 500 });
  }
}
