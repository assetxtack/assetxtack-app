"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where
} from "firebase/firestore";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  Calendar,
  TrendingUp,
  Gamepad2,
  Loader2,
  ArrowLeft,
  Eye,
  MapPin,
  Mail,
  Award
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

interface Listing {
  id: string;
  title?: string;
  price?: number;
  rank?: string;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  featuredSkins?: string[];
  images?: string[];
  status?: string;
  sellerRating?: string | number;
  isFeatured?: boolean;
  hasShieldProtection?: boolean;
  createdAt?: unknown;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  buyerId: string;
  createdAt: unknown;
}

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = typeof params.id === "string" ? params.id : "";

  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const userDataRef = useRef<UserData | null>(null);

  useEffect(() => {
    userDataRef.current = userData;
  });

  useEffect(() => {
    if (!sellerId) return;

    const userDocRef = doc(db, "users", sellerId);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = snapshot.data() as UserData;
      setUserData(data);

      const listingsQuery = query(
        collection(db, "listings"),
        where("sellerId", "==", sellerId),
        where("status", "==", "Active")
      );
      const unsubscribeListings = onSnapshot(listingsQuery, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, "id">) }));
        setListings(docs);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching listings:", err);
      });

      const reviewsQuery = query(
        collection(db, "reviews"),
        where("sellerId", "==", sellerId)
      );
      const unsubscribeReviews = onSnapshot(reviewsQuery, (snap) => {
        setReviewCount(snap.size);
        const reviewDocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
        setReviews(reviewDocs);
        if (reviewDocs.length > 0) {
          const total = reviewDocs.reduce((sum, review) => sum + Number(review.rating || 0), 0);
          setAverageRating(Number((total / reviewDocs.length).toFixed(1)));
        } else {
          setAverageRating(userDataRef.current?.averageRating ?? 5.0);
        }
      }, (err) => {
        console.error("Error fetching reviews:", err);
      });

      return () => {
        unsubscribeUser();
        unsubscribeListings();
        unsubscribeReviews();
      };
    }, (error) => {
      console.error("Error fetching seller profile:", error);
      setNotFound(true);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [sellerId]);

  const isVerified = Boolean(userData?.sellerVerified === true || userData?.kycStatus === "VERIFIED");

  const tierBadge = (() => {
    const sales = userData?.lifetimeSales || 0;
    if (sales >= 200) return { label: "Elite Merchant", color: "text-[#FFB020]", bg: "bg-[#FFB020]/10", border: "border-[#FFB020]/30" };
    if (sales >= 50) return { label: "Pro Trader", color: "text-[#7C5CFC]", bg: "bg-[#7C5CFC]/10", border: "border-[#7C5CFC]/30" };
    if (sales >= 1) return { label: "Verified Seller", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    return null;
  })();

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp as string);
    return date.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
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
        className={i < Math.round(rating) ? "text-[#FFB020]" : "text-[#8A93A3]"}
      />
    ));
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
          <div className="text-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[#FFB020] mx-auto" />
            <p className="text-base font-semibold text-[#8A93A3]">Loading seller profile...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (notFound || !userData) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] p-4">
          <div className="text-center space-y-6 max-w-md">
            <ShieldAlert className="mx-auto text-rose-400" size={64} />
            <h1 className="text-2xl font-bold text-[#EDEFF2]">Seller Not Found</h1>
            <p className="text-base text-[#8A93A3]">This seller profile does not exist or has been removed.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-base hover:bg-[#ffa500] transition">
              <ArrowLeft size={18} /> Back to Marketplace
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Back Navigation */}
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-base font-semibold text-[#8A93A3] hover:text-[#FFB020] transition">
            <ArrowLeft size={20} /> Back to Marketplace
          </Link>

          {/* Profile Header - Hero Section */}
          <section className="bg-[#151922] border border-[#242938] rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#FFB020]/20 to-[#7C5CFC]/20 border-2 border-[#FFB020]/40 text-[#FFB020] font-bold text-4xl flex items-center justify-center shrink-0 shadow-lg">
                {getInitials(userData.fullName)}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-3xl md:text-4xl font-black text-[#EDEFF2] truncate">{userData.fullName || "Anonymous Seller"}</h1>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                      <ShieldCheck size={18} /> Verified Seller
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider">
                      <ShieldAlert size={18} /> Unverified Seller
                    </span>
                  )}
                  {tierBadge && (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${tierBadge.bg} ${tierBadge.border} border ${tierBadge.color} text-sm font-bold uppercase tracking-wider`}>
                      <TrendingUp size={18} /> {tierBadge.label}
                    </span>
                  )}
                </div>

                <p className="text-base text-[#8A93A3] mb-6 leading-relaxed max-w-3xl">{userData.bio || userData.storeTagline || "No bio provided."}</p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-base text-[#8A93A3]">
                  <span className="flex items-center gap-2">
                    <Calendar size={18} /> Member since {formatDate(userData.createdAt)}
                  </span>
                  {userData.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={18} /> {userData.location}
                    </span>
                  )}
                  {userData.email && (
                    <span className="flex items-center gap-2">
                      <Mail size={18} /> {userData.email}
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
                <div className="text-sm uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Rating</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{averageRating} <span className="text-lg font-semibold text-[#8A93A3]">/ 5.0</span></div>
                <div className="text-xs text-[#8A93A3] mt-1">{reviewCount} reviews</div>
              </div>
            </div>

            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-emerald-500/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Completed Trades</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{(userData?.lifetimeSales || 0).toLocaleString()}</div>
                <div className="text-xs text-[#8A93A3] mt-1">Successful transactions</div>
              </div>
            </div>

            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-[#7C5CFC]/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]">
                <Gamepad2 size={28} />
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Active Listings</div>
                <div className="text-3xl font-black text-[#EDEFF2]">{listings.length}</div>
                <div className="text-xs text-[#8A93A3] mt-1">Currently for sale</div>
              </div>
            </div>

            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 flex items-center gap-5 hover:border-amber-500/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award size={28} />
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-[#8A93A3] font-bold mb-1">Trust Level</div>
                <div className="text-2xl font-black text-[#EDEFF2]">{tierBadge?.label || "New Seller"}</div>
                <div className="text-xs text-[#8A93A3] mt-1">Based on trade history</div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          {reviews.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#EDEFF2] mb-6">Recent Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.slice(0, 6).map((review) => (
                  <div key={review.id} className="bg-[#151922] border border-[#242938] rounded-2xl p-6 space-y-4 hover:border-[#FFB020]/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm font-bold text-[#FFB020]">{review.rating}.0</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-[#8A93A3] leading-relaxed line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                    )}
                    <div className="text-xs text-[#8A93A3] pt-2 border-t border-[#242938]">
                      Buyer #{review.buyerId.slice(0, 8)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Listings Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#EDEFF2]">Active Gaming Accounts</h2>
              <span className="text-sm text-[#8A93A3] font-medium">{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
            </div>
            {listings.length === 0 ? (
              <div className="p-12 text-center bg-[#151922] border border-[#242938] rounded-2xl">
                <Gamepad2 size={48} className="mx-auto text-[#8A93A3] mb-4" />
                <p className="text-lg font-semibold text-[#8A93A3]">No active listings at the moment.</p>
                <p className="text-sm text-[#8A93A3] mt-2">Check back later for new gaming accounts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const isFeatured = Boolean(listing.isFeatured || listing.hasShieldProtection);

                  return (
                    <Link
                      key={listing.id}
                      href={`/marketplace/${listing.id}`}
                      className="group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 hover:scale-[1.02] block"
                    >
                      {isFeatured && (
                        <div className="absolute inset-[-1000%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#151922_0%,#FFB020_50%,#151922_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                      )}
                      <div className="relative h-full bg-[#151922] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-[#8A93A3] uppercase tracking-wider">{listing.rank || "Unranked"}</span>
                            <span className="text-sm font-bold text-[#FFB020] flex items-center gap-1.5">
                              <Star size={14} fill="#FFB020" /> {averageRating.toFixed(1)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-[#EDEFF2] line-clamp-2 mb-4 group-hover:text-white transition-colors">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-[#8A93A3] mb-4">
                            <span>Skins: <strong className="text-[#EDEFF2]">{listing.skinsCount || 0}</strong></span>
                            <span>Win Rate: <strong className="text-emerald-400">{listing.winRate || "N/A"}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[#242938]">
                          <div>
                            <span className="text-xs text-[#8A93A3] font-semibold block uppercase mb-1">Price</span>
                            <strong className="text-lg font-black text-emerald-400 font-mono">{formatNaira(listing.price || 0)}</strong>
                          </div>
                          <span className="text-sm font-semibold text-[#8A93A3] flex items-center gap-1.5 group-hover:text-[#FFB020] transition-colors">
                            <Eye size={16} /> View Details
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
