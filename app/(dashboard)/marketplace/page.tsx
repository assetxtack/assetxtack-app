"use client";

import { useState } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard";
import { mockMarketListings } from "@/lib/mockData";
import { 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  ShieldAlert,
  Star, 
  CheckCircle2,
  Gamepad2,
  Sparkles,
  Zap
} from "lucide-react";

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredListings = mockMarketListings
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = selectedRank === "All" || item.rank === selectedRank;
      const matchesPrice = maxPrice === "" || item.price <= Number(maxPrice);
      return matchesSearch && matchesRank && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0;
    });

  return (
    <AuthGuard>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2] flex items-center gap-2">
              Account Marketplace
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Verified gaming assets secured inside AssetXtack Escrow Vault.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#EDEFF2] bg-[#151922] px-3.5 py-2 rounded-xl border border-[#242938]">
            <Gamepad2 size={16} className="text-[#FFB020]" />
            <span>Active Game: <strong className="text-[#FFB020]">Mobile Legends: Bang Bang</strong></span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            <div className="md:col-span-5 relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Search skins, ranks, or sellers..."
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
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-[#151922] border border-[#242938] rounded-2xl">
            <SlidersHorizontal size={32} className="mx-auto text-[#8A93A3] mb-3" />
            <h3 className="text-sm font-bold text-[#EDEFF2]">No listings found</h3>
            <p className="text-xs text-[#8A93A3] mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const isProtected = listing.sellerVerified;

              return (
                <div 
                  key={listing.id}
                  className={`relative group rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                    isProtected 
                      ? "" 
                      : "bg-[#242938] hover:border-[#8A93A3]/40"
                  }`}
                >
                  {/* Rotating Gold Light Animation - ONLY FOR PROTECTED CARDS */}
                  {isProtected && (
                    <div className="absolute inset-[-1000%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#151922_0%,#FFB020_50%,#151922_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Main Card Body */}
                  <div className="relative h-full bg-[#151922] rounded-2xl p-5 flex flex-col justify-between">
                    
                    <div>
                      {/* Protection Badge Banner */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        {isProtected ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020]">
                            <ShieldCheck size={14} className="shrink-0" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                              AssetXtack Shield Protected
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8A93A3]/10 border border-[#8A93A3]/20 text-[#8A93A3]">
                            <ShieldAlert size={14} className="shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Standard Listing
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#FFB020]">
                          <Star size={11} fill="#FFB020" /> {listing.sellerRating}
                        </div>
                      </div>

                      {/* Seller Name & Verification */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-semibold text-[#8A93A3]">Seller:</span>
                        <span className="text-xs font-bold text-[#EDEFF2]">{listing.sellerName}</span>
                        {listing.sellerVerified && (
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        )}
                      </div>

                      {/* Styled Listing Title */}
                      <h3 className={`font-bold text-sm line-clamp-2 leading-snug my-2 transition-colors ${
                        isProtected 
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-[#EDEFF2] via-white to-[#FFB020] group-hover:from-white group-hover:to-[#FFB020]" 
                          : "text-[#EDEFF2] group-hover:text-white"
                      }`}>
                        {listing.title}
                      </h3>

                      {/* Key Metrics Chips */}
                      <div className="grid grid-cols-3 gap-2 my-4">
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Rank</span>
                          <strong className="text-xs text-[#EDEFF2] font-bold truncate block mt-0.5">{listing.rank}</strong>
                        </div>
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Skins</span>
                          <strong className="text-xs text-[#FFB020] font-bold block mt-0.5">{listing.skinsCount}</strong>
                        </div>
                        <div className="bg-[#0B0E14] p-2 rounded-xl text-center border border-[#242938]">
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A93A3] font-bold">Win Rate</span>
                          <strong className="text-xs text-emerald-400 font-bold block mt-0.5">{listing.winRate}</strong>
                        </div>
                      </div>

                      {/* Featured Skins Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {listing.featuredSkins.map((skin, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] bg-[#7C5CFC]/15 text-[#9d85fc] border border-[#7C5CFC]/30 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                          >
                            <Sparkles size={10} className="text-[#FFB020]" /> {skin}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Price & CTA */}
                    <div className="pt-4 border-t border-[#242938] flex items-center justify-between gap-3 mt-2">
                      <div>
                        <span className="text-[10px] text-[#8A93A3] font-semibold block uppercase">Escrow Price</span>
                        <strong className="text-lg font-black text-emerald-400">
                          {formatNaira(listing.price)}
                        </strong>
                      </div>

                      <Link
                        href={`/marketplace/${listing.id}`}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                          isProtected
                            ? "bg-gradient-to-r from-[#FFB020] to-[#ffa500] text-[#0B0E14] hover:brightness-110 shadow-[#FFB020]/10"
                            : "bg-[#242938] text-[#EDEFF2] hover:bg-[#2d3446]"
                        }`}
                      >
                        <Zap size={14} className={isProtected ? "fill-[#0B0E14]" : "text-[#FFB020]"} /> Buy Escrow
                      </Link>
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