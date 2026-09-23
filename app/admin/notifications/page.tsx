"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  getStatusColor as getStatusColorEnum,
} from "@/lib/admin-enums";
import {
  Search,
  X,
  Bell,
  User,
  Mail,
  Clock,
  Loader2,
  Eye,
  Copy,
  CheckCircle2,
  Shield,
  BellRing,
  ExternalLink,
  Send,
  FileText,
} from "lucide-react";
import AdminLayout from "../layout";
import CopyButton from "@/app/components/admin/CopyButton";
import { NotificationType } from "@/lib/notifications";

interface NotificationEntry {
  id: string;
  userId: string;
  orderId: string | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  orderTitle: string | null;
}

const TYPE_OPTIONS: { value: string; label: string }[] = Object.entries(
  NOTIFICATION_TYPE_LABELS
).map(([value, label]) => ({ value, label }));

function getTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] || type;
}

function getTypeColor(type: string): string {
  return getStatusColorEnum(type, NOTIFICATION_TYPE_COLORS);
}

function getTypeIcon(type: string) {
  const t = type.toUpperCase();
  if (t === "DISPUTE_RAISED" || t === "DISPUTE" || t === "TAMPERING_REPORT")
    return <Shield size={14} />;
  if (t === "ESCROW_LOCKED") return <BellRing size={14} />;
  if (t === "ESCROW_DELIVERED") return <Bell size={14} />;
  return <Bell size={14} />;
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

function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    userId: "",
    orderId: "",
    title: "",
    message: "",
    type: "ESCROW_LOCKED" as NotificationType,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (typeFilter) {
      result = result.filter((n) => n.type === typeFilter);
    }
    if (readFilter) {
      if (readFilter === "read") {
        result = result.filter((n) => n.read);
      } else if (readFilter === "unread") {
        result = result.filter((n) => !n.read);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.id.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.userName && n.userName.toLowerCase().includes(q)) ||
          (n.userEmail && n.userEmail.toLowerCase().includes(q)) ||
          (n.orderId && n.orderId.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notifications, search, typeFilter, readFilter]);

  const openDrawer = useCallback((n: NotificationEntry) => {
    setSelectedNotification(n);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNotification(null);
  }, []);

  const handleBroadcastChange = (field: string, value: string) => {
    setBroadcastForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitBroadcast = async () => {
    try {
      setBroadcastLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastForm),
      });
      if (res.ok) {
        setBroadcastOpen(false);
        setBroadcastForm({
          userId: "",
          orderId: "",
          title: "",
          message: "",
          type: "ESCROW_LOCKED",
        });
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to send notification:", err);
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Notifications
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              All platform notifications, sorted by most recent first.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-[#8A93A3] font-medium">
              {filteredNotifications.length} notification
              {filteredNotifications.length === 1 ? "" : "s"}
            </div>
            <button
              type="button"
              onClick={() => setBroadcastOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC] text-[#FFFFFF] text-sm font-bold hover:bg-[#7C5CFC]/80 transition"
            >
              <Send size={16} />
              Send Notification
            </button>
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
              placeholder="Search by title, message, user name/email, or order ID..."
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
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] text-sm font-semibold focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
            >
              <option value="">All Statuses</option>
              <option value="read">Read Only</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>
        </div>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#242938]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
                    Order
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
                        Loading notifications...
                      </p>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Bell size={32} className="mx-auto text-[#8A93A3] mb-2" />
                      <p className="text-base font-semibold text-[#8A93A3]">
                        No notifications found
                      </p>
                      <p className="text-xs text-[#8A93A3] mt-1">
                        {search || typeFilter || readFilter
                          ? "Try different search or filter criteria"
                          : "No notifications have been sent yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-[#0B0E14]/40 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0B0E14] border border-[#242938] flex items-center justify-center text-[#FFB020] shrink-0">
                            {getTypeIcon(n.type)}
                          </div>
                          <div>
                            <div
                              className={`text-sm font-semibold ${
                                n.read ? "text-[#8A93A3]" : "text-[#EDEFF2]"
                              }`}
                            >
                              {n.title || "Untitled"}
                            </div>
                            {n.read ? (
                              <span className="text-xs text-[#8A93A3]">
                                Read
                              </span>
                            ) : (
                              <span className="text-xs text-[#FFB020] font-semibold">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
                            n.type
                          )}`}
                        >
                          {getTypeIcon(n.type)}
                          {getTypeLabel(n.type)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {n.userName ? (
                          <div>
                            <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                              <User
                                size={12}
                                className="text-[#7C5CFC] shrink-0"
                              />
                              {n.userName}
                            </div>
                            {n.userEmail && (
                              <div className="text-xs text-[#8A93A3] flex items-center gap-1">
                                <Mail size={10} className="shrink-0" />
                                {n.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            {n.userId
                              ? `${n.userId.slice(0, 8)}...`
                              : "N/A"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {n.orderTitle ? (
                          <div className="text-sm text-[#EDEFF2]">
                            {n.orderTitle}
                          </div>
                        ) : n.orderId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[#EDEFF2] font-mono">
                              #{n.orderId.slice(0, 6)}
                            </span>
                            <CopyButton text={n.orderId} />
                            <a
                              href={`/orders/${n.orderId}`}
                              className="text-[#7C5CFC] hover:text-[#8A93A3] transition"
                              title="View order"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8A93A3] font-mono">
                            N/A
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            n.read
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {n.read ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <BellRing size={12} />
                          )}
                          {n.read ? "Read" : "Unread"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <Clock size={12} />
                          {safeFormatTime(n.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawer(n)}
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

      {drawerOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-3xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                  <Bell size={18} className="text-[#FFB020]" />
                  <span className="truncate">
                    {selectedNotification.title || "Untitled"}
                  </span>
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">
                  Notification #{selectedNotification.id}
                  <CopyButton text={selectedNotification.id} />
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
                  Notification Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3]">Type</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
                        selectedNotification.type
                      )}`}
                    >
                      {getTypeIcon(selectedNotification.type)}
                      {getTypeLabel(selectedNotification.type)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Read Status</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        selectedNotification.read
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {selectedNotification.read ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <BellRing size={12} />
                      )}
                      {selectedNotification.read ? "Read" : "Unread"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Reference ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-[#EDEFF2] font-mono">
                        #{selectedNotification.id}
                      </span>
                      <CopyButton text={selectedNotification.id} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#8A93A3]">Created At</span>
                    <div className="text-sm text-[#EDEFF2] font-mono mt-1">
                      {safeDateFormat(selectedNotification.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Title
                </h3>
                <p className="text-sm font-semibold text-[#EDEFF2]">
                  {selectedNotification.title || "No title provided."}
                </p>
              </div>

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Message
                </h3>
                <p className="text-sm text-[#EDEFF2] leading-relaxed">
                  {selectedNotification.message || "No message provided."}
                </p>
              </div>

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
                        {selectedNotification.userName || "N/A"}
                      </div>
                    </div>
                  </div>
                  {selectedNotification.userEmail && (
                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="text-[#8A93A3] shrink-0"
                      />
                      <div>
                        <span className="text-xs text-[#8A93A3]">Email</span>
                        <div className="text-sm text-[#8A93A3]">
                          {selectedNotification.userEmail}
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
                          {selectedNotification.userId}
                        </span>
                        <CopyButton text={selectedNotification.userId} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedNotification.orderId && (
                <div className="bg-[#0B0E14] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                    Related Order
                  </h3>
                  <div className="flex items-center gap-3">
                    <Shield
                      size={16}
                      className="text-[#FFB020] shrink-0"
                    />
                    <div>
                      <span className="text-xs text-[#8A93A3]">Order ID</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-mono text-[#EDEFF2]">
                          #{selectedNotification.orderId}
                        </span>
                        <CopyButton text={selectedNotification.orderId} />
                        <a
                          href={`/orders/${selectedNotification.orderId}`}
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

              <div className="bg-[#0B0E14] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)] mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#8A93A3] shrink-0" />
                    <span className="text-xs text-[#8A93A3]">
                      Notification Sent
                    </span>
                    <span className="text-xs text-[#EDEFF2] font-mono">
                      {safeDateFormat(selectedNotification.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBroadcastOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[#151922] border border-[#242938] rounded-2xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#242938]">
              <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                <Send size={18} className="text-[#FFB020]" />
                Send Notification
              </h2>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="p-2 rounded-lg text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2] transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-1.5">
                  Recipient User ID
                </label>
                <input
                  type="text"
                  value={broadcastForm.userId}
                  onChange={(e) => handleBroadcastChange("userId", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm"
                  placeholder="Enter user ID"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-1.5">
                  Order ID (optional)
                </label>
                <input
                  type="text"
                  value={broadcastForm.orderId}
                  onChange={(e) =>
                    handleBroadcastChange("orderId", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm"
                  placeholder="Enter order ID (optional)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => handleBroadcastChange("title", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) =>
                    handleBroadcastChange("message", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm resize-none"
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) =>
                    handleBroadcastChange(
                      "type",
                      e.target.value as NotificationType
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] text-sm font-medium focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[#242938]">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#8A93A3] hover:bg-[#0B0E14] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBroadcast}
                disabled={
                  broadcastLoading ||
                  !broadcastForm.userId ||
                  !broadcastForm.title ||
                  !broadcastForm.message
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#7C5CFC] text-[#FFFFFF] hover:bg-[#7C5CFC]/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {broadcastLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {broadcastLoading ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminLayout>
      <NotificationsContent />
    </AdminLayout>
  );
}
