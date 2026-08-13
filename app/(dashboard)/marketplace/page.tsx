"use client";

import { useState } from "react";
import { FaInstagram } from "react-icons/fa6";
import { 
  Search, Filter, ShieldCheck, Zap, ArrowUpRight, Star, 
  CheckCircle2, RotateCcw 
} from "lucide-react";

// Mock Data with Generic Seller Profiles & AssetXtack Shield Status
const MOCK_LISTINGS = [
  {
    id: "AX-9821",
    title: "Mythic Glory 82 Stars | 112 Skins (3 Collector, 2 Legend)",
    rank: "Mythic Glory",
    skins: 112,
    heroes: 88,
    price: 45000,
    seller: {
      username: "Seller_01",
      isVerified: true,
      rating: 5.0,
      salesCount: 24,
      isIgVerified: true,
      igHandle: "@seller_store",
    },
    hasShieldGuard: true,
    instantHandover: true,
  },
  {
    id: "AX-8812",
    title: "Smurf Account | Legend V | High Winrate Fanny (80%)",
    rank: "Legend",
    skins: 45,
    heroes: 52,
    price: 18500,
    seller: {
      username: "FastHands_NG",
      isVerified: true,
      rating: 4.9,
      salesCount: 12,
      isIgVerified: false,
    },
    hasShieldGuard: false,
    instantHandover: true,
  },
  {
    id: "AX-7741",
    title: "Collector Stacked | Prime Granger + Lightborn Squad",
    rank: "Mythic Honor",
    skins: 140,
    heroes: 110,
    price: 75000,
    seller: {
      username: "GusionKing",
      isVerified: true,
      rating: 4.8,
      salesCount: 38,
      isIgVerified: true,
      igHandle: "@gusion_store",
    },
    hasShieldGuard: true,
    instantHandover: false,
  },
  {
    id: "AX-6623",
    title: "Epic II Starter Account | Clean Email | 30 Heroes",
    rank: "Epic",
    skins: 28,
    heroes: 30,
    price: 12000,
    seller: {
      username: "ChouGod",
      isVerified: false,
      rating: 4.5,
      salesCount: 3,
      isIgVerified: false,
    },
    hasShieldGuard: false,
    instantHandover: true,
  },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("All Ranks");
  const [maxPrice, setMaxPrice] = useState(150000);
  const [shieldOnlyFilter, setShieldOnlyFilter] = useState(false);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedRank("All Ranks");
    setMaxPrice(150000);
    setShieldOnlyFilter(false);
  };

  const filteredListings = MOCK_LISTINGS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = selectedRank === "All Ranks" || item.rank === selectedRank;
    const matchesPrice = item.price <= maxPrice;
    const matchesShield = !shieldOnlyFilter || item.hasShieldGuard;
    return matchesSearch && matchesRank && matchesPrice && matchesShield;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#EDEFF2]">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#151922] via-[#1A202C] to-[#151922] p-6 md:p-8 rounded-2xl border border-[#242938] shadow-2xl">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#FFB020]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFB020] text-[#0B0E14] font-black px-3 py-1 rounded-md text-xs tracking-wider uppercase">
              ASSETXTACK
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#FFB020] bg-[#FFB020]/10 px-3 py-1 rounded-md border border-[#FFB020]/20 flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={14} /> Escrow Vault Secured
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#EDEFF2] font-display tracking-tight">
            Browse Verified MLBB Accounts
          </h1>
          <p className="text-sm md:text-base text-[#8A93A3] max-w-xl leading-relaxed">
            Buy and sell Mobile Legends accounts with automated anti-pullback escrow protection and verified seller identity badges.
          </p>
        </div>

        {/* Quick Shield Promo Card */}
        <div className="relative z-10 bg-[#0B0E14]/80 border border-[#FFB020]/30 rounded-xl p-4 flex items-center gap-3.5 shrink-0 backdrop-blur-sm">
          <div className="p-3 bg-[#FFB020]/20 border border-[#FFB020]/40 text-[#FFB020] rounded-xl">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#FFB020] flex items-center gap-1">
              AssetXtack Shield Guard
            </p>
            <p className="text-[#8A93A3] text-xs mt-0.5">Protected accounts get instant escrow release</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-[#151922] border border-[#242938] p-6 rounded-2xl h-fit space-y-6 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
            <div className="flex items-center gap-2 text-base font-bold text-[#EDEFF2]">
              <Filter size={18} className="text-[#FFB020]" />
              Filter Listings
            </div>
            <button 
              onClick={resetFilters}
              className="text-xs text-[#8A93A3] hover:text-[#FFB020] transition-colors flex items-center gap-1 font-medium"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-xs text-[#8A93A3] font-bold block mb-2 uppercase tracking-wider">
              Search Keyword
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Collector, Fanny, Prime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-3 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 transition-all"
              />
            </div>
          </div>

          {/* Rank Tier Selector */}
          <div>
            <label className="text-xs text-[#8A93A3] font-bold block mb-2 uppercase tracking-wider">
              Rank Tier
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3.5 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/60 transition-all cursor-pointer"
            >
              <option>All Ranks</option>
              <option>Mythic Glory</option>
              <option>Mythic Honor</option>
              <option>Legend</option>
              <option>Epic</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider">Max Price</label>
              <span className="text-sm font-mono font-bold text-[#FFB020]">
                ₦{maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FFB020] bg-[#0B0E14] rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Shield Protection Toggle Filter */}
          <div className="pt-4 border-t border-[#242938]">
            <button 
              type="button"
              onClick={() => setShieldOnlyFilter(!shieldOnlyFilter)}
              className="w-full flex items-center justify-between cursor-pointer p-3 rounded-xl border border-[#242938] bg-[#0B0E14] hover:border-[#FFB020]/40 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#EDEFF2]">
                <ShieldCheck size={18} className="text-[#FFB020]" />
                <span>Shield Protected Only</span>
              </div>
              <input 
                type="checkbox" 
                checked={shieldOnlyFilter}
                readOnly
                className="accent-[#FFB020] h-4 w-4 rounded cursor-pointer pointer-events-none"
              />
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-sm text-[#8A93A3] px-1">
            <span>Showing <strong className="text-[#EDEFF2] font-mono font-bold">{filteredListings.length}</strong> verified account listings</span>
          </div>

          {filteredListings.length === 0 ? (
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-12 text-center space-y-3">
              <p className="text-lg font-bold text-[#EDEFF2]">No accounts match your filter criteria</p>
              <p className="text-sm text-[#8A93A3]">Try loosening your price range or search terms.</p>
              <button 
                onClick={resetFilters}
                className="mt-2 inline-flex items-center gap-2 bg-[#FFB020] text-[#0B0E14] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#e09b1c] transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`relative bg-[#151922] border transition-all p-6 rounded-2xl flex flex-col justify-between gap-5 group hover:shadow-xl ${
                    listing.hasShieldGuard 
                      ? "border-[#FFB020]/50 hover:border-[#FFB020] shadow-amber-500/5 bg-gradient-to-b from-[#181d29] to-[#151922]" 
                      : "border-[#242938] hover:border-[#FFB020]/40"
                  }`}
                >
                  {/* TOP ROW: Badges & Handover */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Rank Badge */}
                        <span className="text-xs font-bold bg-[#7C5CFC]/15 text-[#9175ff] px-3 py-1 rounded-lg border border-[#7C5CFC]/30">
                          {listing.rank}
                        </span>

                        {/* AssetXtack Shield Protection Badge */}
                        {listing.hasShieldGuard && (
                          <span className="text-xs font-bold bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/40 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <ShieldCheck size={15} className="text-[#FFB020]" /> Shield Guard
                          </span>
                        )}
                      </div>

                      {/* Instant Handover Tag */}
                      {listing.instantHandover && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          <Zap size={14} /> Instant
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[#EDEFF2] group-hover:text-[#FFB020] transition-colors line-clamp-2 leading-snug">
                      {listing.title}
                    </h3>

                    {/* Account Stats Pill Box */}
                    <div className="grid grid-cols-2 gap-3 bg-[#0B0E14] p-3 rounded-xl border border-[#242938]/80">
                      <div>
                        <span className="text-[#8A93A3] text-xs block font-semibold">Skins</span>
                        <span className="text-sm font-bold font-mono text-[#EDEFF2]">{listing.skins} Skins</span>
                      </div>
                      <div>
                        <span className="text-[#8A93A3] text-xs block font-semibold">Heroes</span>
                        <span className="text-sm font-bold font-mono text-[#EDEFF2]">{listing.heroes} Heroes</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ROW: Seller Profile Info & Price CTA */}
                  <div className="pt-4 border-t border-[#242938] flex items-end justify-between gap-3">
                    
                    {/* Seller Profile Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#EDEFF2] hover:underline cursor-pointer">
                          {listing.seller.username}
                        </span>

                        {/* Verified Seller Checkmark */}
                        {listing.seller.isVerified && (
                          <span title="Verified Seller Identity" className="text-emerald-400 shrink-0">
                            <CheckCircle2 size={16} className="fill-emerald-400/20" />
                          </span>
                        )}

                        {/* Instagram Verified Tag */}
                        {listing.seller.isIgVerified && (
                          <span 
                            title={`Instagram Verified (${listing.seller.igHandle})`} 
                            className="bg-pink-500/15 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <FaInstagram size={13} />
                          </span>
                        )}
                      </div>

                      {/* Stars & Sales Rating */}
                      <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                        <span className="flex items-center gap-1 text-[#FFB020] font-bold">
                          <Star size={13} className="fill-[#FFB020]" />
                          {listing.seller.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{listing.seller.salesCount} sales</span>
                      </div>

                      {/* Price Display */}
                      <div className="pt-1">
                        <span className="text-lg font-black text-[#EDEFF2] font-mono">
                          ₦{listing.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Inspect CTA Button */}
                    <button className="flex items-center gap-1.5 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-extrabold text-sm px-4.5 py-3 rounded-xl transition-all shadow-md shrink-0">
                      Inspect <ArrowUpRight size={16} />
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}