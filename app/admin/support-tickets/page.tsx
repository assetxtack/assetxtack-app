"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Copy,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Shield,
  Sparkles,
  MessageCircle,
  Send,
  Save,
  ExternalLink,
  FileText,
  ChevronDown,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SupportTicketEntry {
  id: string;
  userId: string;
  orderId?: string;
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
}

const AVAILABLE_STATUSES = Object.keys(SUPPORT_TICKET_STATUS_LABELS);
const AVAILABLE_PRIORITIES = Object.keys(SUPPORT_TICKET_PRIORITY_LABELS);

function getPriotityColor(priority: string): string {
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

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "resolved") return <CheckCircle2 size={14} />;
  if (s.includes("action")) return <AlertTriangle size={14} />;
  if (s === "open") return <Ticket size={14} />;
  if (s.includes("review")) return <Shield size={14} />;
  return <Ticket size={14} />;
}

function getPriorityIcon(priority: string) {
  const p = priority.toLowerCase();
  if (p === "urgent") return <Ban size={14} />;
  if (p === "high") return <AlertTriangle size={14} />;
  if (p === "medium") return <Clock size={14} />;
  return <Sparkles size={14} />;
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

function SupportTicketsContent() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketEntry | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");

  const availableStatusValues = useMemo(() => {
    const statuses = [...new Set(tickets.map((t) => t.status))];
    return statuses.sort();
  }, [tickets]);

  const availablePriorityValues = useMemo(() => {
    const priorities = [...new Set(tickets.map((t) => t.priority))];
    return priorities.sort();
  }, [tickets]);

  const fetchTickets = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/support-tickets", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (ticketId: string) => {
      setLoadingMessages(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch(
          `/api/admin/support-tickets?messages=${encodeURIComponent(ticketId)}`,
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

  const updateTicketStatus = useCallback(
    async (ticketId: string, newStatus: string) => {
      setUpdatingStatus(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/admin/support-tickets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticketId, status: newStatus }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && selectedTicket) {
            setSelectedTicket({
              ...selectedTicket,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            });
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticketId
                  ? { ...t, status: newStatus }
                  : t
              )
            );
            setStatusDraft(newStatus);
          }
        }
      } catch (err) {
        console.error("Failed to update ticket status:", err);
      } finally {
        setUpdatingStatus(false);
      }
    },
    [selectedTicket]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tickets, search, statusFilter, priorityFilter]);

  const openDrawer = useCallback((ticket: SupportTicketEntry) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
    setStatusDraft(ticket.status);
    fetchMessages(ticket.id);
  }, [fetchMessages]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedTicket(null);
    setMessages([]);
    setStatusDraft("");
  }, []);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (selectedTicket) {
        updateTicketStatus(selectedTicket.id, newStatus);
      }
    },
    [selectedTicket, updateTicketStatus]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Support Tickets
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Manage and respond to user support requests.
            </p>
          </div>
          <div className="text-sm text-[#8A93A3] font-medium">
            {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
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
              placeholder="Search by ticket ID, subject, or user name/email..."
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
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Last Updated
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
                        Loading support tickets...
                      </p>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Ticket
                        size={32}
                        className="mx-auto text-[#8A93A3] mb-2"
                      />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No tickets found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || statusFilter || priorityFilter
                          ? "Try different search or filter criteria"
                          : "No support tickets have been submitted yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#0B0E14]/40 transition-colors"
                    >
                      {/* Ticket */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-[#FFB020] shrink-0">
                            <Ticket size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              {ticket.subject || "(No Subject)"}
                            </div>
                            <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                              #{ticket.id.slice(0, 8)}
                              <CopyButton text={ticket.id} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-4">
                        {ticket.userName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User
                                size={12}
                                className="text-[#7C5CFC] shrink-0"
                              />
                              {ticket.userName}
                            </div>
                            {ticket.userEmail && (
                              <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                <Mail size={10} className="shrink-0" />
                                {ticket.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {ticket.userId
                              ? `${ticket.userId.slice(0, 8)}...`
                              : "N/A"}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#EDEFF2]">
                          {ticket.category || "—"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriotityColor(
                            ticket.priority
                          )}`}
                        >
                          {getPriorityIcon(ticket.priority)}
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {safeFormatTime(ticket.updatedAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(ticket)}
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
      {drawerOpen && selectedTicket && (
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
                  <Ticket size={18} className="text-[#FFB020]" />
                  <span className="truncate">
                    {selectedTicket.subject || "(No Subject)"}
                  </span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  Ticket #{selectedTicket.id}
                  <CopyButton text={selectedTicket.id} />
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
                    onClick={() => handleStatusChange(statusDraft)}
                    disabled={
                      updatingStatus || statusDraft === selectedTicket.status
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

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Description */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Description
                    </h3>
                    <p className="text-sm text-[#EDEFF2] leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message || "No description provided."}
                    </p>
                  </div>

                  {/* Conversation Thread */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
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
                              msg.isAdmin
                                ? "flex-row-reverse"
                                : ""
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
                                    <Shield
                                      size={10}
                                      className="ml-1 text-[#FFB020]"
                                    />
                                  )}
                                </span>
                                <span className="text-xs text-[#8A93A3]">
                                  {safeFormatTime(msg.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-[#EDEFF2] leading-relaxed">
                                {msg.text || "(empty message)"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column — Details */}
                <div className="space-y-4">
                  {/* Quick Details */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Ticket Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Category
                        </span>
                        <div className="text-sm text-[#EDEFF2] mt-1">
                          {selectedTicket.category || "Uncategorized"}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Priority
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getPriotityColor(
                              selectedTicket.priority
                            )}`}
                          >
                            {getPriorityIcon(selectedTicket.priority)}
                            {getPriorityLabel(selectedTicket.priority)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">Created</span>
                        <div className="text-sm text-[#EDEFF2] mt-1">
                          {safeDateFormat(selectedTicket.createdAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-[#8A93A3]">
                          Last Updated
                        </span>
                        <div className="text-sm text-[#EDEFF2] mt-1">
                          {safeDateFormat(selectedTicket.updatedAt)}
                        </div>
                      </div>
                      {selectedTicket.orderId && (
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Related Order
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-mono text-[#EDEFF2]">
                              #{selectedTicket.orderId.slice(0, 8)}
                            </span>
                            <CopyButton text={selectedTicket.orderId} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seller/User Info */}
                  <div className="bg-[#0B0E14] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                      Ticket Creator
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User
                          size={16}
                          className="text-[#7C5CFC] shrink-0"
                        />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            Name
                          </span>
                          <div className="text-sm font-semibold text-[#EDEFF2]">
                            {selectedTicket.userName || "N/A"}
                          </div>
                        </div>
                      </div>
                      {selectedTicket.userEmail && (
                        <div className="flex items-center gap-3">
                          <Mail
                            size={16}
                            className="text-[#8A93A3] shrink-0"
                          />
                          <div>
                            <span className="text-xs text-[#8A93A3]">
                              Email
                            </span>
                            <div className="text-sm text-[#8A93A3]">
                              {selectedTicket.userEmail}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <FileText
                          size={16}
                          className="text-[#8A93A3] shrink-0"
                        />
                        <div>
                          <span className="text-xs text-[#8A93A3]">
                            User ID
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-[#EDEFF2] font-mono break-all">
                              {selectedTicket.userId}
                            </span>
                            <CopyButton text={selectedTicket.userId} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proof Attachments */}
                  {selectedTicket.proofUrls &&
                    selectedTicket.proofUrls.length > 0 && (
                      <div className="bg-[#0B0E14] rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                          Proof Attachments
                        </h3>
                        <div className="space-y-2">
                          {selectedTicket.proofUrls.map(
                            (url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-[#8A93A3] hover:text-[#EDEFF2] transition group"
                              >
                                <ExternalLink
                                  size={14}
                                  className="shrink-0"
                                />
                                <span className="truncate">
                                  Attachment {idx + 1}
                                </span>
                              </a>
                            )
                          )}
                        </div>
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

export default function AdminSupportTicketsPage() {
  return (
    <AdminLayout>
      <SupportTicketsContent />
    </AdminLayout>
  );
}
