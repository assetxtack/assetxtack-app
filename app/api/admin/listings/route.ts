import { NextResponse } from "next/server";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase-admin";
import { getGameConfig } from "@/lib/config/gameConfigs";

export const dynamic = "force-dynamic";

interface ListingEntry {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  price: number;
  calculatedFee?: number;
  netPayout?: number;
  feePercentage?: number;
  listingPlan?: string;
  accountType: string;
  loginMethod?: string;
  description: string;
  featuredSkins?: string[];
  isFeatured: boolean;
  hasShieldProtection: boolean;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating?: number;
  status: string;
  views?: number;
  images?: string[];
  rank?: string;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  createdAt: string;
  updatedAt?: string;
  buyerName: string | null;
  buyerEmail: string | null;
  sellerNameResolved: string | null;
  sellerEmail: string | null;
}

function parseTimestamp(value: unknown): Date | undefined {
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      try {
        return obj.toDate() as Date;
      } catch {
        return undefined;
      }
    }
    if (typeof obj.seconds === "number" && typeof obj.nanos === "number") {
      try {
        return new Date(obj.seconds * 1000 + obj.nanos / 1e6);
      } catch {
        return undefined;
      }
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function safeString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function safeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function safeBoolean(value: unknown): boolean {
  return Boolean(value);
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

    const isAdmin =
      adminUserData?.role === "admin" ||
      adminUserData?.isAdmin === true ||
      decodedToken.uid === process.env.ADMIN_UID;

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("listings").get();

    const entries: ListingEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;

      const gameConfig = getGameConfig(safeString(data.gameId));

      return {
        id: doc.id,
        title: safeString(data.title) || "Untitled",
        gameId: safeString(data.gameId),
        gameName: safeString(data.gameName) || gameConfig?.name || "Unknown Game",
        price: safeNumber(data.price) || 0,
        calculatedFee: safeNumber(data.calculatedFee),
        netPayout: safeNumber(data.netPayout),
        feePercentage: safeNumber(data.feePercentage),
        listingPlan: safeString(data.listingPlan),
        accountType: safeString(data.accountType) || "Standard",
        loginMethod: safeString(data.loginMethod),
        description: safeString(data.description),
        featuredSkins: Array.isArray(data.featuredSkins) ? data.featuredSkins.map(String) : undefined,
        isFeatured: safeBoolean(data.isFeatured),
        hasShieldProtection: safeBoolean(data.hasShieldProtection),
        sellerId: safeString(data.sellerId),
        sellerName: safeString(data.sellerName) || "Seller",
        sellerVerified: safeBoolean(data.sellerVerified),
        sellerRating: safeNumber(data.sellerRating),
        status: safeString(data.status) || "unknown",
        views: safeNumber(data.views),
        images: Array.isArray(data.images) ? data.images.map(String) : undefined,
        rank: safeString(data.rank),
        skinsCount: safeNumber(data.skinsCount),
        heroesCount: safeNumber(data.heroesCount),
        winRate: safeString(data.winRate),
        createdAt: parseTimestamp(data.createdAt)?.toISOString() || new Date().toISOString(),
        updatedAt: parseTimestamp(data.updatedAt)?.toISOString(),
        buyerName: null,
        buyerEmail: null,
        sellerNameResolved: null,
        sellerEmail: null,
      };
    });

    entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const userIds = new Set<string>();
    for (const entry of entries) {
      if (entry.sellerId) userIds.add(entry.sellerId);
    }

    const usersMap = new Map<string, { fullName?: string; email?: string }>();
    for (const uid of userIds) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const ud = userSnap.data() as Record<string, unknown> | undefined;
      if (ud) {
        usersMap.set(uid, {
          fullName: typeof ud.fullName === "string" ? ud.fullName : undefined,
          email: typeof ud.email === "string" ? ud.email : undefined,
        });
      }
    }

    const enrichedEntries = entries.map((entry) => {
      const sellerInfo = entry.sellerId ? usersMap.get(entry.sellerId) : undefined;
      return {
        ...entry,
        sellerNameResolved: sellerInfo?.fullName || null,
        sellerEmail: sellerInfo?.email || null,
      };
    });

    return NextResponse.json(
      { success: true, listings: enrichedEntries },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN_LISTINGS_ERROR]:", error);
    return NextResponse.json(
      { error: `Failed to fetch listings: ${errorMessage}` },
      { status: 500 }
    );
  }
}
