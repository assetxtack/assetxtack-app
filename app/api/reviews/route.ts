import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const orderId = searchParams.get("orderId");

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    if (orderId) {
      const reviewsRef = adminDb.collection("reviews");
      const q = reviewsRef.where("orderId", "==", orderId);
      const snapshot = await q.get();
      const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, reviews });
    }

    if (sellerId) {
      const reviewsRef = adminDb.collection("reviews");
      const q = reviewsRef.where("sellerId", "==", sellerId).orderBy("createdAt", "desc");
      const snapshot = await q.get();
      const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, reviews });
    }

    return NextResponse.json({ error: "sellerId or orderId is required" }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch reviews:", errorMessage, error);
    return NextResponse.json({ error: `Failed to fetch reviews: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, listingId, sellerId, buyerId, rating, comment } = body;

    if (!orderId || !listingId || !sellerId || !buyerId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
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

    const orderData = orderSnap.data() as Record<string, unknown>;
    if (orderData?.status !== "COMPLETED") {
      return NextResponse.json({ error: "Only completed orders can be reviewed" }, { status: 400 });
    }

    if (orderData?.buyerId !== buyerId) {
      return NextResponse.json({ error: "Only the buyer can review this order" }, { status: 403 });
    }

    if (orderData?.sellerId !== sellerId) {
      return NextResponse.json({ error: "Invalid seller for this order" }, { status: 403 });
    }

    if (orderData?.listingId && orderData.listingId !== listingId) {
      return NextResponse.json({ error: "Invalid listing for this order" }, { status: 403 });
    }

    const reviewsRef = adminDb.collection("reviews");
    const existingQuery = reviewsRef.where("orderId", "==", orderId);
    const existingSnap = await existingQuery.get();

    if (!existingSnap.empty) {
      return NextResponse.json({ error: "You have already reviewed this order" }, { status: 400 });
    }

    const reviewRef = await reviewsRef.add({
      orderId,
      listingId,
      sellerId,
      buyerId,
      rating: numericRating,
      comment: comment || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateSellerRating(adminDb, sellerId, numericRating, 1);

    await sendNotification({
      userId: sellerId,
      orderId,
      title: "New Review Received",
      message: `You received a ${numericRating}-star review on order #${orderId.slice(0, 6)}.`,
      type: "REVIEW_RECEIVED",
    });

    return NextResponse.json({ success: true, reviewId: reviewRef.id }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create review:", errorMessage, error);
    return NextResponse.json({ error: `Failed to create review: ${errorMessage}` }, { status: 500 });
  }
}

async function updateSellerRating(
  adminDb: ReturnType<typeof getAdminFirestore>,
  sellerId: string,
  ratingDelta: number,
  reviewCountDelta = 1
) {
  const statsRef = adminDb.collection("reviewStats").doc(sellerId);
  const statsSnap = await statsRef.get();

  let totalReviews: number;
  let totalRatingSum: number;

  if (statsSnap.exists) {
    const stats = statsSnap.data() as Record<string, unknown>;
    totalReviews = Number(stats.totalReviews || 0);
    totalRatingSum = Number(stats.totalRatingSum || 0);
  } else {
    totalReviews = 0;
    totalRatingSum = 0;
  }

  totalReviews = Math.max(0, totalReviews + reviewCountDelta);
  totalRatingSum = Math.max(0, totalRatingSum + ratingDelta);

  const average = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 5.0;

  await statsRef.set(
    {
      sellerId,
      totalReviews,
      totalRatingSum,
      averageRating: average,
      lastUpdated: new Date(),
    },
    { merge: true }
  );

  const userRef = adminDb.collection("users").doc(sellerId);
  await userRef.set(
    {
      averageRating: average,
      totalReviews,
    },
    { merge: true }
  );
}
