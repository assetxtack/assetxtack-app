"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  SUPPORT_TICKET_STATUS_COLORS,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_PRIORITY_COLORS,
  SUPPORT_TICKET_PRIORITY_LABELS,
  getStatusColor as getStatusColorEnum,
  getStatusLabel as getStatusLabelEnum,
} from "@/lib/admin-enums";
import {
  Search,
  X,
  Ticket,
  User,
  Mail,
  Clock,
  Loader2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Ban,
  Shield,
  ShieldAlert,
  Sparkles,
  MessageCircle,
  Send,
  Save,
  FileText,
  Calendar,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface AppealEntry {
  id: string;
  userId: string;
  orderId?: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  proofUrls: string[];
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  isAppeal: boolean;
  banCategory?: string | null;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedBy?: string | null;
  bannedUserEmail?: string | null;
  bannedUserName?: string | null;
  originalBanUid?: string | null;
}

interface AppealMessageEntry {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

const AVAILABLE_STATUSES = Object.keys(SUPPORT_TICKET_STATUS_LABELS);

function getPriorityColor(priority: string): string {
  return getStatusColorEnum(priority, SUPPORT_TICKET_PRIORITY_COLORS);
}

function getStatusColor(status: string): string {
  return getStatusColorEnum(status, SUPPORT_TICKET_STATUS_COLORS);
}

function getStatusLabel(status: string): string {
  return getStatusLabelEnum(status, SUPPORT_TICKET_STATUS_LABELS);
}

function getPriorityLabel(priority: string): string {
  return getStatusLabelEnum(priority, SUPPORT_TICKET_PRIORITY_LABELS);
}

function getBanCategoryColor(category?: string) {
  if (!category) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  switch (category) {
    case "Fraud / Scam Attempt":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "Fake Listing Credentials":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Terms of Service Violation":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Abusive Dispute Behavior":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
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

function SafeFormatTime(value: unknown): string {
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

function AppealsContent() {
  const [appeals, setAppeals] = useState<AppealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedAppeal, setSelectedAppeal] =
    useState<AppealEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<AppealMessageEntry[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  const availableStatusValues = useMemo(() => {
    const statuses = [...new Set(appeals.map((t) => t.status))];
    return statuses.sort();
  }, [appeals]);

  const availablePriorityValues = useMemo(() => {
    const priorities = [...new Set(appeals.map((t) => t.priority))];
    return priorities.sort();
  }, [appeals]);

  const availableCategoryValues = useMemo(() => {
    const cats = [...new Set(appeals.map((t) => t.banCategory).filter(Boolean))];
    return cats as string[];
  }, [appeals]);

  const BAN_CATEGORIES = [
    "Fraud / Scam Attempt",
    "Fake Listing Credentials",
    "Terms of Service Violation",
    "Abusive Dispute Behavior",
  ];

  const fetchMessages = useCallback(
    async (appealId: string) => {
      setLoadingMessages(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch(
          `/api/admin/appeals?messages=${encodeURIComponent(appealId)}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const updateAppealStatus = useCallback(
    async (appealId: string, newStatus: string, sendResponse = false, responseText?: string) => {
      setUpdatingStatus(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/admin/appeals", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId: appealId,
            status: newStatus,
            ...(sendResponse ? { sendResponse: true, responseText } : {}),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && selectedAppeal) {
            setSelectedAppeal({
              ...selectedAppeal,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            });
            setAppeals((prev) =>
              prev.map((t) =>
                t.id === appealId
                  ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
                  : t
              )
            );
            setStatusDraft(newStatus);
            setResponseText("");
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("Failed to update appeal status:", errorData.error || res.statusText);
        }
      } catch (err) {
        console.error("Failed to update appeal status:", err);
      } finally {
        setUpdatingStatus(false);
      }
    },
    [selectedAppeal]
  );

   useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/admin/appeals", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setAppeals(data.appeals || []);
        }
      } catch (err) {
        console.error("Failed to fetch appeals:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredAppeals = useMemo(() => {
    let result = appeals;
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (categoryFilter && categoryFilter !== "ALL") {
      result = result.filter((t) => t.banCategory === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.bannedUserName && t.bannedUserName.toLowerCase().includes(q)) ||
          (t.bannedUserEmail && t.bannedUserEmail.toLowerCase().includes(q)) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [appeals, search, statusFilter, priorityFilter, categoryFilter]);

  const openDrawer = useCallback(
    (appeal: AppealEntry) => {
      setSelectedAppeal(appeal);
      setDrawerOpen(true);
      setStatusDraft(appeal.status);
      setResponseText("");
      fetchMessages(appeal.id);
    },
    [fetchMessages]
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedAppeal(null);
    setMessages([]);
    setStatusDraft("");
    setResponseText("");
  }, []);

  const handleStatusSave = useCallback(() => {
    if (selectedAppeal && statusDraft !== selectedAppeal.status) {
      updateAppealStatus(selectedAppeal.id, statusDraft, false);
    }
  }, [selectedAppeal, statusDraft, updateAppealStatus]);

  const handleSendResponse = useCallback(async () => {
    if (!selectedAppeal || !responseText.trim()) return;
    setSendingResponse(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/appeals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: selectedAppeal.id,
          status: statusDraft,
          sendResponse: true,
          responseText: responseText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newMessage: AppealMessageEntry = {
            id: `temp-${Date.now()}`,
            senderId: currentUser.uid,
            senderName: "Admin",
            text: responseText.trim(),
            isAdmin: true,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMessage]);
          setResponseText("");
          setSelectedAppeal({
            ...selectedAppeal,
            status: statusDraft,
            updatedAt: new Date().toISOString(),
          });
          setAppeals((prev) =>
            prev.map((t) =>
              t.id === selectedAppeal.id
                ? { ...t, status: statusDraft, updatedAt: new Date().toISOString() }
                : t
            )
          );
          setStatusDraft(statusDraft);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to send response:", errorData.error || res.statusText);
      }
    } catch (err) {
      console.error("Failed to send response:", err);
    } finally {
      setSendingResponse(false);
    }
  }, [selectedAppeal, statusDraft, responseText]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2] flex items-center gap-2">
              <ShieldAlert size={24} className="text-rose-400" />
              Ban Appeals
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Review and manage ban appeal submissions from suspended users.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredAppeals.length} appeal{filteredAppeals.length === 1 ? "" : "s"}
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
              placeholder="Search by ID, subject, user name, or email..."
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
              {availableStatusValues.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Priorities</option>
              {availablePriorityValues.map((p) => (
                <option key={p} value={p}>
                  {getPriorityLabel(p)}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="ALL">All Ban Categories</option>
              {BAN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {availableCategoryValues
                .filter((c) => !BAN_CATEGORIES.includes(c))
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Appeals Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Appeal
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Ban Category
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Submitted
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
                        Loading appeals...
                      </p>
                    </td>
                  </tr>
                ) : filteredAppeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <ShieldAlert
                        size={32}
                        className="mx-auto text-[#8A93A3] mb-2"
                      />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No appeals found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || statusFilter || priorityFilter || categoryFilter
                          ? "Try different search or filter criteria"
                          : "No ban appeals have been submitted yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppeals.map((appeal) => (
                    <tr
                      key={appeal.id}
                      className="hover:bg-[#0B0E14]/40 transition-colors"
                    >
                      {/* Appeal */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-rose-400 shrink-0">
                            <ShieldAlert size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              {appeal.subject || "(No Subject)"}
                            </div>
                            <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                              #{appeal.id.slice(0, 8)}
                              <CopyButton text={appeal.id} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-4">
                        {appeal.userName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User size={12} className="text-[#7C5CFC] shrink-0" />
                              {appeal.userName}
                            </div>
                            {appeal.userEmail && (
                              <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                <Mail size={10} className="shrink-0" />
                                {appeal.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {appeal.bannedUserEmail ||
                              (appeal.userId ? `${appeal.userId.slice(0, 8)}...` : "N/A")}
                          </span>
                        )}
                      </td>

                      {/* Ban Category */}
                      <td className="px-4 py-4">
                        {appeal.banCategory ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getBanCategoryColor(
                              appeal.banCategory
                            )}`}
                          >
                            {appeal.banCategory}
                          </span>
                        ) : (
                          <span className="text-sm text-[#8A93A3]">—</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(
                            appeal.priority
                          )}`}
                        >
                          {getPriorityIcon(appeal.priority)}
                          {getPriorityLabel(appeal.priority)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                            appeal.status
                          )}`}
                        >
                          {getStatusIcon(appeal.status)}
                          {getStatusLabel(appeal.status)}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {SafeFormatTime(appeal.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(appeal)}
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
      {drawerOpen && selectedAppeal && (
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
                  <ShieldAlert size={18} className="text-rose-400" />
                  <span className="truncate">
                    {selectedAppeal.subject || "(No Subject)"}
                  </span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  Appeal #{selectedAppeal.id}
                  <CopyButton text={selectedAppeal.id} />
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
              {/* Status Controls */}
              <div className="flex items-center justify-between bg-[#0B0E14] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">
                    Current Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusColor(
                      statusDraft
                    )}`}
                  >
                    {getStatusIcon(statusDraft)}
                    {getStatusLabel(statusDraft)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
                  >
                    {AVAILABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {getStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleStatusSave}
                    disabled={
                      updatingStatus || statusDraft === selectedAppeal.status
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[#7C5CFC] text-white border border-[#7C5CFC] hover:bg-[#7C5CFC]/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {updatingStatus ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Ban Information */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Ban Information
                    </h3>
                    <div className="space-y-3">
                      {selectedAppeal.banCategory && (
                        <div className="flex items-center gap-3">
                          <AlertCircle size={14} className="text-rose-400 shrink-0" />
                          <div>
                            <span className="text-xs text-[#8A93A3]">Ban Category</span>
                            <div className={`text-sm font-bold mt-1 ${getBanCategoryColor(selectedAppeal.banCategory).split(' ')[0]} text-rose-400`}>
                              {selectedAppeal.banCategory}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedAppeal.banReason && (
                        <div>
                          <span className="text-xs text-[#8A93A3]">Ban Reason</span>
                          <p className="text-sm text-[#EDEFF2] mt-1 leading-relaxed whitespace-pre-wrap">
                            {selectedAppeal.banReason}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-xs text-[#8A93A3]">Banned On</span>
                          <div className="text-sm text-[#EDEFF2] mt-1">
                            {selectedAppeal.bannedAt
                              ? safeDateFormat(selectedAppeal.bannedAt)
                              : "Unknown"}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-[#8A93A3]">Banned By</span>
                          <div className="text-sm text-[#EDEFF2] mt-1 font-mono">
                            {selectedAppeal.bannedBy
                              ? `${selectedAppeal.bannedBy.slice(0, 8)}...`
                              : "System"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appeal Content */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Appeal Content
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-[#8A93A3]">Subject</span>
                        <div className="text-sm font-semibold text-[#EDEFF2] mt-1">
                          {selectedAppeal.subject}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">Category</span>
                        <div className="text-sm text-[#EDEFF2] mt-1">
                          {selectedAppeal.category}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">Message</span>
                        <p className="text-sm text-[#EDEFF2] mt-1 leading-relaxed whitespace-pre-wrap">
                          {selectedAppeal.message || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proof Attachments */}
                  {selectedAppeal.proofUrls &&
                    selectedAppeal.proofUrls.length > 0 && (
                      <div className="bg-[#0B0E14] rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                          Proof Attachments ({selectedAppeal.proofUrls.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedAppeal.proofUrls.map(
                            (url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-[#242938] hover:border-[#FFB020]/30 transition group"
                              >
                                <div className="relative w-full h-20">
                                  <img
                                    src={url}
                                    alt={`Proof ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:opacity-90"
                                  />
                                </div>
                                <div className="p-1.5 text-xs text-[#8A93A3] truncate">
                                  Evidence #{idx + 1}
                                </div>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Conversation Thread */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3 flex items-center gap-2">
                      <MessageCircle size={14} className="text-[#FFB020]" />
                      Conversation History
                    </h3>
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2
                          size={24}
                          className="animate-spin text-[#FFB020]"
                        />
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-[#8A93A3]">
                        No messages in this conversation yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${
                              msg.isAdmin ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                msg.isAdmin
                                  ? "bg-[#7C5CFC] text-white"
                                  : "bg-[#151922] border border-[#242938] text-[#8A93A3]"
                              }`}
                            >
                              {msg.senderName?.[0]?.toUpperCase() ||
                                (msg.isAdmin ? "A" : "U")}
                            </div>
                            <div
                              className={`flex-1 max-w-[80%] rounded-xl px-4 py-3 ${
                                msg.isAdmin
                                  ? "bg-[#7C5CFC]/10 border border-[#7C5CFC]/20"
                                  : "bg-[#0B0E14] border border-[#242938]"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-xs font-bold ${
                                    msg.isAdmin
                                      ? "text-[#7C5CFC]"
                                      : "text-[#EDEFF2]"
                                  }`}
                                >
                                  {msg.senderName}
                                  {msg.isAdmin && (
                                    <Shield size={10} className="ml-1 text-[#FFB020]" />
                                  )}
                                </span>
                                <span className="text-xs text-[#8A93A3]">
                                  {safeDateFormat(msg.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-[#EDEFF2] leading-relaxed">
                                {msg.text || "(empty message)"}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Send Response */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Send Response to User
                    </h3>
                    <div className="space-y-3">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response here..."
                        rows={4}
                        disabled={sendingResponse || updatingStatus}
                        className="w-full bg-[#151922] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 disabled:opacity-50 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8A93A3]">
                          Status will be updated to:{" "}
                          <span className="font-bold text-[#EDEFF2]">
                            {getStatusLabel(statusDraft)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleSendResponse}
                          disabled={
                            sendingResponse ||
                            updatingStatus ||
                            !responseText.trim()
                          }
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC] text-white border border-[#7C5CFC] hover:bg-[#7C5CFC]/80 font-semibold text-sm disabled:opacity-50 transition"
                        >
                          {sendingResponse ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          {sendingResponse ? "Sending..." : "Send & Update Status"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-4">
                  {/* Ticket Details */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Appeal Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-[#8A93A3]">Created</span>
                        <div className="text-sm text-[#EDEFF2] font-mono mt-1">
                          {safeDateFormat(selectedAppeal.createdAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">Last Updated</span>
                        <div className="text-sm text-[#EDEFF2] font-mono mt-1">
                          {safeDateFormat(selectedAppeal.updatedAt)}
                        </div>
                      </div>
                      {selectedAppeal.orderId && (
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Related Order
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-mono text-[#EDEFF2]">
                              #{selectedAppeal.orderId.slice(0, 8)}
                            </span>
                            <CopyButton text={selectedAppeal.orderId} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banned User Info */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Banned User Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-[#7C5CFC] shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">Name</span>
                          <div className="text-sm font-semibold text-[#EDEFF2]">
                            {selectedAppeal.bannedUserName ||
                              selectedAppeal.userName ||
                              "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-[#8A93A3] shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">Email</span>
                          <div className="text-sm text-[#8A93A3]">
                            {selectedAppeal.bannedUserEmail ||
                              selectedAppeal.userEmail ||
                              "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#8A93A3] shrink-0" />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            User ID
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm text-[#EDEFF2] font-mono break-all">
                              {selectedAppeal.userId ||
                                selectedAppeal.originalBanUid ||
                                "N/A"}
                            </span>
                            <CopyButton
                              text={selectedAppeal.userId || selectedAppeal.originalBanUid || ""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-[#8A93A3] shrink-0" />
                        <span className="text-xs text-[#8A93A3]">
                          Appeal Submitted
                        </span>
                        <span className="text-xs text-[#EDEFF2] font-mono">
                          {safeDateFormat(selectedAppeal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-[#8A93A3] shrink-0" />
                        <span className="text-xs text-[#8A93A3]">
                          Last Updated
                        </span>
                        <span className="text-xs text-[#EDEFF2] font-mono">
                          {safeDateFormat(selectedAppeal.updatedAt)}
                        </span>
                      </div>
                    </div>
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

function getPriorityIcon(priority: string) {
  const p = priority.toLowerCase();
  if (p === "urgent") return <Ban size={14} />;
  if (p === "high") return <AlertTriangle size={14} />;
  if (p === "medium") return <Clock size={14} />;
  return <Sparkles size={14} />;
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "resolved") return <CheckCircle2 size={12} />;
  if (s.includes("action")) return <AlertTriangle size={12} />;
  if (s === "open") return <Ticket size={12} />;
  if (s.includes("review")) return <Shield size={12} />;
  return <Ticket size={12} />;
}

const messagesEndRef = { current: null as HTMLDivElement | null };

export default function AdminAppealsPage() {
  return (
    <AdminLayout>
      <AppealsContent />
    </AdminLayout>
  );
}
