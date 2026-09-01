"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import {
  Search,
  SlidersHorizontal,
  ShieldAlert,
  Star,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  Sparkles,
  Eye,
  Loader2,
  Zap
} from "lucide-react";

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [sellerRatings, setSellerRatings] = useState<Record<string, {sum: number, count: number}>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  // Fetch real-time active listings from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      where("status", "==", "Active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(liveDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching marketplace listings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reviews"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ratings: Record<string, {sum: number, count: number}> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const sid = data.sellerId as string;
        if (!ratings[sid]) ratings[sid] = { sum: 0, count: 0 };
        ratings[sid].sum += Number(data.rating || 0);
        ratings[sid].count += 1;
      });
      setSellerRatings(ratings);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    return () => unsubscribe();
  }, []);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleViewAndBuy = (listingId: string) => {
    router.push(`/marketplace/${listingId}`);
  };

  const filteredListings = listings
    .filter((item) => {
      const matchesSearch =
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sellerName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = selectedRank === "All" || item.rank === selectedRank;
      const matchesPrice = maxPrice === "" || (item.price || 0) <= Number(maxPrice);
      return matchesSearch && matchesRank && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "featured") {
        const aBoost = a.isFeatured && a.sellerVerified ? 1 : 0;
        const bBoost = b.isFeatured && b.sellerVerified ? 1 : 0;
        return bBoost - aBoost;
      }
      return 0;
    });

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-[#EDEFF2]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#EDEFF2] flex items-center gap-2">
              Account Marketplace
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Verified & Peer-to-Peer gaming assets secured inside AssetXtack Escrow Vault.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#EDEFF2] bg-[#151922] px-3.5 py-2 rounded-xl border border-[#242938] shrink-0">
            <Gamepad2 size={16} className="text-[#FFB020]" />
            <span>Active Game: <strong className="text-[#FFB020]">Configured Game</strong></span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl space-y-4 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            <div className="md:col-span-5 relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Search listings, ranks, or sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]"
              >
                <option value="All">All Ranks</option>
                <option value="Mythic Immortal">Mythic Immortal</option>
                <option value="Mythical Glory">Mythical Glory</option>
                <option value="Mythical Honor">Mythical Honor</option>
                <option value="Mythic">Mythic</option>
                <option value="Legend">Legend</option>
                <option value="Epic">Epic</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <input
                type="number"
                placeholder="Max Price (₦)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "price_asc" | "price_desc")}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

          </div>
        </div>

        {/* Listings Grid / Loader */}
        {loading ? (
          <div className="py-20 text-center text-[#8A93A3] flex flex-col items-center justify-center gap-3 bg-[#151922] border border-[#242938] rounded-2xl">
            <Loader2 size={32} className="animate-spin text-[#FFB020]" />
            <p className="text-xs font-semibold">Loading marketplace listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-[#151922] border border-[#242938] rounded-2xl space-y-2">
            <SlidersHorizontal size={32} className="mx-auto text-[#8A93A3]" />
            <h3 className="text-sm font-bold text-[#EDEFF2]">No listings found</h3>
            <p className="text-xs text-[#8A93A3]">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              // Paid Featured Boost Flag (trigged by seller paying the 5% featured fee)
              const isFeaturedBoost = Boolean(listing.isFeatured || listing.hasShieldProtection);
              // KYC Verified Seller Status Flag
              const isSellerVerified = Boolean(listing.sellerVerified);

              return (
                <div 
                  key={listing.id}
                  className={`relative group rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                    isFeaturedBoost 
                      ? "" 
                      : "bg-[#242938] hover:border-[#8A93A3]/40"
                  }`}
                >
                  {/* GOLD ROTATING BORDER ANIMATION — TRIGGERED FOR PAID FEATURED BOOST LISTINGS */}
                  {isFeaturedBoost && (
                    <div className="absolute inset-[-1000%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#151922_0%,#FFB020_50%,#151922_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  )}

                   {/* Card Body Container */}
                   <div className="relative h-full bg-[#151922] rounded-2xl flex flex-col justify-between">
                     {/* Listing Image */}
                     <div className="relative w-full h-40 bg-[#0B0E14] border-b border-[#242938] overflow-hidden">
                       <img
                         src={listing.images?.[0] || listing.imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"}
                         alt={listing.title || "Listing"}
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#151922]/80 to-transparent" />
                     </div>

                     <div className="p-5 flex flex-col justify-between flex-1">
                    
                    <div>
                      {/* Top Listing Status Banner */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        {isFeaturedBoost ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020]">
                            <Zap size={13} className="shrink-0 fill-[#FFB020]" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                              Featured Boost
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8A93A3]/10 border border-[#8A93A3]/20 text-[#8A93A3]">
                            <ShieldAlert size={13} className="shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Standard Listing
                            </span>
                          </div>
                        )}

                         <div className="flex items-center gap-1 text-[11px] font-bold text-[#FFB020]">
                           <Star size={11} fill="#FFB020" /> {(() => {
                             const sid = listing.sellerId;
                             if (sid && sellerRatings[sid]) {
                               return (sellerRatings[sid].sum / sellerRatings[sid].count).toFixed(1);
                             }
                             return listing.sellerRating || "5.0";
                           })()}
                         </div>
                      </div>

                      {/* Seller Identity & Verification Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                          <span className="text-xs font-semibold text-[#8A93A3]">Seller:</span>
                          <Link href={`/seller/${listing.sellerId}`} className="text-xs font-bold text-[#EDEFF2] truncate hover:text-[#FFB020] transition-colors">
                            {listing.sellerName || "Anonymous"}
                          </Link>
                          {!isSellerVerified && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                              Unverified Seller
                            </span>
                          )}
                          {isSellerVerified ? (
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          )}
                        </div>

                        {/* Distinct Seller KYC Badge */}
                        {isSellerVerified ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                            Verified Seller
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                            Unverified
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-sm line-clamp-2 leading-snug my-2 transition-colors ${
                        isFeaturedBoost 
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-[#EDEFF2] via-white to-[#FFB020] group-hover:from-white group-hover:to-[#FFB020]" 
                          : "text-[#EDEFF2] group-hover:text-white"
                      }`}>
                        {listing.title}
                      </h3>

                      {/* Key Account Metrics */}
                      <div className="grid grid-cols-3 gap-2 my-4">
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Rank</span>
                          <strong className="text-xs text-[#EDEFF2] font-bold truncate block mt-0.5">
                            {listing.rank || "Unranked"}
                          </strong>
                        </div>
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Skins</span>
                          <strong className="text-xs text-[#FFB020] font-bold block mt-0.5">
                            {listing.skinsCount || 0}
                          </strong>
                        </div>
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Win Rate</span>
                          <strong className="text-xs text-emerald-400 font-bold block mt-0.5">
                            {listing.winRate || "N/A"}
                          </strong>
                        </div>
                      </div>

                      {/* Rare / Featured Skin Badges */}
                      {Array.isArray(listing.featuredSkins) && listing.featuredSkins.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {listing.featuredSkins.map((skin: string, idx: number) => (
                            <span 
                              key={idx}
                              className="text-[10px] bg-[#7C5CFC]/15 text-[#9d85fc] border border-[#7C5CFC]/30 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                            >
                              <Sparkles size={10} className="text-[#FFB020]" /> {skin}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Price & CTA */}
                    <div className="pt-4 border-t border-[#242938] flex items-center justify-between gap-3 mt-2">
                      <div>
                        <span className="text-[10px] text-[#8A93A3] font-semibold block uppercase">Escrow Price</span>
                        <strong className="text-lg font-black text-emerald-400 font-mono">
                          {formatNaira(listing.price)}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleViewAndBuy(listing.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                          isFeaturedBoost
                            ? "bg-gradient-to-r from-[#FFB020] to-[#ffa500] text-[#0B0E14] hover:brightness-110 shadow-[#FFB020]/10"
                            : "bg-[#242938] text-[#EDEFF2] hover:bg-[#2d3446]"
                        }`}
                      >
                        <Eye size={14} className={isFeaturedBoost ? "fill-[#0B0E14]" : "text-[#FFB020]"} /> 
                        View and Buy
                      </button>
                    </div>

                   </div>
                 </div>
               </div>
               );
             })}
          </div>
        )}

      </div>
    </AuthGuard>
  );
}