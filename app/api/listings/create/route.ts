import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { validateListingPayload } from "@/lib/listings/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      price,
      accountType,
      gameId,
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
      feePercentage,
      gameAttributes = {},
      credentials = {},

      // Backward-compatible root-level fields
      rank,
      skinsCount,
      heroesCount,
      winRate,
      loginMethod,
      loginProvider,
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
    } = body ?? {};

    if (!title || !sellerId || !price) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, sellerId, price" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const validation = validateListingPayload({
      userId: sellerId,
      gameId: gameId ?? "",
      title,
      price: numericPrice,
      accountType,
      gameAttributes,
      credentials,
    });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.message || "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 500 });
    }

    const effectiveFeePercentage = Number(feePercentage) || 5;
    const calculatedFee = Math.round((numericPrice * effectiveFeePercentage) / 100);
    const netPayout = numericPrice - calculatedFee;

    const safeAttrs = gameAttributes && typeof gameAttributes === "object" ? gameAttributes : {};
    const safeCreds = credentials && typeof credentials === "object" ? credentials : {};

    const mergedGameAttributes: Record<string, string | number | boolean> = {
      ...safeAttrs,
    };
    if (rank !== undefined && rank !== "") mergedGameAttributes.rank = rank;
    if (skinsCount !== undefined && skinsCount !== "") mergedGameAttributes.skinsCount = Number(skinsCount) || 0;
    if (heroesCount !== undefined && heroesCount !== "") mergedGameAttributes.heroesCount = Number(heroesCount) || 0;
    if (winRate !== undefined && winRate !== "") mergedGameAttributes.winRate = winRate;

    const mergedCredentials: Record<string, string | boolean> = { ...safeCreds };
    const legacyCredentialFields: Record<string, string | undefined> = {
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
    };
    for (const [key, value] of Object.entries(legacyCredentialFields)) {
      if (value !== undefined && value !== null && value !== "") {
        mergedCredentials[key] = value as string;
      }
    }

    const listingData: Record<string, unknown> = {
      title,
      gameId: gameId || "",
      price: numericPrice,
      calculatedFee,
      netPayout,
      feePercentage: effectiveFeePercentage,
      accountType: accountType || "Full Account Transfer",
      loginMethod: loginMethod || loginProvider || "Email",
      description: description || "",
      featuredSkins: Array.isArray(featuredSkins) ? featuredSkins : [],
      isFeatured: Boolean(isFeatured),
      hasShieldProtection: Boolean(hasShieldProtection),
      listingPlan: listingPlan || "standard",
      sellerId,
      sellerName: sellerName || "Seller",
      sellerVerified: Boolean(sellerVerified),
      sellerRating: sellerRating ?? 5.0,
      status: "Active",
      views: 0,
      images: Array.isArray(images) ? images : [],
      createdAt: new Date(),
      updatedAt: new Date(),

      // Nested structured payload
      gameAttributes: mergedGameAttributes,
      credentials: mergedCredentials,

      // Backward-compatible root-level fields for legacy readers
      rank: rank ?? (mergedGameAttributes.rank as string | undefined) ?? "",
      skinsCount: Number(skinsCount) || Number(mergedGameAttributes.skinsCount) || 0,
      heroesCount: Number(heroesCount) || Number(mergedGameAttributes.heroesCount) || 0,
      winRate: winRate ?? (mergedGameAttributes.winRate as string | undefined) ?? "N/A",
      moontonStatus: moontonStatus ?? mergedCredentials.moontonStatus ?? "",
      vkBoundStatus: vkBoundStatus ?? mergedCredentials.vkBoundStatus ?? "",
      facebookBoundStatus: facebookBoundStatus ?? mergedCredentials.facebookBoundStatus ?? "",
      tiktokBoundStatus: tiktokBoundStatus ?? mergedCredentials.tiktokBoundStatus ?? "",
      googlePlayStatus: googlePlayStatus ?? mergedCredentials.googlePlayStatus ?? "",
      appleIdStatus: appleIdStatus ?? mergedCredentials.appleIdStatus ?? "",
      accountEmail: accountEmail ?? mergedCredentials.accountEmail ?? "",
      accountPassword: accountPassword ?? mergedCredentials.accountPassword ?? "",
      secondaryPassword: secondaryPassword ?? mergedCredentials.secondaryPassword ?? "",
      has2FA: has2FA ?? mergedCredentials.has2FA ?? "No",
      twoFactorDetails: twoFactorDetails ?? mergedCredentials.twoFactorDetails ?? "",
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