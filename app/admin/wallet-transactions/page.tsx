"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_TYPE_COLORS,
  WALLET_TRANSACTION_STATUSES,
  WALLET_TRANSACTION_STATUS_COLORS,
  getStatusColor as getStatusColorEnum,
  getStatusLabel as getStatusLabelEnum,
  formatNaira,
} from "@/lib/admin-enums";
import {
  Search,
  X,
  Wallet,
  User,
  Mail,
  Clock,
  Loader2,
  Eye,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  PackageX,
  FileText,
  Banknote,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface WalletTransactionEntry {
  id: string;
  userId: string;
  orderId: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  metadata: Record<string, unknown>;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

function getTypeLabel(type: string): string {
  return WALLET_TRANSACTION_TYPES[type] || type;
}

function getTypeIcon(type: string) {
  const t = type.toUpperCase();
  if (t === "WITHDRAWAL_FAILED") return <AlertTriangle size={14} />;
  if (t === "WITHDRAWAL_COMPLETED") return <CheckCircle2 size={14} />;
  if (t === "WITHDRAWAL_INITIATED") return <ArrowUpRight size={14} />;
  if (t === "ESCROW_CANCELLED") return <PackageX size={14} />;
  if (t === "ESCROW_LOCK") return <ArrowDownLeft size={14} />;
  if (t === "ESCROW_RELEASE") return <ArrowUpRight size={14} />;
  if (t === "LISTING_SALE") return <ArrowDownLeft size={14} />;
  if (t === "PLATFORM_FEE") return <AlertTriangle size={14} />;
  if (t === "REFUND") return <ArrowDownLeft size={14} />;
  if (t === "CREDIT") return <ArrowDownLeft size={14} />;
  return <Wallet size={14} />;
}

const DEBIT_TYPES = [
  "WITHDRAWAL_INITIATED",
  "WITHDRAWAL_COMPLETED",
  "PLATFORM_FEE",
];

const NETURAL_TYPES = ["ESCROW_CANCELLED"];

function isDebit(type: string): boolean {
  return DEBIT_TYPES.includes(type);
}

function isNeutral(type: string): boolean {
  return NETURAL_TYPES.includes(type);
}

type AmountDisplay = {
  display: string;
  isCredit: boolean;
  isDebit: boolean;
  isNeutral: boolean;
};

function getAmountDisplay(tx: WalletTransactionEntry): AmountDisplay {
  const debit = isDebit(tx.type);
  const neutral = isNeutral(tx.type);
  const amount =
    neutral && tx.metadata?.escrowAmount
      ? Number(tx.metadata.escrowAmount)
      : tx.amount;
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: tx.currency || "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

  if (neutral) {
    return {
      display: formatted,
      isCredit: false,
      isDebit: false,
      isNeutral: true,
    };
  }
  if (debit) {
    return {
      display: `-${formatted}`,
      isCredit: false,
      isDebit: true,
      isNeutral: false,
    };
  }
  return {
    display: `+${formatted}`,
    isCredit: true,
    isDebit: false,
    isNeutral: false,
  };
}

function getAmountColor(tx: WalletTransactionEntry): string {
  const debit = isDebit(tx.type);
  const neutral = isNeutral(tx.type);
  if (neutral) return "text-slate-400";
  if (debit) return "text-rose-400";
  return "text-emerald-400";
}

function getStatusColor(status: string): string {
  return getStatusColorEnum(status, WALLET_TRANSACTION_STATUS_COLORS);
}

function getStatusLabel(status: string): string {
  return getStatusLabelEnum(status, WALLET_TRANSACTION_STATUSES);
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return <CheckCircle2 size={12} />;
  if (s === "failed") return <Ban size={12} />;
  return <Clock size={12} />;
}

const TYPE_COLORS = WALLET_TRANSACTION_TYPE_COLORS;

function getTypeColor(type: string): string {
  return getStatusColorEnum(type, TYPE_COLORS);
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
    if (diffMs < 60 * 60 * 1000)
      return `${Math.floor(diffMs / (60 * 1000))}m ago`;
    if (diffMs < 24 * 60 * 60 * 1000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function WalletTransactionsContent() {
  const [transactions, setTransactions] = useState<WalletTransactionEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTx, setSelectedTx] = useState<WalletTransactionEntry | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const availableTypes = useMemo(() => {
    const types = [...new Set(transactions.map((t) => t.type))];
    return types.sort();
  }, [transactions]);

  const fetchTransactions = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/wallet-transactions", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch wallet transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [transactions, search, typeFilter, statusFilter]);

  const openDrawer = useCallback((tx: WalletTransactionEntry) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedTx(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Wallet Transactions
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Financial ledger of all wallet transactions across the platform.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredTransactions.length} transaction
            {filteredTransactions.length === 1 ? "" : "s"}
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
              placeholder="Search by reference, description, or user name/email..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {getTypeLabel(t)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Date
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
                        Loading transactions...
                      </p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Wallet
                        size={32}
                        className="mx-auto text-[#8A93A3] mb-2"
                      />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No transactions found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || typeFilter || statusFilter
                          ? "Try different search or filter criteria"
                          : "No wallet transactions have been recorded yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const amountInfo = getAmountDisplay(tx);
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#0B0E14]/40 transition-colors"
                      >
                        {/* Reference */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-[#FFB020] shrink-0">
                              {getTypeIcon(tx.type)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                                {getTypeLabel(tx.type) || "Unknown"}
                              </div>
                              <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                                #{tx.id.slice(0, 8)}
                                <CopyButton text={tx.id} />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
                              tx.type
                            )}`}
                          >
                            {getTypeIcon(tx.type)}
                            {getTypeLabel(tx.type)}
                          </span>
                        </td>

                        {/* User */}
                        <td className="px-4 py-4">
                          {tx.userName ? (
                            <div>
                              <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                                <User
                                  size={12}
                                  className="text-[#7C5CFC] shrink-0"
                                />
                                {tx.userName}
                              </div>
                              {tx.userEmail && (
                                <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                  <Mail size={10} className="shrink-0" />
                                  {tx.userEmail}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-[#8A93A3] font-mono">
                              {tx.userId
                                ? `${tx.userId.slice(0, 8)}...`
                                : "N/A"}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4">
                          <span
                            className={`text-sm font-mono font-semibold ${getAmountColor(
                              tx
                            )}`}
                          >
                            {amountInfo.display}
                          </span>
                          {tx.orderId && (
                            <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                              Order: #{tx.orderId.slice(0, 6)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                              tx.status
                            )}`}
                          >
                            {getStatusIcon(tx.status)}
                            {getStatusLabel(tx.status)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                            <Clock size={12} />
                            {safeFormatTime(tx.createdAt)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openDrawer(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20 hover:bg-[#7C5CFC]/20 transition"
                          >
                            <Eye size={14} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspection Drawer */}
      {drawerOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-3xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                  <Wallet size={18} className="text-[#FFB020]" />
                  <span className="truncate">
                    {getTypeLabel(selectedTx.type)}
                  </span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  Transaction #{selectedTx.id}
                  <CopyButton text={selectedTx.id} />
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
              {/* Transaction Summary */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Transaction Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Type</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
                        selectedTx.type
                      )}`}
                    >
                      {getTypeIcon(selectedTx.type)}
                      {getTypeLabel(selectedTx.type)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Status</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                        selectedTx.status
                      )}`}
                    >
                      {getStatusIcon(selectedTx.status)}
                      {getStatusLabel(selectedTx.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Amount</span>
                    <div
                      className={`text-lg font-bold font-mono mt-1 ${getAmountColor(
                        selectedTx
                      )}`}
                    >
                      {getAmountDisplay(selectedTx).display}
                    </div>
                    <div className="text-xs text-[#8A93A3]">
                      Currency: {selectedTx.currency || "NGN"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Reference ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-mono text-[#EDEFF2]">
                        #{selectedTx.id}
                      </span>
                      <CopyButton text={selectedTx.id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Financial Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">
                      Balance Before
                    </span>
                    <div className="text-sm font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(selectedTx.balanceBefore)}
                    </div>
                  </div>
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">
                      Balance After
                    </span>
                    <div className="text-sm font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(selectedTx.balanceAfter)}
                    </div>
                  </div>
                  <div className="bg-[#0B0E14]/50 rounded-lg p-3 border border-[#242938]">
                    <span className="text-xs text-[#8A93A3]">
                      Net Change
                    </span>
                    <div
                      className={`text-sm font-bold font-mono mt-1 ${getAmountColor(
                        selectedTx
                      )}`}
                    >
                      {getAmountDisplay(selectedTx).display}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Description
                </h3>
                <p className="text-sm text-[#EDEFF2] leading-relaxed">
                  {selectedTx.description || "No description provided."}
                </p>
              </div>

              {/* User Information */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Target User
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User
                      size={16}
                      className="text-[#7C5CFC] shrink-0"
                    />
                    <div>
                      <span className="text-xs text-[#8A93A3]">Name</span>
                      <div className="text-sm font-semibold text-[#EDEFF2]">
                        {selectedTx.userName || "N/A"}
                      </div>
                    </div>
                  </div>
                  {selectedTx.userEmail && (
                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="text-[#8A93A3] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">Email</span>
                        <div className="text-sm text-[#8A93A3]">
                          {selectedTx.userEmail}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 md:col-span-2">
                    <FileText
                      size={16}
                      className="text-[#8A93A3] shrink-0"
                    />
                    <div>
                      <span className="text-xs text-[#8A93A3]">User ID</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-[#EDEFF2] font-mono break-all">
                          {selectedTx.userId}
                        </span>
                        <CopyButton text={selectedTx.userId} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Order */}
              {selectedTx.orderId && (
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Related Order
                  </h3>
                  <div className="flex items-center gap-3">
                    <Banknote
                      size={16}
                      className="text-[#FFB020] shrink-0"
                    />
                    <div>
                      <span className="text-xs text-[#8A93A3]">Order ID</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-mono text-[#EDEFF2]">
                          #{selectedTx.orderId}
                        </span>
                        <CopyButton text={selectedTx.orderId} />
                        <a
                          href={`/orders/${selectedTx.orderId}`}
                          className="text-[#7C5CFC] hover:text-[#8A93A3] transition"
                          title="View order"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedTx.metadata &&
                Object.keys(selectedTx.metadata).length > 0 && (
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Metadata
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(selectedTx.metadata).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-1 border-b border-[#242938]/50 last:border-0"
                          >
                            <span className="text-xs text-[#8A93A3] font-mono">
                              {key}
                            </span>
                            <span className="text-xs text-[#EDEFF2] font-mono text-right max-w-[60%]">
                              {typeof value === "object" && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Timeline */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#8A93A3] shrink-0" />
                    <span className="text-xs text-[#8A93A3]">
                      Transaction Created
                    </span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedTx.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminWalletTransactionsPage() {
  return (
    <AdminLayout>
      <WalletTransactionsContent />
    </AdminLayout>
  );
}
