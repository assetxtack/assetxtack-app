import { NextResponse } from "next/server";
import { addTicketMessage } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, senderId, senderName, text, isAdmin, ticketUserId } = body;

    if (!ticketId || !senderId || !text) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: ticketId, senderId, text" },
        { status: 400 }
      );
    }

    await addTicketMessage(ticketId, {
      senderId,
      senderName: senderName || "User",
      text,
      isAdmin: isAdmin ?? false,
      ticketUserId,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send message";
    console.error("Send ticket message error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
