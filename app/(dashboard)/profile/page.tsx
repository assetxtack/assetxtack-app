"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  Calendar,
  TrendingUp,
  Gamepad2,
  Loader2,
  MapPin,
  Award,
  MessageSquare,
  ShoppingBag,
  Store,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface UserData {
  fullName?: string;
  sellerVerified?: boolean;
  kycStatus?: string;
  lifetimeSales?: number;
  bio?: string;
  storeTagline?: string;
  averageRating?: number;
  totalReviews?: number;
  location?: string;
  website?: string;
  avatarUrl?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  buyerId: string;
  sellerId: string;
  orderId: string;
  createdAt: unknown;
}

interface Listing {
  id: string;
  title?: string;
  price?: number;
  status?: string;
}

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

export default function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.uid || "";

  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [buyerReviews, setBuyerReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

  const [bioEditMode, setBioEditMode] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [bioError, setBioError] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSavedMsg, setBioSuccessMessage] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
      })
    : "N/A";

  const doSaveBio = useCallback(async () => {
    if (!userId) {
      setBioError("User not authenticated. Please sign in again.");
      return;
    }
    const validation = validateBio(bioDraft);
    if (!validation.valid) {
      setBioError(
        "Blocked: " + validation.reasons.join(", ") + ". Remove flagged content and try again."
      );
      return;
    }
    setBioError("");
    setBioSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setBioError("Session expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/profile/bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ bio: bioDraft }),
      });

      const result = await response.json();

      if (!response.ok) {
        setBioError(result.error || "Failed to save bio. Please try again.");
        return;
      }

      setBioEditMode(false);
      setBioDraft("");
      setBioSuccessMessage("Bio saved successfully.");
    } catch (err) {
      console.error("Failed to save bio:", err);
      setBioError("Failed to save bio. Please try again.");
    } finally {
      setBioSaving(false);
    }
  }, [bioDraft, userId]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setAvatarSuccess("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + await auth.currentUser?.getIdToken() || "",
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile picture.");
      }

      setAvatarSuccess("Profile picture updated successfully.");
      setUserData((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl || prev.avatarUrl } : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile picture.";
      setAvatarError(msg);
    } finally {
      setAvatarUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, "users", userId);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data() as UserData);
      }
    });

    const listingsQuery = query(
      collection(db, "listings"),
      where("sellerId", "==", userId),
      where("status", "==", "Active")
    );
    const unsubscribeListings = onSnapshot(listingsQuery, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, "id">) })));
    });

    const sellerReviewsQuery = query(
      collection(db, "reviews"),
      where("sellerId", "==", userId)
    );
    const unsubscribeSellerReviews = onSnapshot(sellerReviewsQuery, (snap) => {
      const reviews = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
      setSellerReviews(reviews);
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        setAverageRating(Number((total / reviews.length).toFixed(1)));
      }
      setLoading(false);
    });

    const buyerReviewsQuery = query(
      collection(db, "reviews"),
      where("buyerId", "==", userId)
    );
    const unsubscribeBuyerReviews = onSnapshot(buyerReviewsQuery, (snap) => {
      const reviews = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
      setBuyerReviews(reviews);
    });

    return () => {
      unsubscribeUser();
      unsubscribeListings();
      unsubscribeSellerReviews();
      unsubscribeBuyerReviews();
    };
  }, [userId]);

  const isVerified = Boolean(userData?.sellerVerified === true || userData?.kycStatus === "VERIFIED");

  const tierBadge = (() => {
    const sales = userData?.lifetimeSales || 0;
    if (sales >= 200) return { label: "Elite Merchant", color: "text-[#FFB020]", bg: "bg-[#FFB020]/10", border: "border-[#FFB020]/30" };
    if (sales >= 50) return { label: "Pro Trader", color: "text-[#7C5CFC]", bg: "bg-[#7C5CFC]/10", border: "border-[#7C5CFC]/30" };
    if (sales >= 1) return { label: "Verified Seller", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    return null;
  })();

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    const ts = timestamp as { toDate?: () => Date };
    const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(timestamp as string);
    return date.toLocaleDateString("en-NG", { year: "numeric", month: "long" });
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={18}
        fill={i < Math.round(rating) ? "#FFB020" : "none"}
        stroke={i < Math.round(rating) ? "#FFB020" : "#8A93A3"}
      />
    ));
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
          <div className="text-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[#FFB020] mx-auto" />
            <p className="text-lg font-semibold text-[#8A93A3]">Loading your profile...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const displayBio = userData?.bio || userData?.storeTagline || "Tell buyers about yourself and your trading experience.";
  const displayName = userData?.fullName || user?.displayName || "Your Profile";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          <section className="bg-[#151922] border border-[#242938] rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="relative w-28 h-28 shrink-0 group">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#FFB020]/20 to-[#7C5CFC]/20 border-2 border-[#FFB020]/40 text-[#FFB020] font-bold text-4xl flex items-center justify-center shadow-lg overflow-hidden">
                  {userData?.avatarUrl ? (
                    <img
                      src={userData.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(userData?.fullName ?? user?.displayName ?? undefined)
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-[#FFB020] text-[#0B0E14] flex items-center justify-center cursor-pointer hover:bg-[#ffa500] transition shadow-lg border border-[#FFB020]/50"
                  title="Update profile picture"
                >
                  {avatarUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-3xl md:text-4xl font-black text-[#EDEFF2]">
                    {displayName}
                  </h1>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-base font-bold uppercase tracking-wider">
                      <ShieldCheck size={18} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-base font-bold uppercase tracking-wider">
                      <ShieldAlert size={18} /> Unverified
                    </span>
                  )}
                  {tierBadge && (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${tierBadge.bg} ${tierBadge.border} border ${tierBadge.color} text-base font-bold uppercase tracking-wider`}>
                      <Award size={18} /> {tierBadge.label}
                    </span>
                  )}
                </div>

                <div className="mb-6 relative">
                  {bioEditMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={bioDraft}
                        onChange={(e) => {
                          setBioDraft(e.target.value);
                          setBioError("");
                          setBioSuccessMessage("");
                        }}
                        rows={3}
                        maxLength={500}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-4 text-[#EDEFF2] text-base resize-none focus:outline-none focus:border-[#FFB020]/50 placeholder:text-[#8A93A3]"
                        placeholder="Tell buyers about yourself..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {bioError && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                              <AlertCircle size={14} />
                              {bioError}
                            </span>
                          )}
                          {bioSavedMsg && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                              <CheckCircle size={14} />
                              {bioSavedMsg}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#8A93A3]">{bioDraft.length}/500</span>
                          <button
                            onClick={() => { setBioEditMode(false); setBioDraft(""); setBioError(""); setBioSuccessMessage(""); }}
                            className="px-3 py-1.5 rounded-lg text-sm text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#242938] transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={doSaveBio}
                            disabled={bioSaving || !bioDraft.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {bioSaving ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-lg text-[#8A93A3] leading-relaxed">
                        {displayBio}
                      </p>
                      <button
                        onClick={() => { setBioDraft(userData?.bio || userData?.storeTagline || ""); setBioEditMode(true); setBioError(""); setBioSuccessMessage(""); }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#242938] transition"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-base text-[#8A93A3]">
                  <span className="flex items-center gap-2">
                    <Calendar size={18} /> Member since {memberSince}
                  </span>
                  {userData?.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={18} /> {userData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {avatarError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {avatarError}
            </div>
          )}
          {avatarSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {avatarSuccess}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-[#FFB020]/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#FFB020]/10 border border-[#FFB020]/20 flex items-center justify-center text-[#FFB020]">
                <Star size={28} fill="#FFB020" />
              </div>
              <div>
                <div className="text-base uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Seller Rating</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{averageRating} <span className="text-lg font-semibold text-[#8A93A3]">/ 5.0</span></div>
                <div className="text-base text-[#8A93A3] mt-1">{sellerReviews.length} reviews received</div>
              </div>
            </div>
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-emerald-500/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <div>
                <div className="text-base uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Completed Sales</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{(userData?.lifetimeSales || 0).toLocaleString()}</div>
                <div className="text-base text-[#8A93A3] mt-1">Successful transactions</div>
              </div>
            </div>
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-[#7C5CFC]/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]">
                <Store size={28} />
              </div>
              <div>
                <div className="text-base uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Active Listings</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{listings.length}</div>
                <div className="text-base text-[#8A93A3] mt-1">Currently for sale</div>
              </div>
            </div>
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-amber-500/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <MessageSquare size={28} />
              </div>
              <div>
                <div className="text-base uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Reviews Given</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{buyerReviews.length}</div>
                <div className="text-base text-[#8A93A3] mt-1">As a buyer</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <section className="bg-[#151922] border border-[#242938] rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#FFB020]/10 border border-[#FFB020]/20 flex items-center justify-center text-[#FFB020]">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEFF2]">Seller Reviews</h2>
                  <p className="text-base text-[#8A93A3]">Reviews received from buyers</p>
                </div>
              </div>

              {sellerReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star size={56} className="mx-auto text-[#8A93A3] mb-5" />
                  <p className="text-xl font-semibold text-[#8A93A3]">No seller reviews yet</p>
                  <p className="text-base text-[#8A93A3] mt-3">Complete a sale to receive your first review</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {sellerReviews.map((review) => (
                    <div key={review.id} className="bg-[#0B0E14] border border-[#242938] rounded-2xl p-6 hover:border-[#FFB020]/20 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-lg font-bold text-[#FFB020]">{review.rating}.0</span>
                      </div>
                      {review.comment && (
                        <p className="text-lg text-[#EDEFF2] leading-relaxed mb-4">&ldquo;{review.comment}&rdquo;</p>
                      )}
                      <div className="text-base text-[#8A93A3] pt-4 border-t border-[#242938] flex items-center justify-between">
                        <span>Buyer #{review.buyerId.slice(0, 8)}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[#151922] border border-[#242938] rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEFF2]">Buyer Reviews</h2>
                  <p className="text-base text-[#8A93A3]">Reviews you gave to sellers</p>
                </div>
              </div>

              {buyerReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={56} className="mx-auto text-[#8A93A3] mb-5" />
                  <p className="text-xl font-semibold text-[#8A93A3]">No buyer reviews yet</p>
                  <p className="text-base text-[#8A93A3] mt-3">Leave a review after completing a purchase</p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {buyerReviews.map((review) => (
                    <div key={review.id} className="bg-[#0B0E14] border border-[#242938] rounded-2xl p-6 hover:border-[#7C5CFC]/20 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-lg font-bold text-[#7C5CFC]">{review.rating}.0</span>
                      </div>
                      {review.comment && (
                        <p className="text-lg text-[#EDEFF2] leading-relaxed mb-4">&ldquo;{review.comment}&rdquo;</p>
                      )}
                      <div className="text-base text-[#8A93A3] pt-4 border-t border-[#242938] flex items-center justify-between">
                        <span>Seller #{review.sellerId.slice(0, 8)}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
