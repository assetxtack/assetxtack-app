import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAdminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ANTI_SCAM_PATTERNS: RegExp[] = [
  /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
  /\b\d{10,}\b/,
  /@\S+/,
  /\b(gmail|yahoo|hotmail|outlook|protonmail|icloud|mail)\b/i,
  /https?:\/\//i,
  /www\./i,
  /\bnet\b/i,
  /\bcom\b/i,
  /\.ng/i,
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bdiscord\b/i,
  /\bpay\s*direct\b/i,
  /\binstagram\b/i,
  /\btiktok\b/i,
  /\bx\s*(?:dm|direct)\b/i,
  /\bmeet\s*(?:me|telegram|whatsapp)\b/i,
  /\bsend\s*(?:me|me\s*to)\b/i,
  /\bcall\s*me\b/i,
  /\btext\s*me\b/i,
  /\bphone\b.*\b(?:number|call|text)\b/i,
  /\b(skype|viber|snapchat|facebook|twitter|x\.com)\b/i,
];

function classifyFlaggedPattern(pattern: RegExp): string {
  const src = pattern.source;
  if (src.includes('gmail') || src.includes('yahoo') || src.includes('hotmail')) return 'Email addresses';
  if (src.includes('https') || src.includes('www')) return 'External links / URLs';
  if (src.includes('whatsapp') || src.includes('telegram') || src.includes('discord')) return 'Off-platform contact methods';
  if (src.includes('pay') && src.includes('direct')) return 'Off-platform payment instructions';
  if (src.includes('instagram')) return 'Social media links';
  if (src.includes('tiktok') || src.includes('skype') || src.includes('viber') || src.includes('snapchat') || src.includes('facebook') || src.includes('twitter')) return 'Social media links';
  if (src.includes('call') || src.includes('text') || src.includes('phone') || src.includes('number')) return 'Phone contact details';
  if (src.includes('\\d')) return 'Phone numbers or digit patterns';
  return 'Flagged content';
}

function validateBio(text: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const pattern of ANTI_SCAM_PATTERNS) {
    if (pattern.test(text)) {
      const label = classifyFlaggedPattern(pattern);
      if (!reasons.includes(label)) {
        reasons.push(label);
      }
    }
  }
  return { valid: reasons.length === 0, reasons };
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bio } = body;

    if (typeof bio !== "string") {
      return NextResponse.json(
        { error: "Bio is required and must be a string" },
        { status: 400 }
      );
    }

    if (bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less" },
        { status: 400 }
      );
    }

    const validation = validateBio(bio);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Blocked: " + validation.reasons.join(", ") + ". Remove flagged content and try again.",
          reasons: validation.reasons,
        },
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
    await userDocRef.set(
      {
        bio: bio || undefined,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update bio:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to update bio: " + errorMessage },
      { status: 500 }
    );
  }
}
