"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Search,
  X,
  MessageSquare,
  User,
  Mail,
  Image as ImageIcon,
  Clock,
  MessageCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import AdminLayout from "../layout";

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystemMessage: boolean;
  isRedacted: boolean;
  imageUrl: string | null;
  buyerId: string | null;
  sellerId: string | null;
  createdAt: string;
}

interface ChatSession {
  orderId: string;
  title?: string;
  amount?: number;
  status?: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  messageCount: number;
  lastMessageAt: string;
  messages: ChatMessage[];
}

function formatTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 60 * 1000) return "Just now";
    if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}m ago`;
    if (diffMs < 24 * 60 * 60 * 1000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatDateTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRoleLabel(senderId: string, buyerId: string | null, sellerId: string | null) {
  if (senderId === "SYSTEM") return "System";
  if (buyerId && senderId === buyerId) return "Buyer";
  if (sellerId && senderId === sellerId) return "Seller";
  return "Participant";
}

function ChatContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/chats", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.chatSessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.orderId.toLowerCase().includes(q) ||
        (s.title?.toLowerCase().includes(q) ?? false) ||
        s.buyerName.toLowerCase().includes(q) ||
        s.buyerEmail.toLowerCase().includes(q) ||
        s.sellerName.toLowerCase().includes(q) ||
        s.sellerEmail.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const openDrawer = useCallback((session: ChatSession) => {
    setSelectedSession(session);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedSession(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
            Chat Inspection
          </h1>
          <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
            View all trade chat sessions, participants, and message logs.
          </p>
        </div>
        <div className="text-sm text-[#8A93A3] font-medium">
          {filteredSessions.length} chat{filteredSessions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
        <input
          type="text"
          placeholder="Search by order, user, or title..."
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

      {/* Table */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#242938]">
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Order</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Buyer</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Seller</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Messages</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Last Activity</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242938]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 size={28} className="animate-spin text-[#FFB020] mx-auto" />
                    <p className="text-sm text-[#8A93A3] mt-2">Loading chats...</p>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-base font-semibold text-[#8A93A3]">No chats found</p>
                    <p className="text-xs text-[#8A93A3] mt-1">
                      {search ? "Try a different search term" : "No chat sessions yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.orderId} className="hover:bg-[#0B0E14]/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#EDEFF2]">
                          {session.title || `Order #${session.orderId.slice(0, 6)}`}
                        </div>
                        <div className="text-xs text-[#8A93A3] font-mono">
                          #{session.orderId}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                          <User size={12} className="text-[#7C5CFC] shrink-0" />
                          {session.buyerName}
                        </div>
                        <div className="text-xs text-[#8A93A3] flex items-center gap-1.5 mt-0.5">
                          <Mail size={10} />
                          {session.buyerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#EDEFF2] flex items-center gap-1.5">
                          <User size={12} className="text-[#FFB020] shrink-0" />
                          {session.sellerName}
                        </div>
                        <div className="text-xs text-[#8A93A3] flex items-center gap-1.5 mt-0.5">
                          <Mail size={10} />
                          {session.sellerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={16} className="text-[#7C5CFC]" />
                        <span className="text-sm font-semibold text-[#EDEFF2]">{session.messageCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                        <Clock size={12} />
                        {session.lastMessageAt ? formatTime(session.lastMessageAt) : "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(session)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20 hover:bg-[#7C5CFC]/20 transition"
                      >
                        <MessageSquare size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawerOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-2xl bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <div className="min-w-0">
                <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] truncate">
                  {selectedSession.title || `Chat: ${selectedSession.orderId}`}
                </h2>
                <div className="text-xs text-[#8A93A3] font-mono mt-0.5">#{selectedSession.orderId}</div>
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
              {/* Order Info */}
              <div className="bg-[#0B0E14] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#8A93A3] mb-1">Order ID</div>
                    <div className="text-sm font-mono text-[#EDEFF2]">{selectedSession.orderId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#8A93A3] mb-1">Title</div>
                    <div className="text-sm text-[#EDEFF2]">{selectedSession.title || "N/A"}</div>
                  </div>
                  {selectedSession.amount !== undefined && (
                    <div>
                      <div className="text-xs text-[#8A93A3] mb-1">Amount</div>
                      <div className="text-sm font-semibold text-[#EDEFF2]">{formatNaira(selectedSession.amount)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-[#8A93A3] mb-1">Status</div>
                    <div className="text-sm font-semibold text-[#EDEFF2]">{selectedSession.status || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">
                  Messages ({selectedSession.messages.length})
                </h3>
                <div className="space-y-3">
                  {selectedSession.messages.map((msg, index) => {
                    const prevMsg = index > 0 ? selectedSession.messages[index - 1] : null;
                    const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                    const role = getRoleLabel(msg.senderId, msg.buyerId, msg.sellerId);
                    const isSystem = msg.isSystemMessage;
                    const isOwn = msg.senderId !== "SYSTEM" && (role === "Buyer" || role === "Seller");

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-2">
                            <span className="text-[10px] font-mono text-[#8A93A3] bg-[#0B0E14] px-2.5 py-1 rounded-full border border-[#242938]">
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col gap-1 ${
                            isSystem ? "items-center" : isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                              isSystem
                                ? "bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#EDEFF2]"
                                : "bg-[#0B0E14] border border-[#242938] text-[#EDEFF2]"
                            }`}
                          >
                            {/* Sender label */}
                            {!isSystem && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                  role === "Buyer" ? "text-[#7C5CFC]" : role === "Seller" ? "text-[#FFB020]" : "text-[#8A93A3]"
                                }`}>
                                  {msg.senderName || role} ({role})
                                </span>
                              </div>
                            )}

                            {/* System message */}
                            {isSystem && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-mono uppercase text-[#FFA500]">
                                  {msg.senderName || "System Guard"}
                                </span>
                              </div>
                            )}

                            {/* Image attachment */}
                            {msg.imageUrl && (
                              <a
                                href={msg.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border mb-1.5"
                              >
                                <div className="relative w-full max-h-40">
                                  <img
                                    src={msg.imageUrl}
                                    alt="Attachment"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <span className="block text-[10px] underline px-1 py-1 text-[#8A93A3] hover:text-[#EDEFF2]">
                                  View image
                                </span>
                              </a>
                            )}

                            {/* Text message */}
                            {msg.text && (
                              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                            )}

                            {/* Redacted notice */}
                            {msg.isRedacted && (
                              <div className="flex items-center gap-1.5 mt-2 text-[#8A93A3] italic">
                                <span className="text-[9px]">
                                  Redacted — contains sensitive content
                                </span>
                              </div>
                            )}

                            {/* Timestamp */}
                            <div className={`mt-1 text-[9px] ${isSystem ? "text-[#8A93A3]" : "text-[#8A93A3]/60"}`}>
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedSession.messages.length === 0 && (
                  <p className="text-sm text-[#8A93A3] text-center py-4">No messages in this chat.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminChatsPage() {
  return (
    <AdminLayout>
      <ChatContent />
    </AdminLayout>
  );
}
