"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Search,
  X,
  Package,
  User,
  Mail,
  Clock,
  Loader2,
  Eye,
  Copy,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Shield,
  Sparkles,
  Star,
  Globe,
  Smartphone,
  Trophy,
  Gamepad2,
  Award,
  Gem,
  Sword,
  TrendingUp,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface ListingEntry {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  price: number;
  calculatedFee?: number;
  netPayout?: number;
  feePercentage?: number;
  listingPlan?: string;
  accountType: string;
  loginMethod?: string;
  description: string;
  featuredSkins?: string[];
  isFeatured: boolean;
  hasShieldProtection: boolean;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating?: number;
  status: string;
  views?: number;
  images?: string[];
  rank?: string;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  createdAt: string;
  updatedAt?: string;
  sellerNameResolved: string | null;
  sellerEmail: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sold: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Sold: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspended: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Suspended: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function getStatusColor(status: string): string {
  const key = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return STATUS_COLORS[key] || STATUS_COLORS[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return <CheckCircle2 size={14} />;
  if (s === "sold") return <Package size={14} />;
  if (s.includes("suspend")) return <Ban size={14} />;
  if (s.includes("pending")) return <AlertTriangle size={14} />;
  return <Package size={14} />;
}

function formatNaira(amount: number) {
  if (!amount || amount <= 0) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number | undefined) {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function safeParseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function safeDateFormat(value: unknown): string {
  const d = safeParseDate(value);
  if (!d) return "N/A";
  try {
    return d.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function safeFormatTime(value: unknown): string {
  const d = safeParseDate(value);
  if (!d) return "";
  try {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "Just now";
    if (diffMs < 60 * 1000) return "Just now";
    if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}m ago`;
    if (diffMs < 24 * 60 * 60 * 1000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const AVAILABLE_STATUSES = ["Active", "Sold", "Suspended", "Pending"];

function ListingsContent() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [selectedListing, setSelectedListing] = useState<ListingEntry | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableGames = useMemo(() => {
    const games = [...new Set(listings.map((l) => l.gameName))];
    return games.sort();
  }, [listings]);

  const fetchListings = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/listings", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    let result = listings;
    if (statusFilter) {
      result = result.filter((l) =>
        l.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (gameFilter) {
      result = result.filter((l) =>
        l.gameName.toLowerCase().includes(gameFilter.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          (l.sellerName && l.sellerName.toLowerCase().includes(q)) ||
          (l.sellerEmail && l.sellerEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [listings, search, statusFilter, gameFilter]);

  const openDrawer = useCallback((listing: ListingEntry) => {
    setSelectedListing(listing);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedListing(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Listings
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Manage and moderate all marketplace listings.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredListings.length} listing{filteredListings.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A93A3]"
            />
            <input
              type="text"
              placeholder="Search by title, order ID, or seller name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A93A3] hover:text-[#EDEFF2] transition"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Statuses</option>
              {AVAILABLE_STATUSES.map((s) => (
                <option key={s} value={s.toLowerCase()}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Games</option>
              {availableGames.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Listing
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Game / Category
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242938]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2
                        size={28}
                        className="animate-spin text-[#FFB020] mx-auto"
                      />
                      <p className="text-sm text-[#8A93A3] mt-2">
                        Loading listings...
                      </p>
                    </td>
                  </tr>
                ) : filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Package size={32} className="mx-auto text-[#8A93A3] mb-2" />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No listings found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || statusFilter || gameFilter
                          ? "Try different search or filter criteria"
                          : "No listings in the system yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-[#0B0E14]/40 transition-colors"
                    >
                      {/* Listing Title */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-10 h-10 rounded-lg object-cover border border-[#242938]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMxNTExMjIiLz48cGF0aCBkPSJNNCA0SDBGMEw0IDRIOEwxMiAxM0wxOCA0SDIyTDIwIDIwSDEyIDIwTDIgMjBMMiA0WiIvPjwvc3ZnPg==";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-[#8A93A3]">
                              <Gamepad2 size={16} />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              {listing.isFeatured && (
                                <Sparkles
                                  size={12}
                                  className="text-amber-400 shrink-0"
                                />
                              )}
                              {listing.title || "Untitled"}
                            </div>
                            <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                              #{listing.id.slice(0, 6)}
                              <CopyButton text={listing.id} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Game / Category */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#8A93A3]">
                            {listing.gameName || "—"}
                          </span>
                          {listing.hasShieldProtection && (
                            <Shield
                              size={12}
                              className="text-[#FFB020] shrink-0"
                            />
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono font-semibold text-[#EDEFF2]">
                          {formatNaira(listing.price)}
                        </span>
                        {listing.calculatedFee !== undefined && (
                          <div className="text-xs text-[#8A93A3]">
                            Fee: {formatNaira(listing.calculatedFee)}
                          </div>
                        )}
                      </td>

                      {/* Seller */}
                      <td className="px-4 py-4">
                        {listing.sellerName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User
                                size={12}
                                className={
                                  listing.sellerVerified
                                    ? "text-[#7C5CFC] shrink-0"
                                    : "text-[#8A93A3] shrink-0"
                                }
                              />
                              {listing.sellerNameResolved ||
                                listing.sellerName}
                            </div>
                            {listing.sellerEmail && (
                              <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                <Mail size={10} className="shrink-0" />
                                {listing.sellerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {listing.sellerId
                              ? `${listing.sellerId.slice(0, 8)}...`
                              : "N/A"}
                          </span>
                        )}
                        {listing.sellerRating !== undefined && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star
                              size={10}
                              className="text-amber-400 fill-current shrink-0"
                            />
                            <span className="text-xs text-[#8A93A3]">
                          {listing.sellerRating}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                            listing.status
                          )}`}
                        >
                          {getStatusIcon(listing.status)}
                          {listing.status}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {safeFormatTime(listing.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(listing)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20 hover:bg-[#7C5CFC]/20 transition"
                        >
                          <Eye size={14} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspection Drawer */}
      {drawerOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-4xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                  <Package size={18} className="text-[#FFB020]" />
                  <span className="truncate">{selectedListing.title}</span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  #{selectedListing.id}
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-lg text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2] transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Quick Actions */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusColor(
                    selectedListing.status
                  )}`}
                >
                  {getStatusIcon(selectedListing.status)}
                  Status: {selectedListing.status}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                    title="Suspend this listing"
                  >
                    <Ban size={14} /> Suspend
                  </button>
                </div>
              </div>

              {/* Listing Images */}
              {selectedListing.images &&
              selectedListing.images.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">
                    Listing Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedListing.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${selectedListing.title} - image ${idx + 1}`}
                        className="w-full h-32 rounded-xl object-cover border border-[#242938]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JvedCIIjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzE1MTEyMiIvPjxjaXJjbGUgY3g9IjEyIIGN5PSIxMiIgcj0iMyIgc3Ryb2tlPSIjOEE5M0EzIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdXR5PSIwLjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-xl bg-[#0B0E14] border border-[#242938]">
                  <Gamepad2 size={32} className="text-[#8A93A3]" />
                </div>
              )}

              {/* Game Info */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Game & Account
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Game</span>
                    <div className="text-sm font-semibold text-[#EDEFF2] mt-1">
                      {selectedListing.gameName || "Unknown Game"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Account Type</span>
                    <div className="text-sm text-[#EDEFF2] mt-1">
                      {selectedListing.accountType || "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Login Method</span>
                    <div className="text-sm text-[#8A93A3] mt-1">
                      {selectedListing.loginMethod || "—"}
                    </div>
                  </div>
                  {selectedListing.hasShieldProtection && (
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-[#FFB020] shrink-0" />
                      <span className="text-sm text-[#EDEFF2]">
                        AssetXtack Shield Protected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Pricing Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">Listing Price</span>
                    <div className="text-lg font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(selectedListing.price)}
                    </div>
                  </div>
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">Platform Fee</span>
                    <div className="text-lg font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(selectedListing.calculatedFee || 0)}
                    </div>
                    {selectedListing.feePercentage !== undefined && (
                      <div className="text-xs text-[#8A93A3]">
                        {selectedListing.feePercentage}%
                      </div>
                    )}
                  </div>
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">Seller Payout</span>
                    <div className="text-lg font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(
                        selectedListing.netPayout ||
                          (selectedListing.price -
                            (selectedListing.calculatedFee || 0))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Seller Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[#7C5CFC] shrink-0" />
                    <div>
                      <span className="text-xs text-[#8A93A3]">Name</span>
                      <div className="text-sm font-semibold text-[#EDEFF2]">
                        {selectedListing.sellerNameResolved ||
                          selectedListing.sellerName}
                      </div>
                    </div>
                  </div>
                  {selectedListing.sellerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#8A93A3] shrink-0" />
                      <div>
                        <span className="text-xs text-[#8A93A3]">Email</span>
                        <div className="text-sm text-[#8A93A3]">
                          {selectedListing.sellerEmail}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-[#8A93A3] shrink-0" />
                    <div>
                      <span className="text-xs text-[#8A93A3]">Seller ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#EDEFF2] font-mono break-all">
                          {selectedListing.sellerId}
                        </span>
                        <CopyButton text={selectedListing.sellerId} />
                      </div>
                    </div>
                  </div>
                  {selectedListing.sellerRating !== undefined && (
                    <div className="flex items-center gap-3">
                      <Star size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Seller Rating
                        </span>
                        <div className="text-sm font-semibold text-[#EDEFF2]">
                          {selectedListing.sellerRating}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Attributes */}
              {(selectedListing.rank ||
                selectedListing.skinsCount !== undefined ||
                selectedListing.heroesCount !== undefined ||
                selectedListing.winRate) && (
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Account Attributes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedListing.rank && (
                      <div className="flex items-center gap-3">
                        <Trophy
                          size={16}
                          className="text-amber-400 shrink-0"
                        />
                        <div>
                          <span className="text-xs text-[#8A93A3]">Rank</span>
                          <div className="text-sm text-[#EDEFF2] mt-1">
                            {selectedListing.rank}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedListing.skinsCount !== undefined && (
                      <div className="flex items-center gap-3">
                        <Gem size={16} className="text-blue-400 shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Skins
                          </span>
                          <div className="text-sm text-[#EDEFF2] mt-1">
                            {formatNumber(selectedListing.skinsCount)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedListing.heroesCount !== undefined && (
                      <div className="flex items-center gap-3">
                        <Sword size={16} className="text-purple-400 shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Heroes
                          </span>
                          <div className="text-sm text-[#EDEFF2] mt-1">
                            {formatNumber(selectedListing.heroesCount)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedListing.winRate && (
                      <div className="flex items-center gap-3">
                        <TrendingUp size={16} className="text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Win Rate
                          </span>
                          <div className="text-sm text-[#EDEFF2] mt-1">
                            {selectedListing.winRate}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Featured Skins */}
              {selectedListing.featuredSkins &&
                selectedListing.featuredSkins.length > 0 && (
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Featured Skins
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.featuredSkins.map((skin, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242938]/30 text-xs text-[#EDEFF2] border border-[#242938]"
                        >
                          <Sparkles size={10} className="text-amber-400" />
                          {skin}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Description */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Description
                </h3>
                <p className="text-sm text-[#EDEFF2] leading-relaxed whitespace-pre-wrap">
                  {selectedListing.description || "No description provided."}
                </p>
              </div>

              {/* Timeline */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FileCheck
                      size={16}
                      className="text-[#8A93A3] shrink-0"
                    />
                    <span className="text-xs text-[#8A93A3]">
                      Created
                    </span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedListing.createdAt)}
                    </span>
                  </div>
                  {selectedListing.updatedAt && (
                    <div className="flex items-center gap-3">
                      <RefreshCw
                        size={16}
                        className="text-[#8A93A3] shrink-0"
                      />
                      <span className="text-xs text-[#8A93A3]">
                        Last Updated
                      </span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedListing.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminListingsPage() {
  return (
    <AdminLayout>
      <ListingsContent />
    </AdminLayout>
  );
}
