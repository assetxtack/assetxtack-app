import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const reviewId = new URL(request.url).pathname.split("/").pop();
    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (numericRating < 1 || numericRating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const reviewRef = adminDb.collection("reviews").doc(reviewId);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const reviewData = reviewSnap.data() as Record<string, unknown>;
    const oldRating = Number(reviewData.rating || 0);
    const sellerId = String(reviewData.sellerId || "");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (rating !== undefined) updateData.rating = Number(rating);
    if (comment !== undefined) updateData.comment = comment;

    await reviewRef.update(updateData);

    if (sellerId && rating !== undefined) {
      const delta = Number(rating) - oldRating;
      await updateSellerRating(adminDb, sellerId, delta, 0);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update review:", errorMessage, error);
    return NextResponse.json({ error: `Failed to update review: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const reviewId = new URL(request.url).pathname.split("/").pop();
    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const reviewRef = adminDb.collection("reviews").doc(reviewId);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const reviewData = reviewSnap.data() as Record<string, unknown>;
    const oldRating = Number(reviewData.rating || 0);
    const sellerId = String(reviewData.sellerId || "");

    await reviewRef.delete();

    if (sellerId) {
      await updateSellerRating(adminDb, sellerId, -oldRating, -1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete review:", errorMessage, error);
    return NextResponse.json({ error: `Failed to delete review: ${errorMessage}` }, { status: 500 });
  }
}

async function updateSellerRating(
  adminDb: ReturnType<typeof getAdminFirestore>,
  sellerId: string,
  ratingDelta: number,
  reviewCountDelta = 1
) {
  if (!adminDb) {
    throw new Error("Database not available");
  }

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
