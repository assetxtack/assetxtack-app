import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      rank,
      skinsCount,
      heroesCount,
      winRate,
      price,
      feePercentage,
      loginMethod,
      description,
      featuredSkins,
      isFeatured,
      hasShieldProtection,
      listingPlan,
      sellerId,
      sellerName,
      sellerVerified,
      sellerRating,
      images,
      moontonStatus,
      vkBoundStatus,
      facebookBoundStatus,
      tiktokBoundStatus,
      googlePlayStatus,
      appleIdStatus,
      accountEmail,
      accountPassword,
      secondaryPassword,
      has2FA,
      twoFactorDetails,
    } = body;

    if (!title || !sellerId || !price) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, sellerId, price" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 });
    }

    const numericPrice = Number(price);
    const calculatedFee = Math.round((numericPrice * (feePercentage || 5)) / 100);

    const listingData = {
      title,
      rank: rank || "",
      skinsCount: Number(skinsCount) || 0,
      heroesCount: Number(heroesCount) || 0,
      winRate: winRate || "N/A",
      price: numericPrice,
      calculatedFee,
      netPayout: numericPrice - calculatedFee,
      feePercentage: feePercentage || 5,
      loginMethod: loginMethod || "Moonton Account",
      description: description || "",
      featuredSkins: featuredSkins || [],
      isFeatured: Boolean(isFeatured),
      hasShieldProtection: Boolean(hasShieldProtection),
      listingPlan: listingPlan || "standard",
      sellerId,
      sellerName: sellerName || "Seller",
      sellerVerified: Boolean(sellerVerified),
      sellerRating: sellerRating || 5.0,
      status: "Active",
      views: 0,
      images: images || [],
      createdAt: new Date(),
      updatedAt: new Date(),

      moontonStatus: moontonStatus || "Clean Email (Handover Ready)",
      vkBoundStatus: vkBoundStatus || "Unbound",
      facebookBoundStatus: facebookBoundStatus || "Unbound",
      tiktokBoundStatus: tiktokBoundStatus || "Unbound",
      googlePlayStatus: googlePlayStatus || "Unbound",
      appleIdStatus: appleIdStatus || "Unbound",

      accountEmail: accountEmail || "",
      accountPassword: accountPassword || "",
      secondaryPassword: secondaryPassword || "",
      has2FA: has2FA || "No",
      twoFactorDetails: twoFactorDetails || "",
    };

    const docRef = await adminDb.collection("listings").add(listingData);

    return NextResponse.json({
      success: true,
      listingId: docRef.id,
      listing: { id: docRef.id, ...listingData },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create listing";
    console.error("Create listing error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
