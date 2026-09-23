"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  FileText,
  User,
  Mail,
  Clock,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Ban,
  RefreshCw,
  AlertTriangle,
  Shield,
  Award,
  Activity,
  Eye,
  TrendingUp,
  Banknote,
  Percent,
  FileCheck,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface EscrowAuditEntry {
  id: string;
  orderId: string;
  action: string;
  amount: number;
  buyerId: string | null;
  sellerId: string | null;
  title?: string;
  reason?: string;
  resolution?: string;
  disputeResolution?: string;
  sellerPayout?: number;
  platformFee?: number;
  feePercentage?: number;
  feeTier?: string;
  originalCredentials?: string;
  returnedCredentials?: string;
  deliveryNotes?: string;
  verificationChecklist?: Record<string, unknown>;
  disputeReclamationDeadline?: Date;
  sellerVerificationDeadline?: Date;
  credentialsDeliveredAt?: Date;
  returnedCredentialsAt?: Date;
  disputedAt?: Date;
  accountSecuredAt?: Date;
  createdAt: string;
  buyerName: string | null;
  buyerEmail: string | null;
  sellerName: string | null;
  sellerEmail: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  AUTO_CANCEL_PHASE1: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  AUTO_COMPLETE_PHASE2: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  AUTO_RELEASE_PHASE1_DISPUTE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  AUTO_REFUND_PHASE2_DISPUTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SELLER_ACCOUNT_SECURED_REFUND: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  AUTO_RELEASE_PHASE1: "bg-green-500/10 text-green-400 border-green-500/20",
  AUTO_REFUND_PHASE2: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ADMIN_FORCE_RELEASE: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ADMIN_REFUND: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function getActionIcon(action: string) {
  const a = action.toUpperCase();
  if (a.includes("CANCEL") || a.includes("REFUND")) return <Ban size={14} />;
  if (a.includes("RELEASE")) return <TrendingUp size={14} />;
  if (a.includes("COMPLETE")) return <CheckCircle2 size={14} />;
  if (a.includes("SECURED")) return <Shield size={14} />;
  if (a.includes("DISPUTE")) return <AlertTripleIcon />;
  return <Activity size={14} />;
}

function AlertTripleIcon() {
  return <AlertTriangle size={14} />;
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

const ACTION_LABELS: Record<string, string> = {
  AUTO_CANCEL_PHASE1: "Automatic Cancellation",
  AUTO_COMPLETE_PHASE2: "Automatic Completion",
  AUTO_RELEASE_PHASE1_DISPUTE: "Automatic Fund Release (Dispute)",
  AUTO_REFUND_PHASE2_DISPUTE: "Automatic Refund (Dispute)",
  SELLER_ACCOUNT_SECURED_REFUND: "Seller Account Secured Refund",
  AUTO_RELEASE_PHASE1: "Automatic Fund Release",
  AUTO_REFUND_PHASE2: "Automatic Refund",
  ADMIN_FORCE_RELEASE: "Admin Force Release",
  ADMIN_REFUND: "Admin Refund",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

const REASON_MAP: Record<string, string> = {
  "Timer expired: AWAITING_CREDENTIALS > 24h":
    "The seller did not deliver credentials within the 24-hour window, so this order was automatically canceled and the buyer was refunded.",
  "Timer expired: INSPECTION_PERIOD > 24h":
    "The 24-hour inspection period expired without action, so the order was automatically completed and funds were released to the seller.",
  "Timer expired: DISPUTED > disputeReclamationDeadline (buyer failed to return credentials)":
    "The buyer did not return credentials before the dispute reclamation deadline, so funds were automatically released to the seller.",
  "Timer expired: RETURNED_CREDENTIALS > sellerVerificationDeadline (seller failed to verify)":
    "The seller did not verify the returned credentials within the required deadline, so the full amount was refunded to the buyer.",
  "Timer expired: DISPUTED > 24h (buyer failed to return credentials)":
    "The buyer did not return credentials within 24 hours of the dispute opening, so funds were automatically released to the seller.",
  "Timer expired: RETURNED_CREDENTIALS > 24h (seller failed to verify)":
    "The seller did not verify the returned credentials within 24 hours, so the full amount was refunded to the buyer.",
};

function humanizeReason(reason: string | undefined): string | undefined {
  if (!reason) return reason;
  return REASON_MAP[reason] || reason;
}

function humanizeResolution(resolution: string): string {
  const map: Record<string, string> = {
    "Released to seller": "Released to the seller",
    "Refunded to buyer": "Refunded to the buyer",
    "Released": "Released to the seller",
    "Refunded": "Refunded to the buyer",
    "Seller confirmed account secured; funds refunded to buyer":
      "The seller confirmed their account is secured, and the full amount has been refunded to the buyer.",
    "Seller confirmed account secured via verification checklist. Full refund processed.":
      "The seller confirmed account security through the verification checklist, and the full amount has been refunded to the buyer.",
  };
  return map[resolution] || resolution;
}

function humanizeChecklistLabel(key: string): string {
  const labels: Record<string, string> = {
    assetIntegrity: "Asset Integrity",
    credentialSecurity: "Credential Security",
    noUnauthorizedBinding: "No Unauthorized Binding",
  };
  return labels[key] || key;
}

function safeParseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      try {
        return obj.toDate() as Date;
      } catch {
        return null;
      }
    }
    if (typeof obj.seconds === "number") {
      try {
        return new Date(obj.seconds * 1000);
      } catch {
        return null;
      }
    }
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
    if (diffMs < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function EscrowAuditContent() {
  const router = useRouter();
  const [entries, setEntries] = useState<EscrowAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<EscrowAuditEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableActions = useMemo(() => {
    const actions = [...new Set(entries.map((e) => e.action))];
    return actions.sort();
  }, [entries]);

  const fetchEntries = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/escrow-audit", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.auditEntries || []);
      }
    } catch (err) {
      console.error("Failed to fetch escrow audit:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (actionFilter) {
      result = result.filter((e) => e.action === actionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.orderId.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          (e.reason?.toLowerCase().includes(q) ?? false) ||
          (e.title?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [entries, search, actionFilter]);

  const openDrawer = useCallback((entry: EscrowAuditEntry) => {
    setSelectedEntry(entry);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedEntry(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Escrow Audit Trail
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Read-only audit log of all escrow events and system actions.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
            <input
              type="text"
              placeholder="Search by order ID, action, or reason..."
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

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
          >
            <option value="">All Actions</option>
            {availableActions.map((action) => (
              <option key={action} value={action}>{getActionLabel(action)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Event Type</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Buyer</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Seller</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242938]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 size={28} className="animate-spin text-[#FFB020] mx-auto" />
                      <p className="text-sm text-[#8A93A3] mt-2">Loading audit trail...</p>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <FileText size={32} className="mx-auto text-[#8A93A3] mb-2" />
                      <p className="text-base font-semibold text-[#8A93A3]">No audit entries found</p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || actionFilter ? "Try different search or filter criteria" : "No audit events logged yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#0B0E14]/40 transition-colors">
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionColor(entry.action)}`}
                        >
                          {getActionIcon(entry.action)}
                          {getActionLabel(entry.action)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-[#EDEFF2]">#{entry.orderId.slice(0, 6)}</span>
                          <CopyButton text={entry.orderId} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {entry.buyerName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User size={12} className="text-[#7C5CFC] shrink-0" />
                              {entry.buyerName}
                            </div>
                            <div className="text-xs text-[#8A93A3]">{entry.buyerEmail}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {entry.buyerId ? `${entry.buyerId.slice(0, 8)}...` : "N/A"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {entry.sellerName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User size={12} className="text-[#FFB020] shrink-0" />
                              {entry.sellerName}
                            </div>
                            <div className="text-xs text-[#8A93A3]">{entry.sellerEmail}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {entry.sellerId ? `${entry.sellerId.slice(0, 8)}...` : "N/A"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono font-semibold text-[#EDEFF2]">
                          {entry.amount > 0 ? formatNaira(entry.amount) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {safeFormatTime(entry.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(entry)}
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

      {/* Detail Drawer */}
      {drawerOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-3xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                  <FileText size={18} className="text-[#7C5CFC]" />
                  Audit Entry: {getActionLabel(selectedEntry.action)}
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">#{selectedEntry.id}</div>
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
              {/* Event Summary */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Event Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Action</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionColor(selectedEntry.action)}`}
                    >
                      {getActionIcon(selectedEntry.action)}
                      {getActionLabel(selectedEntry.action)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Created At</span>
                    <div className="text-sm font-semibold text-[#EDEFF2] mt-1">
                      {safeDateFormat(selectedEntry.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Order ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-mono text-[#EDEFF2]">{selectedEntry.orderId}</span>
                      <CopyButton text={selectedEntry.orderId} />
                    </div>
                  </div>
                  {selectedEntry.title && (
                    <div>
                      <span className="text-xs text-[#8A93A3]">Order Title</span>
                      <div className="text-sm text-[#EDEFF2] mt-1 truncate">{selectedEntry.title}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Buyer
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[#7C5CFC] shrink-0" />
                      <span className="text-sm text-[#EDEFF2]">{selectedEntry.buyerName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-[#8A93A3] shrink-0" />
                      <span className="text-sm text-[#8A93A3]">{selectedEntry.buyerEmail || "N/A"}</span>
                    </div>
                    {selectedEntry.buyerId && (
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-[#8A93A3] shrink-0" />
                        <span className="text-xs text-[#8A93A3] font-mono">{selectedEntry.buyerId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Seller
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[#FFB020] shrink-0" />
                      <span className="text-sm text-[#EDEFF2]">{selectedEntry.sellerName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-[#8A93A3] shrink-0" />
                      <span className="text-sm text-[#8A93A3]">{selectedEntry.sellerEmail || "N/A"}</span>
                    </div>
                    {selectedEntry.sellerId && (
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-[#8A93A3] shrink-0" />
                        <span className="text-xs text-[#8A93A3] font-mono">{selectedEntry.sellerId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Financial Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Banknote size={18} className="text-[#FFB020] shrink-0" />
                    <div>
                      <div className="text-xs text-[#8A93A3]">Amount</div>
                      <div className="text-sm font-bold text-[#EDEFF2] font-mono">
                        {formatNaira(selectedEntry.amount)}
                      </div>
                    </div>
                  </div>
                  {selectedEntry.sellerPayout !== undefined && (
                    <div className="flex items-center gap-3">
                      <TrendingUp size={18} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Seller Payout</div>
                        <div className="text-sm font-bold text-[#EDEFF2] font-mono">
                          {formatNaira(selectedEntry.sellerPayout)}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedEntry.platformFee !== undefined && (
                    <div className="flex items-center gap-3">
                      <Percent size={18} className="text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Platform Fee</div>
                        <div className="text-sm font-bold text-[#EDEFF2] font-mono">
                          {formatNaira(selectedEntry.platformFee)}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedEntry.feePercentage !== undefined && (
                    <div className="flex items-center gap-3">
                      <Percent size={18} className="text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Fee Percentage</div>
                        <div className="text-sm font-bold text-[#EDEFF2] font-mono">
                          {selectedEntry.feePercentage}%
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedEntry.feeTier && (
                    <div className="flex items-center gap-3">
                      <Award size={18} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Fee Tier</div>
                        <div className="text-sm font-bold text-[#EDEFF2]">{selectedEntry.feeTier}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution / Reason */}
              <div className="space-y-3">
                {selectedEntry.reason && (
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-2">
                      Reason
                    </h3>
                    <p className="text-sm text-[#EDEFF2] leading-relaxed">{humanizeReason(selectedEntry.reason)}</p>
                  </div>
                )}
                {selectedEntry.resolution && (
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-2">
                      Resolution
                    </h3>
                    <p className="text-sm text-[#EDEFF2] leading-relaxed">{selectedEntry.resolution}</p>
                  </div>
                )}
                {selectedEntry.disputeResolution && (
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-2">
                      Dispute Resolution
                    </h3>
                    <p className="text-sm text-[#EDEFF2] leading-relaxed">{selectedEntry.disputeResolution}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FileCheck size={16} className="text-[#8A93A3] shrink-0" />
                    <span className="text-xs text-[#8A93A3]">Created</span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedEntry.createdAt)}
                    </span>
                  </div>
                  {selectedEntry.disputedAt && (
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Disputed At</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.disputedAt)}
                      </span>
                    </div>
                  )}
                  {selectedEntry.accountSecuredAt && (
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-emerald-400 shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Account Secured</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.accountSecuredAt)}
                      </span>
                    </div>
                  )}
                  {selectedEntry.credentialsDeliveredAt && (
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={16} className="text-[#7C5CFC] shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Credentials Delivered</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.credentialsDeliveredAt)}
                      </span>
                    </div>
                  )}
                  {selectedEntry.returnedCredentialsAt && (
                    <div className="flex items-center gap-3">
                      <RefreshCw size={16} className="text-blue-400 shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Credentials Returned</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.returnedCredentialsAt)}
                      </span>
                    </div>
                  )}
                  {selectedEntry.disputeReclamationDeadline && (
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-rose-400 shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Dispute Reclamation Deadline</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.disputeReclamationDeadline)}
                      </span>
                    </div>
                  )}
                  {selectedEntry.sellerVerificationDeadline && (
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-amber-400 shrink-0" />
                      <span className="text-xs text-[#8A93A3]">Seller Verification Deadline</span>
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        {safeDateFormat(selectedEntry.sellerVerificationDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Reference */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Case Reference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Audit Entry ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-mono text-[#EDEFF2] break-all">{selectedEntry.id}</span>
                      <CopyButton text={selectedEntry.id} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Status</span>
                    <div className="mt-1">
                      {selectedEntry.disputeResolution ? (
                        <span className="text-sm text-[#EDEFF2]">{humanizeResolution(selectedEntry.disputeResolution)}</span>
                      ) : (
                        <span className="text-sm text-[#8A93A3]">No resolution recorded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              {selectedEntry.verificationChecklist && (
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Verification Checklist
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(selectedEntry.verificationChecklist).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-[#242938]/50 last:border-0">
                        <span className="text-sm text-[#EDEFF2]">{humanizeChecklistLabel(key)}</span>
                        {value === true ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Ban size={14} className="text-rose-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {(selectedEntry.deliveryNotes || selectedEntry.originalCredentials) && (
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Additional Details
                  </h3>
                  <div className="space-y-3">
                    {selectedEntry.deliveryNotes && (
                      <div>
                        <span className="text-xs text-[#8A93A3]">Delivery Notes</span>
                        <p className="text-sm text-[#EDEFF2] mt-1 leading-relaxed">{selectedEntry.deliveryNotes}</p>
                      </div>
                    )}
                    {selectedEntry.returnedCredentials && (
                      <div>
                        <span className="text-xs text-[#8A93A3]">Returned Credentials</span>
                        <p className="text-sm text-[#8A93A3] mt-1 font-mono break-all">{selectedEntry.returnedCredentials}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminEscrowAuditPage() {
  return (
    <AdminLayout>
      <EscrowAuditContent />
    </AdminLayout>
  );
}
