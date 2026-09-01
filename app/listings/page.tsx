"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Search,
  SlidersHorizontal,
  ShieldAlert,
  Star,
  Gamepad2,
  Sparkles,
  Eye,
  Loader2,
  Zap,
  ChevronDown,
} from "lucide-react";

interface ListingData {
  id: string;
  title?: string;
  price?: number;
  gameId: string;
  gameName: string;
  loginProvider?: string;
  accountType?: string;
  rank?: string;
  gameAttributes?: Record<string, string | number | boolean>;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  featuredSkins?: string[];
  images?: string[];
  status?: string;
  sellerRating?: string | number;
  isFeatured?: boolean;
  hasShieldProtection?: boolean;
  views?: number;
  createdAt?: unknown;
}

const formatAttributeLabel = (attr: string) => {
  return attr
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function ListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("All");
  const [selectedGame, setSelectedGame] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  useEffect(() => {
    const q = query(collection(db, "listings"), where("status", "==", "Active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ListingData));
      setListings(liveDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listings:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ranks = Array.from(new Set(listings.map((l) => l.rank).filter((r): r is string => typeof r === "string" && r.length > 0)));
  const games = Array.from(new Set(listings.map((l) => l.gameName).filter((g): g is string => typeof g === "string" && g.length > 0)));

  const filtered = listings
    .filter((item) => {
      const matchesSearch =
        (item.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = selectedRank === "All" || item.rank === selectedRank;
      const matchesGame = selectedGame === "All" || item.gameName === selectedGame;
      const matchesPrice = maxPrice === "" || (typeof item.price === "number" && item.price <= maxPrice);
      return matchesSearch && matchesRank && matchesGame && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

  const handlePostAccount = () => {
    if (!user) {
      router.push("/sign-in?mode=signup");
    } else {
      router.push("/sell");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <section className="bg-[#151922] border border-[#242938] rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#FFB020]/10 border border-[#FFB020]/20">
                <Sparkles size={14} className="text-[#FFB020]" />
                <span className="text-xs font-bold text-[#FFB020] font-[var(--font-mono)] uppercase tracking-wider">Marketplace</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#EDEFF2] font-[var(--font-display)]">Browse Listings</h1>
              <p className="text-base text-[#8A93A3] max-w-xl">
                Discover verified publisher accounts with escrow protection. Every trade is secured by AssetXtack Shield.
              </p>
            </div>
            <button
              onClick={handlePostAccount}
              className="inline-flex items-center justify-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 shrink-0"
            >
              <Sparkles size={18} /> List an Account
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-[#151922] border border-[#242938] rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
              <input
                type="text"
                placeholder="Search ID or account title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="appearance-none bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                >
                  <option value="All">All Ranks</option>
                  {ranks.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A3] pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="appearance-none bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                >
                  <option value="All">All Games</option>
                  {games.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A3] pointer-events-none" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-32 bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-4 py-2.5 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <SlidersHorizontal size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A3] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-20 text-center text-[#8A93A3] flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-[#FFB020]" />
            <p className="text-sm font-medium">Fetching live listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-[#151922] border border-[#242938] text-[#8A93A3] rounded-2xl flex items-center justify-center mx-auto">
              <Gamepad2 size={30} />
            </div>
            <p className="text-lg font-semibold text-[#EDEFF2]">No listings found</p>
            <p className="text-sm text-[#8A93A3]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 hover:scale-[1.02] block"
              >
                {item.isFeatured && (
                  <div className="absolute inset-[-1000%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#151922_0%,#FFB020_50%,#151922_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="relative h-full bg-[#151922] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-[#8A93A3] uppercase tracking-wider">{item.rank || "Unranked"}</span>
                      <span className="text-sm font-bold text-[#FFB020] flex items-center gap-1.5">
                        <Star size={14} fill="#FFB020" /> {typeof item.sellerRating === "number" ? item.sellerRating.toFixed(1) : typeof item.sellerRating === "string" ? item.sellerRating : "5.0"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#EDEFF2] line-clamp-2 mb-4 group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                    {item.gameAttributes && Object.keys(item.gameAttributes).length > 0 ? (
                      <div className="flex items-center gap-3 text-sm text-[#8A93A3] mb-4 flex-wrap">
                        {Object.entries(item.gameAttributes).slice(0, 3).map(([key, value]) => (
                          <span key={key}>
                            {formatAttributeLabel(key)}: <strong className="text-[#EDEFF2]">{String(value)}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm text-[#8A93A3] mb-4">
                        <span>Rank: <strong className="text-[#EDEFF2]">{item.rank || "Unranked"}</strong></span>
                        <span>Price: <strong className="text-emerald-400">₦{(item.price || 0).toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#242938]">
                    <div>
                      <span className="text-xs text-[#8A93A3] font-semibold block uppercase mb-1">Price</span>
                      <strong className="text-lg font-black text-emerald-400 font-mono">₦{(item.price || 0).toLocaleString()}</strong>
                    </div>
                    <span className="text-sm font-semibold text-[#8A93A3] flex items-center gap-1.5 group-hover:text-[#FFB020] transition-colors">
                      <Eye size={16} /> View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
