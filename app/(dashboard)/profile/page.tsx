"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
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
  StarHalf,
  MessageSquare,
  ShoppingBag,
  Store,
} from "lucide-react";

interface UserData {
  fullName?: string;
  sellerVerified?: boolean;
  kycStatus?: string;
  lifetimeSales?: number;
  createdAt?: unknown;
  bio?: string;
  storeTagline?: string;
  averageRating?: number;
  totalReviews?: number;
  email?: string;
  phoneNumber?: string;
  location?: string;
  website?: string;
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

export default function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.uid || "";

  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [buyerReviews, setBuyerReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Profile Header */}
          <section className="bg-[#151922] border border-[#242938] rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#FFB020]/20 to-[#7C5CFC]/20 border-2 border-[#FFB020]/40 text-[#FFB020] font-bold text-4xl flex items-center justify-center shrink-0 shadow-lg">
                {getInitials(userData?.fullName ?? user?.displayName ?? undefined)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-3xl md:text-4xl font-black text-[#EDEFF2]">
                    {userData?.fullName || user?.displayName || "Your Profile"}
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

                <p className="text-lg text-[#8A93A3] mb-6 leading-relaxed">
                  {userData?.bio || userData?.storeTagline || "Tell buyers about yourself and your trading experience."}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-base text-[#8A93A3]">
                  <span className="flex items-center gap-2">
                    <Calendar size={18} /> Member since {formatDate(userData?.createdAt)}
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

          {/* Stats Grid */}
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

          {/* Reviews Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Seller Reviews (Received) */}
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

            {/* Buyer Reviews (Given) */}
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
