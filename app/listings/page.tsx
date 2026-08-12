"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ShieldCheck, Zap, Star, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";

// Mock data representing database listings
const MOCK_LISTINGS = [
  {
    id: "1",
    title: "Mythic Glory 82 Stars | 112 Skins (3 Collector, 2 Legend)",
    rank: "Mythic Glory",
    skins: 112,
    heroes: 88,
    price: 45000,
    seller: "KaguraMain",
    rating: "5.0",
    verified: true,
    category: "Mythic Glory",
  },
  {
    id: "2",
    title: "Smurf Account | Legend V | High Winrate Fanny (80%)",
    rank: "Legend V",
    skins: 45,
    heroes: 52,
    price: 18500,
    seller: "FastHands_NG",
    rating: "4.9",
    verified: true,
    category: "Smurf Accounts",
  },
  {
    id: "3",
    title: "Collector Stacked | Prime Granger + Lightborn Squad",
    rank: "Mythic Honor",
    skins: 154,
    heroes: 102,
    price: 75000,
    seller: "LagosGamer",
    rating: "5.0",
    verified: true,
    category: "Rare Skins",
  },
  {
    id: "4",
    title: "Epic II Starter Account | Clean Email | 30 Heroes",
    rank: "Epic II",
    skins: 28,
    heroes: 32,
    price: 12000,
    seller: "MLBB_Vendor",
    rating: "4.7",
    verified: false,
    category: "Smurf Accounts",
  },
  {
    id: "5",
    title: "Mythic I | 95 Skins | Venom & Dragon Tamer Complete",
    rank: "Mythic",
    skins: 95,
    heroes: 78,
    price: 38000,
    seller: "ProTrader99",
    rating: "4.8",
    verified: true,
    category: "Mythic Glory",
  },
  {
    id: "6",
    title: "Mythic Glory 110 Stars | All Heroes Unlocked | 200+ Skins",
    rank: "Mythic Glory",
    skins: 210,
    heroes: 124,
    price: 120000,
    seller: "Apex_Accounts",
    rating: "5.0",
    verified: true,
    category: "Rare Skins",
  },
];

const RANKS = ["All Ranks", "Mythic Glory", "Mythic Honor", "Mythic", "Legend V", "Epic II"];

export default function ListingsPage() {
  const [search, setSearch] = useState("");
  const [selectedRank, setSelectedRank] = useState("All Ranks");
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

  // Filter listings dynamically
  const filteredListings = useMemo(() => {
    return MOCK_LISTINGS.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                            item.seller.toLowerCase().includes(search.toLowerCase());
      const matchesRank = selectedRank === "All Ranks" || item.rank === selectedRank;
      const matchesPrice = item.price <= maxPrice;

      return matchesSearch && matchesRank && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0; // Default ordering
    });
  }, [search, selectedRank, maxPrice, sortBy]);

  return (
    <div className="bg-[#0B0E14] min-h-screen font-[var(--font-body)] text-[#EDEFF2] pb-16">
      
      {/* Header Banner */}
      <div className="border-b border-[#242938] bg-[#151922] py-8 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-[var(--font-mono)] text-[#FFB020] mb-1">MARKETPLACE</div>
          <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)]">Browse MLBB Accounts</h1>
          <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
            Verified Mobile Legends accounts with local Escrow protection.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6 bg-[#151922] p-5 rounded-xl border border-[#242938] h-fit">
          <div className="flex items-center justify-between border-b border-[#242938] pb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#FFB020]" /> Filters
            </h2>
            <button 
              onClick={() => { setSearch(""); setSelectedRank("All Ranks"); setMaxPrice(150000); }} 
              className="text-xs text-[#8A93A3] hover:text-[#FFB020] transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Search Filter */}
          <div>
            <label className="text-xs text-[#8A93A3] block mb-2 font-medium">Search Keyword</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Collector, Fanny, Prime..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B0E14] text-xs text-[#EDEFF2] placeholder-[#8A93A3] pl-9 pr-3 py-2 rounded-lg border border-[#242938] focus:outline-none focus:border-[#FFB020]"
              />
            </div>
          </div>

          {/* Rank Filter */}
          <div>
            <label className="text-xs text-[#8A93A3] block mb-2 font-medium">Rank Tier</label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full bg-[#0B0E14] text-xs text-[#EDEFF2] px-3 py-2 rounded-lg border border-[#242938] focus:outline-none focus:border-[#FFB020]"
            >
              {RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8A93A3]">Max Price</span>
              <span className="font-semibold text-[#FFB020]">₦{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={150000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FFB020] cursor-pointer"
            />
          </div>
        </aside>

        {/* Main Listings Grid */}
        <main className="lg:col-span-3">
          
          {/* Top Bar / Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#151922] p-3 rounded-xl border border-[#242938]">
            <span className="text-xs text-[#8A93A3] pl-2">
              Showing <span className="text-[#EDEFF2] font-semibold">{filteredListings.length}</span> active listings
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8A93A3]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0B0E14] text-xs text-[#EDEFF2] px-3 py-1.5 rounded-lg border border-[#242938] focus:outline-none focus:border-[#FFB020]"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Results Grid */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#151922] border border-[#242938] hover:border-[#FFB020]/50 rounded-xl p-4 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30">
                        {item.rank}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#FFB020] font-semibold">
                        <Zap size={13} /> Instant Handover
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-[#EDEFF2] group-hover:text-[#FFB020] transition-colors line-clamp-2 mb-3">
                      {item.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#8A93A3] mb-4 bg-[#0B0E14] p-2.5 rounded-lg border border-[#242938]">
                      <div>Skins: <span className="text-[#EDEFF2] font-semibold">{item.skins}</span></div>
                      <div>Heroes: <span className="text-[#EDEFF2] font-semibold">{item.heroes}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#242938] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#8A93A3] flex items-center gap-1">
                        <span>{item.seller}</span>
                        {item.verified && <CheckCircle2 size={12} className="text-[#FFB020]" />}
                      </div>
                      <div className="flex items-center text-[11px] text-[#FFB020]">
                        <Star size={11} fill="#FFB020" className="mr-0.5" /> {item.rating}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-base font-bold text-[#EDEFF2]">₦{item.price.toLocaleString()}</div>
                      <Link 
                        href={`/listings/${item.id}`} 
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFB020] hover:underline mt-0.5"
                      >
                        Inspect <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#151922] rounded-xl border border-[#242938]">
              <p className="text-sm text-[#8A93A3]">No accounts found matching your filters.</p>
              <button
                onClick={() => { setSearch(""); setSelectedRank("All Ranks"); setMaxPrice(150000); }}
                className="mt-3 px-4 py-2 text-xs font-semibold bg-[#FFB020] text-[#0B0E14] rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}