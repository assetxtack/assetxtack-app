import { NextResponse } from "next/server";
import { createSupportTicket, getSupportTickets } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const tickets = await getSupportTickets(userId);

    return NextResponse.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch tickets";
    console.error("Fetch tickets error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, orderId, subject, message, category, proofUrls } = body;

    if (!userId || !subject || !message || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, subject, message, category" },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket({
      userId,
      orderId,
      subject,
      message,
      category,
      proofUrls: proofUrls || [],
    });

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create ticket";
    console.error("Create ticket error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
