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

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: { id: orderSnap.id, ...orderSnap.data() },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to fetch order: ${errorMessage}` }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, completedAt, disputedAt } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "COMPLETED" && completedAt) {
      updateData.completedAt = new Date(completedAt);
    }
    if (status === "DISPUTED" && disputedAt) {
      updateData.disputedAt = new Date(disputedAt);
    }

    await adminDb.collection("orders").doc(orderId).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update order:", errorMessage, error);
    return NextResponse.json({ error: `Failed to update order: ${errorMessage}` }, { status: 500 });
  }
}
