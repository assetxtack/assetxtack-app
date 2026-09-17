"use client";

import Link from "next/link";
import { Star, Shield, Zap, Sparkles, Eye, Gamepad2, Trophy, Gem, Sword, Shield as ShieldIcon, Building2, Target, Users, Zap as ZapIcon } from "lucide-react";

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

type GameCategory = "MOBA" | "STRATEGY" | "SHOOTER" | "BATTLE_ROYALE" | "FPS" | "MMO" | "OTHER";

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
  MOBA: <Sword className="w-3.5 h-3.5" />,
  STRATEGY: <Building2 className="w-3.5 h-3.5" />,
  SHOOTER: <Target className="w-3.5 h-3.5" />,
  BATTLE_ROYALE: <Users className="w-3.5 h-3.5" />,
  FPS: <ZapIcon className="w-3.5 h-3.5" />,
  MMO: <Gamepad2 className="w-3.5 h-3.5" />,
  OTHER: <Gamepad2 className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<GameCategory, string> = {
  MOBA: "bg-purple-500/20 border-purple-500/30 text-purple-400",
  STRATEGY: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  SHOOTER: "bg-red-500/20 border-red-500/30 text-red-400",
  BATTLE_ROYALE: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  FPS: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  MMO: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  OTHER: "bg-slate-500/20 border-slate-500/30 text-slate-400",
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
  color?: string;
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

  switch (category) {
    case "MOBA": {
      const rankVal = attrs.rank ?? listing.rank;
      if (rankVal) {
        stats.push({ label: "Rank", value: getStringValue(rankVal), icon: <Trophy className="w-3.5 h-3.5" /> });
      }
      if (attrs.skinsCount || listing.skinsCount) {
        stats.push({ label: "Skins", value: formatNumber(getNumberValue(attrs.skinsCount ?? listing.skinsCount)), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      if (attrs.heroesCount || listing.heroesCount) {
        stats.push({ label: "Heroes", value: formatNumber(getNumberValue(attrs.heroesCount ?? listing.heroesCount)), icon: <Users className="w-3.5 h-3.5" /> });
      }
      if (attrs.winRate || listing.winRate) {
        stats.push({ label: "Win Rate", value: getStringValue(attrs.winRate ?? listing.winRate), icon: <Zap className="w-3.5 h-3.5" /> });
      }
      break;
    }
    case "STRATEGY": {
      if (attrs.rank) {
        stats.push({ label: "Town Hall", value: getStringValue(attrs.rank), icon: <Building2 className="w-3.5 h-3.5" /> });
      }
      if (attrs.gems) {
        stats.push({ label: "Gems", value: formatNumber(getNumberValue(attrs.gems)), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      if (attrs.heroLevels) {
        stats.push({ label: "Hero Levels", value: getStringValue(attrs.heroLevels), icon: <ShieldIcon className="w-3.5 h-3.5" /> });
      }
      if (attrs.builderHall) {
        stats.push({ label: "Builder Hall", value: getStringValue(attrs.builderHall), icon: <Building2 className="w-3.5 h-3.5" /> });
      }
      break;
    }
    case "SHOOTER": {
      if (attrs.rank) {
        stats.push({ label: "Rank", value: getStringValue(attrs.rank), icon: <Trophy className="w-3.5 h-3.5" /> });
      }
      if (attrs.level) {
        stats.push({ label: "Level", value: formatNumber(getNumberValue(attrs.level)), icon: <Zap className="w-3.5 h-3.5" /> });
      }
      if (attrs.weapons) {
        stats.push({ label: "Weapons", value: getStringValue(attrs.weapons), icon: <Sword className="w-3.5 h-3.5" /> });
      }
      if (attrs.operatorSkins) {
        stats.push({ label: "Operator Skins", value: getStringValue(attrs.operatorSkins), icon: <Users className="w-3.5 h-3.5" /> });
      }
      if (attrs.tier) {
        stats.push({ label: "Tier", value: getStringValue(attrs.tier), icon: <Zap className="w-3.5 h-3.5" /> });
      }
      break;
    }
    case "BATTLE_ROYALE": {
      if (attrs.rank) {
        stats.push({ label: "Rank", value: getStringValue(attrs.rank), icon: <Trophy className="w-3.5 h-3.5" /> });
      }
      if (attrs.level || attrs.seasonLevel) {
        stats.push({ label: "Level", value: formatNumber(getNumberValue(attrs.level ?? attrs.seasonLevel)), icon: <Zap className="w-3.5 h-3.5" /> });
      }
      if (attrs.kdRatio) {
        stats.push({ label: "K/D", value: getStringValue(attrs.kdRatio), icon: <Target className="w-3.5 h-3.5" /> });
      }
      if (attrs.cosmetics) {
        stats.push({ label: "Cosmetics", value: formatNumber(getNumberValue(attrs.cosmetics)), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      break;
    }
    case "FPS": {
      if (attrs.rank) {
        stats.push({ label: "Rank", value: getStringValue(attrs.rank), icon: <Trophy className="w-3.5 h-3.5" /> });
      }
      if (attrs.hoursPlayed) {
        stats.push({ label: "Hours", value: formatNumber(getNumberValue(attrs.hoursPlayed)), icon: <Zap className="w-3.5 h-3.5" /> });
      }
      if (attrs.skins) {
        stats.push({ label: "Skins", value: formatNumber(getNumberValue(attrs.skins)), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      if (attrs.agents || attrs.champions) {
        stats.push({ label: "Agents", value: formatNumber(getNumberValue(attrs.agents ?? attrs.champions)), icon: <Users className="w-3.5 h-3.5" /> });
      }
      if (attrs.inventoryValue) {
        stats.push({ label: "Inv. Value", value: getStringValue(attrs.inventoryValue), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      break;
    }
    default: {
      const rankVal = attrs.rank ?? listing.rank;
      if (rankVal) {
        stats.push({ label: "Rank", value: getStringValue(rankVal), icon: <Trophy className="w-3.5 h-3.5" /> });
      }
      if (attrs.skinsCount || listing.skinsCount) {
        stats.push({ label: "Skins", value: formatNumber(getNumberValue(attrs.skinsCount ?? listing.skinsCount)), icon: <Gem className="w-3.5 h-3.5" /> });
      }
      if (attrs.heroesCount || listing.heroesCount) {
        stats.push({ label: "Characters", value: formatNumber(getNumberValue(attrs.heroesCount ?? listing.heroesCount)), icon: <Users className="w-3.5 h-3.5" /> });
      }
      break;
    }
  }

  return stats;
};

export default function MarketplaceListingCard({ listing }: { listing: ListingData }) {
  const category = getCategoryFromGameId(listing.gameId);
  const displayName = getDisplayName(listing.gameId);
  const categoryIcon = CATEGORY_ICONS[category];
  const categoryColor = CATEGORY_COLORS[category];
  const stats = getGameSpecificStats(listing);
  const images = Array.isArray(listing.images) ? listing.images : [];
  const hasImage = images.length > 0;
  const imageUrl = hasImage ? images[0] : null;

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] block"
    >
      {listing.isFeatured && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />
      )}
      
      <div className="relative h-full bg-[#151922] rounded-2xl p-5 flex flex-col justify-between border border-[#242938] group-hover:border-[#FFB020]/50 transition-colors duration-300">
        {/* Top Section: Image + Badges */}
        <div className="relative mb-4">
          {imageUrl && (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#0B0E14] mb-3">
              <img
                src={imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-2 flex-wrap">
            {/* Game Category Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${categoryColor} shrink-0`}>
              {categoryIcon}
              <span>{displayName}</span>
            </div>
            
            {/* Status Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {listing.isFeatured && (
                <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Featured
                </span>
              )}
              {listing.hasShieldProtection && (
                <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                  <Shield size={10} /> Shield
                </span>
              )}
              {listing.status === "Active" && (
                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded-full">Live</span>
              )}
            </div>
          </div>
        </div>

        {/* Middle Section: Title + Game-Specific Stats */}
        <div className="flex-1 min-h-0">
          <h3 className="text-lg font-bold text-[#EDEFF2] leading-snug mb-4 group-hover:text-[#FFB020] transition-colors break-words">
            {listing.title || "Untitled Listing"}
          </h3>

          {/* Dynamic Game-Specific Stats Grid */}
          {stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {stats.slice(0, 4).map((stat, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#0B0E14] border border-[#242938] rounded-xl transition-all hover:border-[#FFB020]/30"
                >
                  <div className="flex items-center gap-2 text-xs text-[#8A93A3] mb-1">
                    {stat.icon && <span className="text-[#FFB020]">{stat.icon}</span>}
                    <span className="font-medium">{stat.label}</span>
                  </div>
                  <div className="text-sm font-bold text-[#EDEFF2] break-words leading-snug">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback: Generic attribute display */
            <div className="flex flex-wrap gap-3 text-sm text-[#8A93A3] mb-4">
              {Object.entries(listing.gameAttributes || {}).slice(0, 3).map(([key, value]) => (
                <span key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0B0E14] border border-[#242938] rounded-lg">
                  <span className="font-medium">{formatAttributeLabel(key)}:</span>
                  <strong className="text-[#EDEFF2]">{String(value)}</strong>
                </span>
              ))}
              {Object.keys(listing.gameAttributes || {}).length === 0 && (
                <span className="flex items-center gap-2 px-2.5 py-1 bg-[#0B0E14] border border-[#242938] rounded-lg">
                  <span>Rank:</span>
                  <strong className="text-[#EDEFF2]">{listing.rank || "Unranked"}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Seller + Price */}
        <div className="pt-4 border-t border-[#242938]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Seller Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#FFB020]/20 flex items-center justify-center text-[#FFB020] font-bold text-xs shrink-0">
                {listing.sellerName?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#EDEFF2] truncate block">{listing.sellerName || "Unknown Seller"}</p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {listing.sellerVerified && <Shield className="w-3 h-3 text-emerald-400" />}
                  <span className={listing.sellerVerified ? "text-emerald-400" : "text-[#8A93A3]"}>
                    {listing.sellerVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className="text-[#8A93A3]">•</span>
                  <span className="flex items-center gap-0.5 text-[#FFB020]">
                    <Star size={10} className="fill-current" />
                    {typeof listing.sellerRating === "number" ? listing.sellerRating.toFixed(1) : typeof listing.sellerRating === "string" ? listing.sellerRating : "5.0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <p className="text-[11px] text-[#8A93A3] font-semibold uppercase tracking-wider mb-1">Escrow Price</p>
              <p className="text-xl font-black text-emerald-400 font-mono">₦{(listing.price || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* View Details CTA */}
          <div className="mt-3 pt-3 border-t border-[#242938]">
            <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020] font-semibold text-sm rounded-xl hover:bg-[#FFB020]/20 transition-colors group-hover:bg-[#FFB020] group-hover:text-[#0B0E14]">
              <Eye size={16} /> View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}