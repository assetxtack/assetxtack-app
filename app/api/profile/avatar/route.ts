import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(userId);
    const snapshot = await userDocRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.data() as Record<string, unknown>;
    const lastAvatarUpdate = userData.lastAvatarUpdate;

    let lastUpdateTime: Date;
    if (lastAvatarUpdate) {
      const tsObj = lastAvatarUpdate as { toDate?: () => Date; toString?: () => string };
      if (typeof tsObj.toDate === "function") {
        const d = tsObj.toDate();
        if (d) lastUpdateTime = d;
        else lastUpdateTime = new Date(lastAvatarUpdate as string);
      } else {
        lastUpdateTime = new Date(lastAvatarUpdate as string);
      }
    } else {
      lastUpdateTime = new Date(0);
    }

    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (lastAvatarUpdate && now.getTime() - lastUpdateTime.getTime() < sevenDaysMs) {
      return NextResponse.json(
        {
          error: "Profile picture can only be updated twice a week.",
          retryAfterMs: sevenDaysMs - (now.getTime() - lastUpdateTime.getTime()),
        },
        { status: 429 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "vqwtykcl";
    const uploadPreset = "assetxtack_preset";

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", uploadPreset);

    const cloudinaryRes = await fetch(
      "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload",
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      return NextResponse.json(
        { error: "Failed to upload to Cloudinary" },
        { status: 500 }
      );
    }

    const cloudinaryData = await cloudinaryRes.json();
    const avatarUrl = cloudinaryData.secure_url;

    await userDocRef.set(
      {
        avatarUrl: avatarUrl,
        lastAvatarUpdate: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    try {
      const adminAuth = getAdminAuth();
      if (adminAuth) {
        await adminAuth.updateUser(userId, { photoURL: avatarUrl });
      }
    } catch (err) {
      console.error("Failed to update Auth photoURL:", err);
    }

    return NextResponse.json({ success: true, avatarUrl: avatarUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update avatar:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to update avatar: " + errorMessage },
      { status: 500 }
    );
  }
}
