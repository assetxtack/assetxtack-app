"use client";

import Link from "next/link";
import { 
  Star, 
  Shield, 
  Zap, 
  Sparkles, 
  Eye, 
  Gamepad2, 
  Trophy, 
  Gem, 
  Sword, 
  Shield as ShieldIcon, 
  Building2, 
  Target, 
  Users, 
  Zap as ZapIcon,
  Crown,
  Medal,
  Heart,
  Crosshair,
  ShieldCheck,
  TrendingUp
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
  structuredAssets?: Record<string, unknown>;
  sellerName?: string;
  sellerVerified?: boolean;
}

type GameCategory = 
  | "MOBA" 
  | "STRATEGY" 
  | "SHOOTER" 
  | "BATTLE_ROYALE" 
  | "FPS" 
  | "MMO" 
  | "OTHER";

const GAME_CATEGORY_MAP: Record<string, GameCategory> = {
  "mobile-legends": "MOBA",
  "league-of-legends": "MOBA",
  "clash-of-clans": "STRATEGY",
  "call-of-duty-mobile": "SHOOTER",
  "pubg-mobile": "BATTLE_ROYALE",
  "valorant": "FPS",
  "cs2": "FPS",
  "fortnite": "BATTLE_ROYALE",
  "free-fire": "BATTLE_ROYALE",
};

const GAME_DISPLAY_NAMES: Record<string, string> = {
  "mobile-legends": "Mobile Legends",
  "clash-of-clans": "Clash of Clans",
  "call-of-duty-mobile": "Call of Duty Mobile",
  "pubg-mobile": "PUBG Mobile",
  "valorant": "Valorant",
  "cs2": "Counter-Strike 2",
  "fortnite": "Fortnite",
  "league-of-legends": "League of Legends",
  "free-fire": "Free Fire",
};

const CATEGORY_ICONS: Record<GameCategory, React.ReactNode> = {
  MOBA: <Sword className="w-4 h-4" />,
  STRATEGY: <Building2 className="w-4 h-4" />,
  SHOOTER: <Crosshair className="w-4 h-4" />,
  BATTLE_ROYALE: <Users className="w-4 h-4" />,
  FPS: <Target className="w-4 h-4" />,
  MMO: <Gamepad2 className="w-4 h-4" />,
  OTHER: <Gamepad2 className="w-4 h-4" />,
};

const CATEGORY_GRADIENTS: Record<GameCategory, string> = {
  MOBA: "from-purple-500/30 via-purple-600/20 to-purple-500/30",
  STRATEGY: "from-amber-500/30 via-amber-600/20 to-amber-500/30",
  SHOOTER: "from-red-500/30 via-red-600/20 to-red-500/30",
  BATTLE_ROYALE: "from-orange-500/30 via-orange-600/20 to-orange-500/30",
  FPS: "from-blue-500/30 via-blue-600/20 to-blue-500/30",
  MMO: "from-emerald-500/30 via-emerald-600/20 to-emerald-500/30",
  OTHER: "from-slate-500/30 via-slate-600/20 to-slate-500/30",
};

const CATEGORY_ACCENT_COLORS: Record<GameCategory, string> = {
  MOBA: "text-purple-400",
  STRATEGY: "text-amber-400",
  SHOOTER: "text-red-400",
  BATTLE_ROYALE: "text-orange-400",
  FPS: "text-blue-400",
  MMO: "text-emerald-400",
  OTHER: "text-slate-400",
};

const CATEGORY_BORDER_COLORS: Record<GameCategory, string> = {
  MOBA: "border-purple-500/30",
  STRATEGY: "border-amber-500/30",
  SHOOTER: "border-red-500/30",
  BATTLE_ROYALE: "border-orange-500/30",
  FPS: "border-blue-500/30",
  MMO: "border-emerald-500/30",
  OTHER: "border-slate-500/30",
};

const CATEGORY_GLOW_COLORS: Record<GameCategory, string> = {
  MOBA: "shadow-purple-500/10",
  STRATEGY: "shadow-amber-500/10",
  SHOOTER: "shadow-red-500/10",
  BATTLE_ROYALE: "shadow-orange-500/10",
  FPS: "shadow-blue-500/10",
  MMO: "shadow-emerald-500/10",
  OTHER: "shadow-slate-500/10",
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  rank: <Trophy className="w-4 h-4" />,
  skinsCount: <Gem className="w-4 h-4" />,
  heroesCount: <Users className="w-4 h-4" />,
  winRate: <TrendingUp className="w-4 h-4" />,
  townHallLevel: <Building2 className="w-4 h-4" />,
  heroLevels: <ShieldIcon className="w-4 h-4" />,
  builderHall: <Building2 className="w-4 h-4" />,
  gems: <Gem className="w-4 h-4" />,
  level: <Zap className="w-4 h-4" />,
  weapons: <Sword className="w-4 h-4" />,
  operatorSkins: <Medal className="w-4 h-4" />,
  tier: <Crown className="w-4 h-4" />,
  kdRatio: <Target className="w-4 h-4" />,
  cosmetics: <Heart className="w-4 h-4" />,
  hoursPlayed: <Zap className="w-4 h-4" />,
  skins: <Gem className="w-4 h-4" />,
  agents: <Users className="w-4 h-4" />,
  inventoryValue: <Gem className="w-4 h-4" />,
};

const formatNumber = (num: number | undefined): string => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatAttributeLabel = (attr: string): string => {
  return attr
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const getCategoryFromGameId = (gameId: string): GameCategory => {
  return GAME_CATEGORY_MAP[gameId] || "OTHER";
};

const getDisplayName = (gameId: string): string => {
  return GAME_DISPLAY_NAMES[gameId] || gameId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: string;
  key: string;
}

const getStringValue = (val: string | number | boolean | undefined): string => {
  if (val === undefined || val === null) return "N/A";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
};

const getNumberValue = (val: string | number | boolean | undefined): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "number") return val;
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
};

const getGameSpecificStats = (listing: ListingData): StatItem[] => {
  const gameId = listing.gameId;
  const attrs = listing.gameAttributes || {};
  const category = getCategoryFromGameId(gameId);
  const structuredAssets = listing.structuredAssets || {};
  
  const stats: StatItem[] = [];

  const addStat = (key: string, label: string, value: string | number | boolean | undefined, icon?: React.ReactNode) => {
    const strValue = getStringValue(value);
    const numValue = getNumberValue(value);
    if (strValue !== "N/A" && strValue !== "0" && strValue !== "") {
      stats.push({ 
        key, 
        label, 
        value: typeof value === "number" || (typeof value === "string" && !isNaN(Number(value))) ? formatNumber(numValue) : strValue,
        icon: icon || STAT_ICONS[key],
        accentColor: CATEGORY_ACCENT_COLORS[category]
      });
    }
  };

  switch (category) {
    case "MOBA": {
      addStat("rank", "Rank", attrs.rank ?? listing.rank, <Trophy className="w-4 h-4" />);
      addStat("skinsCount", "Skins", attrs.skinsCount ?? listing.skinsCount, <Gem className="w-4 h-4" />);
      addStat("heroesCount", "Heroes", attrs.heroesCount ?? listing.heroesCount, <Users className="w-4 h-4" />);
      addStat("winRate", "Win Rate", attrs.winRate ?? listing.winRate, <TrendingUp className="w-4 h-4" />);
      break;
    }
    case "STRATEGY": {
      addStat("townHallLevel", "Town Hall", attrs.townHallLevel ?? attrs.rank, <Building2 className="w-4 h-4" />);
      addStat("heroesCount", "Heroes", attrs.heroesCount ?? listing.heroesCount, <Users className="w-4 h-4" />);
      addStat("heroLevels", "Hero Levels", attrs.heroLevels, <ShieldIcon className="w-4 h-4" />);
      addStat("builderHall", "Builder Hall", attrs.builderHall, <Building2 className="w-4 h-4" />);
      addStat("gems", "Gems", attrs.gems, <Gem className="w-4 h-4" />);
      break;
    }
    case "SHOOTER": {
      addStat("rank", "Rank", attrs.rank, <Trophy className="w-4 h-4" />);
      addStat("level", "Level", attrs.level, <Zap className="w-4 h-4" />);
      addStat("weapons", "Legendary Weapons", attrs.weapons, <Sword className="w-4 h-4" />);
      addStat("operatorSkins", "Operator Skins", attrs.operatorSkins, <Medal className="w-4 h-4" />);
      addStat("tier", "Tier", attrs.tier, <Crown className="w-4 h-4" />);
      break;
    }
    case "BATTLE_ROYALE": {
      addStat("rank", "Rank", attrs.rank, <Trophy className="w-4 h-4" />);
      addStat("level", "Level", attrs.level ?? attrs.seasonLevel, <Zap className="w-4 h-4" />);
      addStat("kdRatio", "K/D Ratio", attrs.kdRatio, <Target className="w-4 h-4" />);
      addStat("cosmetics", "Cosmetics", attrs.cosmetics, <Heart className="w-4 h-4" />);
      break;
    }
    case "FPS": {
      addStat("rank", "Rank", attrs.rank, <Trophy className="w-4 h-4" />);
      addStat("hoursPlayed", "Hours Played", attrs.hoursPlayed, <Zap className="w-4 h-4" />);
      addStat("skins", "Skins", attrs.skins, <Gem className="w-4 h-4" />);
      addStat("agents", "Agents", attrs.agents ?? attrs.champions, <Users className="w-4 h-4" />);
      addStat("inventoryValue", "Inventory Value", attrs.inventoryValue, <Gem className="w-4 h-4" />);
      break;
    }
    default: {
      addStat("rank", "Rank", attrs.rank ?? listing.rank, <Trophy className="w-4 h-4" />);
      addStat("skinsCount", "Skins", attrs.skinsCount ?? listing.skinsCount, <Gem className="w-4 h-4" />);
      addStat("heroesCount", "Characters", attrs.heroesCount ?? listing.heroesCount, <Users className="w-4 h-4" />);
      Object.entries(attrs).forEach(([key, value]) => {
        if (!["rank", "skinsCount", "heroesCount"].includes(key)) {
          addStat(key, formatAttributeLabel(key), value);
        }
      });
      break;
    }
  }

  return stats;
};

export default function MarketplaceListingCard({ listing }: { listing: ListingData }) {
  const category = getCategoryFromGameId(listing.gameId);
  const displayName = getDisplayName(listing.gameId);
  const categoryIcon = CATEGORY_ICONS[category];
  const categoryGradient = CATEGORY_GRADIENTS[category];
  const categoryAccent = CATEGORY_ACCENT_COLORS[category];
  const categoryBorder = CATEGORY_BORDER_COLORS[category];
  const categoryGlow = CATEGORY_GLOW_COLORS[category];
  const stats = getGameSpecificStats(listing);
  const images = Array.isArray(listing.images) ? listing.images : [];
  const hasImage = images.length > 0;
  const imageUrl = hasImage ? images[0] : null;

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group relative block"
      aria-label={`View ${listing.title || "listing"} details`}
    >
      <article className={`relative group relative h-full bg-[#151922] rounded-2xl p-5 flex flex-col justify-between border ${categoryBorder} 
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:border-[#FFB020]/60 hover:shadow-2xl ${categoryGlow}
        hover:shadow-[0_0_40px_-5px] 
      `}>
        {/* Animated Gradient Border Glow */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${categoryGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 blur-[60px] scale-110`} />
        
        {/* Featured Gradient Overlay */}
        {listing.isFeatured && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none rounded-2xl" />
        )}

        {/* Top Section: Image + Badges */}
        <div className="relative mb-4">
          {imageUrl && (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#0B0E14] mb-3 relative">
              <img
                src={imageUrl}
                alt={listing.title || "Listing thumbnail"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/60 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Badges Row - Fully Flexible, No Truncation */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {/* Premium Game Category Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider shrink-0 
              bg-gradient-to-r ${categoryGradient} border-current/30 text-white
              shadow-sm shadow-current/20
              backdrop-blur-sm
            `}>
              <span className="relative z-10 flex items-center gap-1.5">
                {categoryIcon}
                <span className="whitespace-nowrap">{displayName}</span>
              </span>
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {listing.isFeatured && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase rounded-full backdrop-blur-sm">
                  <Sparkles size={10} /> Featured
                </span>
              )}
              {listing.hasShieldProtection && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase rounded-full backdrop-blur-sm">
                  <ShieldCheck size={10} /> Shield Protected
                </span>
              )}
              {listing.status === "Active" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded-full backdrop-blur-sm">
                  Live
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle Section: Title + Game-Specific Stats */}
        <div className="flex-1 min-h-0">
          {/* Title - No Truncation, Full Visibility */}
          <h3 className="text-lg font-bold text-[#EDEFF2] leading-snug mb-4 group-hover:text-[#FFB020] transition-colors duration-300 break-words whitespace-normal">
            {listing.title || "Untitled Listing"}
          </h3>

          {/* Dynamic Game-Specific Stats Grid */}
          {stats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.key}
                  className="group-stat relative p-4 bg-[#0B0E14]/80 border border-[#242938] rounded-xl transition-all duration-300 hover:border-[#FFB020]/40 hover:bg-[#0B0E14] hover:shadow-lg hover:shadow-[#FFB020]/5 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-xs text-[#8A93A3] mb-2">
                    {stat.icon && (
                      <span className={`flex-shrink-0 ${stat.accentColor || categoryAccent} transition-colors group-hover-stat:scale-110`}>
                        {stat.icon}
                      </span>
                    )}
                    <span className="font-semibold text-[#A0A8B8] whitespace-nowrap">{stat.label}</span>
                  </div>
                  <div className="text-base font-bold text-[#EDEFF2] leading-snug break-words whitespace-normal transition-colors group-hover-stat:text-[#FFB020]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback: Generic attribute display - Clean Key-Value Pairs */
            <div className="flex flex-wrap gap-2.5 mb-4">
              {Object.entries(listing.gameAttributes || {}).slice(0, 6).map(([key, value]) => (
                <div key={key} className="px-3 py-2 bg-[#0B0E14]/80 border border-[#242938] rounded-xl transition-all hover:border-[#FFB020]/30 hover:bg-[#0B0E14] backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium text-[#A0A8B8] whitespace-nowrap">{formatAttributeLabel(key)}:</span>
                    <strong className="text-[#EDEFF2] whitespace-nowrap">{String(value)}</strong>
                  </div>
                </div>
              ))}
              {Object.keys(listing.gameAttributes || {}).length === 0 && listing.rank && (
                <div className="px-3 py-2 bg-[#0B0E14]/80 border border-[#242938] rounded-xl transition-all hover:border-[#FFB020]/30 hover:bg-[#0B0E14] backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium text-[#A0A8B8]">Rank:</span>
                    <strong className="text-[#EDEFF2]">{listing.rank}</strong>
                  </div>
                </div>
              )}
              {Object.keys(listing.gameAttributes || {}).length > 6 && (
                <div className="px-3 py-2 bg-[#0B0E14]/80 border border-[#242938] rounded-xl text-[#8A93A3] text-sm font-medium">
                  +{Object.keys(listing.gameAttributes || {}).length - 6} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Seller + Price + CTA */}
        <div className="pt-4 border-t border-[#242938] relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Seller Info - No Truncation */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB020]/30 to-[#FF8C00]/30 border border-[#FFB020]/30 flex items-center justify-center text-[#FFB020] font-bold text-sm shrink-0 shadow-sm shadow-[#FFB020]/10">
                {listing.sellerName?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#EDEFF2] leading-snug break-words whitespace-normal">
                  {listing.sellerName || "Unknown Seller"}
                </p>
                <div className="flex items-center gap-2 text-[11px] mt-1 flex-wrap">
                  {listing.sellerVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                  {!listing.sellerVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-500/15 border border-slate-500/30 text-slate-400 rounded-full">
                      Unverified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full">
                    <Star size={10} className="fill-current" />
                    {typeof listing.sellerRating === "number" ? listing.sellerRating.toFixed(1) : typeof listing.sellerRating === "string" ? listing.sellerRating : "5.0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price - Premium Display */}
            <div className="text-right shrink-0 min-w-[120px]">
              <p className="text-[10px] text-[#8A93A3] font-semibold uppercase tracking-wider mb-1.5">Escrow Price</p>
              <p className="text-2xl font-black text-emerald-400 font-mono leading-none">₦{(listing.price || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* View Details CTA - Full Width, Premium */}
          <div className="mt-4 pt-4 border-t border-[#242938]">
            <span className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FFB020]/10 to-[#FF8C00]/10 border border-[#FFB020]/30 text-[#FFB020] font-semibold text-sm rounded-xl 
              transition-all duration-300
              hover:bg-gradient-to-r hover:from-[#FFB020]/20 hover:to-[#FF8C00]/20
              group-hover:bg-gradient-to-r group-hover:from-[#FFB020] group-hover:to-[#FF8C00] group-hover:text-[#0B0E14] group-hover:border-transparent
              group-hover:shadow-lg group-hover:shadow-[#FFB020]/25
              active:scale-[0.98]
            ">
              <Eye size={16} className="transition-transform group-hover:scale-110" />
              <span>View Details</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}