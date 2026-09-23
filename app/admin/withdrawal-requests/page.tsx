"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  WITHDRAWAL_STATUS_COLORS,
  WITHDRAWAL_STATUS_LABELS,
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
  Ban,
  Shield,
  Banknote,
  CreditCard,
  FileText,
  ExternalLink,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface WithdrawalRequestEntry {
  id: string;
  userId: string;
  sellerId: string;
  amount: number;
  bankAccount: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  } | null;
  status: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
}

function getStatusColor(status: string): string {
  return getStatusColorEnum(status, WITHDRAWAL_STATUS_COLORS);
}

function getStatusLabel(status: string): string {
  return getStatusLabelEnum(status, WITHDRAWAL_STATUS_LABELS);
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "approved") return <CheckCircle2 size={12} />;
  if (s === "rejected") return <Ban size={12} />;
  if (s === "processing") return <RefreshCw size={12} />;
  return <Clock size={12} />;
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

function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return "N/A";
  return `****${accountNumber.slice(-4)}`;
}

function WithdrawalRequestsContent() {
  const [requests, setRequests] = useState<WithdrawalRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequestEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/withdrawal-requests", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.withdrawalRequests || []);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawal requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    let result = requests;
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          (r.userName && r.userName.toLowerCase().includes(q)) ||
          (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
          (r.sellerId && r.sellerId.toLowerCase().includes(q))
      );
    }
    return result;
  }, [requests, search, statusFilter]);

  const openDrawer = useCallback((req: WithdrawalRequestEntry) => {
    setSelectedRequest(req);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleStatusUpdate = useCallback(
    async (requestId: string, newStatus: string, adminNote?: string) => {
      try {
        setActionLoading(requestId);
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch(`/api/admin/withdrawal-requests`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            status: newStatus,
            adminNote,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRequests((prev) =>
            prev.map((r) =>
              r.id === requestId
                ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
                : r
            )
          );
          if (selectedRequest && selectedRequest.id === requestId) {
            setSelectedRequest((prev) =>
              prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev
            );
          }
          if (data.auditLogged) {
            console.log(`Withdrawal ${requestId} status changed to ${newStatus} (audit logged)`);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("Failed to update withdrawal status:", errorData.error || res.statusText);
        }
      } catch (err) {
        console.error("Failed to update withdrawal status:", err);
      } finally {
        setActionLoading(null);
      }
    },
    [selectedRequest]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Withdrawal Requests
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Manage and moderate all payout requests across the platform.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredRequests.length} request
            {filteredRequests.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A93A3]"
            />
            <input
              type="text"
              placeholder="Search by reference ID, seller name, or email..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Bank Account
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
                        Loading withdrawal requests...
                      </p>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Banknote
                        size={32}
                        className="mx-auto text-[#8A93A3] mb-2"
                      />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No requests found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || statusFilter
                          ? "Try different search or filter criteria"
                          : "No withdrawal requests have been submitted yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#0B0E14]/40 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-[#FFB020] shrink-0">
                            <Wallet size={14} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              Withdrawal Request
                            </div>
                            <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                              #{req.id.slice(0, 8)}
                              <CopyButton text={req.id} />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {req.userName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User
                                size={12}
                                className="text-[#7C5CFC] shrink-0"
                              />
                              {req.userName}
                            </div>
                            {req.userEmail && (
                              <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                <Mail size={10} className="shrink-0" />
                                {req.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {req.userId
                              ? `${req.userId.slice(0, 8)}...`
                              : "N/A"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm font-mono font-semibold text-[#EDEFF2]">
                          {formatNaira(req.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {req.bankAccount ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2]">
                              {req.bankAccount.bankName || "Unknown Bank"}
                            </div>
                            <div className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                              <CreditCard size={10} className="shrink-0" />
                              {maskAccountNumber(
                                req.bankAccount.accountNumber || ""
                              )}
                              {req.bankAccount.accountName && (
                                <span className="text-[#8A93A3]">
                                  ({req.bankAccount.accountName})
                                </span>
                              )}
                              <CopyButton
                                text={req.bankAccount.accountNumber || ""}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3]">N/A</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                            req.status
                          )}`}
                        >
                          {getStatusIcon(req.status)}
                          {getStatusLabel(req.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {safeFormatTime(req.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(req)}
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

      {drawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-3xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                  <Wallet size={18} className="text-[#FFB020]" />
                  <span className="truncate">Withdrawal Request</span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  #{selectedRequest.id}
                  <CopyButton text={selectedRequest.id} />
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
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Request Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Status</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {getStatusIcon(selectedRequest.status)}
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Amount</span>
                    <div className="text-2xl font-bold text-[#EDEFF2] font-mono mt-1">
                      {formatNaira(selectedRequest.amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Reference ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-[#EDEFF2] font-mono break-all">
                        #{selectedRequest.id}
                      </span>
                      <CopyButton text={selectedRequest.id} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Created At</span>
                    <div className="text-sm text-[#EDEFF2] font-mono mt-1">
                      {safeDateFormat(selectedRequest.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Bank Account Details
                </h3>
                {selectedRequest.bankAccount ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CreditCard
                        size={16}
                        className="text-[#7C5CFC] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">Bank</span>
                        <div className="text-sm font-semibold text-[#EDEFF2]">
                          {selectedRequest.bankAccount.bankName || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield
                        size={16}
                        className="text-[#FFB020] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Account Number
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-mono text-[#EDEFF2]">
                            {maskAccountNumber(
                              selectedRequest.bankAccount.accountNumber || ""
                            )}
                          </span>
                          <CopyButton
                            text={selectedRequest.bankAccount.accountNumber || ""}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2">
                      <User
                        size={16}
                        className="text-[#8A93A3] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Account Name
                        </span>
                        <div className="text-sm text-[#EDEFF2] mt-1">
                          {selectedRequest.bankAccount.accountName || "N/A"}
                        </div>
                      </div>
                    </div>
                    {selectedRequest.reason && (
                      <div className="md:col-span-2">
                        <span className="text-xs text-[#8A93A3]">Reason</span>
                        <p className="text-sm text-[#EDEFF2] mt-1 leading-relaxed">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#8A93A3]">
                    No bank account information available.
                  </p>
                )}
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Seller Information
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
                        {selectedRequest.userName || "N/A"}
                      </div>
                    </div>
                  </div>
                  {selectedRequest.userEmail && (
                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="text-[#8A93A3] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">Email</span>
                        <div className="text-sm text-[#8A93A3]">
                          {selectedRequest.userEmail}
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
                          {selectedRequest.userId}
                        </span>
                        <CopyButton text={selectedRequest.userId} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#8A93A3] shrink-0" />
                    <span className="text-xs text-[#8A93A3]">
                      Request Created
                    </span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedRequest.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#8A93A3] shrink-0" />
                    <span className="text-xs text-[#8A93A3]">Last Updated</span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedRequest.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Payout Actions
                </h3>
                <p className="text-xs text-[#8A93A3] mb-4">
                  Update the withdrawal request status below. This action is
                  irreversible.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "processing")
                    }
                    disabled={
                      actionLoading === selectedRequest.id ||
                      selectedRequest.status === "processing" ||
                      selectedRequest.status === "approved"
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} />{" "}
                    {actionLoading === selectedRequest.id
                      ? "Processing..."
                      : "Send to Processing"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "approved")
                    }
                    disabled={
                      actionLoading === selectedRequest.id ||
                      selectedRequest.status === "approved" ||
                      selectedRequest.status === "rejected"
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} />{" "}
                    {actionLoading === selectedRequest.id
                      ? "Approving..."
                      : "Approve Payout"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "rejected")
                    }
                    disabled={
                      actionLoading === selectedRequest.id ||
                      selectedRequest.status === "rejected"
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban size={16} />{" "}
                    {actionLoading === selectedRequest.id
                      ? "Rejecting..."
                      : "Reject Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminWithdrawalRequestsPage() {
  return (
    <AdminLayout>
      <WithdrawalRequestsContent />
    </AdminLayout>
  );
}
