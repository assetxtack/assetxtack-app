"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Shield, Trophy, Gem, Sword, Globe, Smartphone, Eye, Gamepad2 } from "lucide-react";
import { getGameConfig } from "@/lib/config/gameConfigs";

const universalAttributeKeys = ["rank", "loginProvider", "accountType"];

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
  sellerId?: string;
  sellerVerified?: boolean;
}

const formatNumber = (num: number | undefined): string => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
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

const getListingStats = (listing: ListingData): StatItem[] => {
  const attrs = listing.gameAttributes || {};
  const config = getGameConfig(listing.gameId);
  const stats: StatItem[] = [];

  const rankVal = attrs.rank ?? listing.rank;
  if (rankVal) {
    const label = config?.attributes.find((a) => a.key === "rank")?.label ?? "Rank";
    stats.push({ label, value: getStringValue(rankVal), icon: <Trophy className="w-3.5 h-3.5" /> });
  }

  if (config) {
    for (const attr of config.attributes) {
      if (universalAttributeKeys.includes(attr.key)) continue;
      const val = attrs[attr.key];
      if (val !== undefined && val !== null && val !== "") {
        if (attr.type === "number") {
          stats.push({ label: attr.label, value: formatNumber(getNumberValue(val)), icon: <Gem className="w-3.5 h-3.5" /> });
        } else {
          stats.push({ label: attr.label, value: getStringValue(val), icon: <Sword className="w-3.5 h-3.5" /> });
        }
      }
    }
  }

  return stats;
};

export default function MarketplaceListingCard({ listing }: { listing: ListingData }) {
  const stats = getListingStats(listing);
  const images = Array.isArray(listing.images) ? listing.images : [];
  const hasImage = images.length > 0;
  const imageUrl = hasImage ? images[0] : null;
  const serverRegion = listing.gameAttributes?.serverRegion ?? listing.gameAttributes?.region;
  const deviceType = listing.gameAttributes?.deviceType;

  return (
    <article
      className={`group relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
        listing.isFeatured
          ? "bg-slate-900/40 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
          : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Whole card link overlay */}
      <Link href={`/marketplace/${listing.id}`} className="absolute inset-0 z-0" aria-label="View listing details" />

      {/* Featured Banner */}
      {listing.isFeatured && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-black px-3 py-1 uppercase tracking-tighter rounded-bl-lg shadow-lg">
            Featured
          </div>
        </div>
      )}

      {/* Top Section: Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[#0B0E14]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title || "Listing"}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Gamepad2 size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        
        {/* Dynamic Game Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-[10px] font-bold text-white uppercase tracking-wider shadow-xl">
          <span className="text-amber-500"><Sword className="w-4 h-4" /></span>
          {listing.gameName || "Unknown Game"}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 relative z-10">
        {/* Full Listing Title — zero truncation, natural wrapping */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-3 group-hover:text-amber-400 transition-colors whitespace-normal break-words overflow-visible">
          {listing.title || "Untitled Account"}
        </h3>

        {/* Server/Region & Device Type Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {serverRegion && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700 text-[10px] font-semibold text-slate-300 uppercase tracking-wider overflow-visible">
              <Globe className="w-3 h-3" />
              <span className="whitespace-normal break-words">{getStringValue(serverRegion)}</span>
            </span>
          )}
          {deviceType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700 text-[10px] font-semibold text-slate-300 uppercase tracking-wider overflow-visible">
              <Smartphone className="w-3 h-3" />
              <span className="whitespace-normal break-words">{getStringValue(deviceType)}</span>
            </span>
          )}
        </div>

        {/* Seller Info (Clickable) */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${listing.sellerId || ""}`} className="shrink-0 group/seller transition-transform duration-300 hover:scale-105">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shadow-inner group-hover/seller:border-amber-500/50 group-hover/seller:text-white">
              {listing.sellerName?.[0]?.toUpperCase() || "S"}
            </div>
          </Link>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/profile/${listing.sellerId || ""}`}
              className="text-xs font-extrabold text-slate-200 hover:text-amber-400 transition-colors leading-tight overflow-visible"
            >
              {listing.sellerName || "Unknown Seller"}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {listing.sellerVerified && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
                  <Shield className="w-2.5 h-2.5" />
                  Verified
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500/80">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{typeof listing.sellerRating === "number" ? listing.sellerRating.toFixed(1) : (listing.sellerRating || "5.0")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Metadata Grid — universal stats, zero truncation */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          {stats.length > 0 ? (
            stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-800/30 border border-slate-700 transition-colors group-hover:border-slate-600">
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {stat.icon && <span className="text-amber-500/60">{stat.icon}</span>}
                  <span className="whitespace-normal leading-tight">{stat.label}</span>
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-white break-words overflow-visible">
                  {stat.value}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-3 text-center rounded-xl bg-slate-800/30 border border-slate-700 text-[10px] text-slate-400 italic uppercase tracking-widest">
              Standard Account Assets
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-4 sm:p-5 pt-0 pb-6 mt-auto relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-0.5">Escrow Price</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none tracking-tighter">
            ₦{(listing.price || 0).toLocaleString()}
          </span>
        </div>
        
        <Link 
          href={`/marketplace/${listing.id}`}
          className="flex-1"
        >
          <button className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-2">
            <Eye size={18} strokeWidth={3} />
            <span>View &amp; Buy</span>
          </button>
        </Link>
      </div>

      {/* Premium Glow Effect (Featured Only) */}
      {listing.isFeatured && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_25px_rgba(251,191,36,0.8)]" />
      )}
    </article>
  );
}