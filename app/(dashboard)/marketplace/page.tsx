"use client"; // Remove space if present in your file

import { useState } from "react";
import { Search, Filter, Shield, Zap, Sparkles, ArrowUpRight } from "lucide-react";

// Mock data for MLBB account listings
const MOCK_LISTINGS = [
  {
    id: "AX-9821",
    title: "Mythic Glory 82 Stars | 112 Skins (3 Collector, 2 Legend)",
    rank: "Mythic Glory",
    skins: 112,
    heroes: 88,
    price: 45000,
    seller: "KaguraMain",
    rating: 5.0,
    instantHandover: true,
  },
  {
    id: "AX-8812",
    title: "Smurf Account | Legend V | High Winrate Fanny (80%)",
    rank: "Legend",
    skins: 45,
    heroes: 52,
    price: 18500,
    seller: "FastHands_NG",
    rating: 4.9,
    instantHandover: true,
  },
  {
    id: "AX-7741",
    title: "Collector Stacked | Prime Granger + Lightborn Squad",
    rank: "Mythic Honor",
    skins: 140,
    heroes: 110,
    price: 75000,
    seller: "GusionKing",
    rating: 4.8,
    instantHandover: false,
  },
  {
    id: "AX-6623",
    title: "Epic II Starter Account | Clean Email | 30 Heroes",
    rank: "Epic",
    skins: 28,
    heroes: 30,
    price: 12000,
    seller: "ChouGod",
    rating: 5.0,
    instantHandover: true,
  },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("All Ranks");
  const [maxPrice, setMaxPrice] = useState(150000);

  const filteredListings = MOCK_LISTINGS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = selectedRank === "All Ranks" || item.rank === selectedRank;
    const matchesPrice = item.price <= maxPrice;
    return matchesSearch && matchesRank && matchesPrice;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#151922] to-[#1A202C] p-6 rounded-2xl border border-[#242938]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFB020] bg-[#FFB020]/10 px-2.5 py-1 rounded-md border border-[#FFB020]/20">
            Escrow Protected
          </span>
          <h1 className="text-2xl font-bold text-[#EDEFF2] mt-2 font-display">
            Browse MLBB Accounts
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Verified Mobile Legends accounts backed by local automated escrow vault.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-[#151922] border border-[#242938] p-5 rounded-2xl h-fit space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#242938]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#EDEFF2]">
              <Filter size={16} className="text-[#FFB020]" />
              Filters
            </div>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedRank("All Ranks"); setMaxPrice(150000); }}
              className="text-[11px] text-[#8A93A3] hover:text-[#FFB020] transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-[11px] text-[#8A93A3] font-medium block mb-2">
              Search Keyword
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Collector, Fanny, Prime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-8 pr-3 py-2 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
              />
            </div>
          </div>

          {/* Rank Selector */}
          <div>
            <label className="text-[11px] text-[#8A93A3] font-medium block mb-2">
              Rank Tier
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
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
              <label className="text-[11px] text-[#8A93A3] font-medium">Max Price</label>
              <span className="text-xs font-mono font-bold text-[#FFB020]">
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
              className="w-full accent-[#FFB020] bg-[#0B0E14] rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8A93A3] px-1">
            <span>Showing <strong className="text-[#EDEFF2]">{filteredListings.length}</strong> active listings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-[#151922] border border-[#242938] hover:border-[#FFB020]/40 transition-all p-5 rounded-2xl flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium bg-[#7C5CFC]/10 text-[#7C5CFC] px-2.5 py-1 rounded-md border border-[#7C5CFC]/20">
                      {listing.rank}
                    </span>
                    {listing.instantHandover && (
                      <span className="text-[10px] font-medium text-[#FFB020] flex items-center gap-1">
                        <Zap size={12} /> Instant Handover
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[#EDEFF2] group-hover:text-[#FFB020] transition-colors line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 bg-[#0B0E14] p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[#8A93A3] text-[10px] block">Skins</span>
                      <span className="font-bold text-[#EDEFF2]">{listing.skins}</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[10px] block">Heroes</span>
                      <span className="font-bold text-[#EDEFF2]">{listing.heroes}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#242938]">
                  <div>
                    <span className="text-[10px] text-[#8A93A3] block">Seller: {listing.seller}</span>
                    <span className="text-base font-bold text-[#EDEFF2] font-mono">
                      ₦{listing.price.toLocaleString()}
                    </span>
                  </div>

                  <button className="flex items-center gap-1.5 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md">
                    Inspect <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}