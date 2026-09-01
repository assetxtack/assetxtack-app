"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthGuard from "../../components/AuthGuard";
import { 
  HelpCircle, 
  AlertTriangle, 
  MessageSquare, 
  ShieldAlert, 
  Send, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Upload,
  CheckCircle2,
  X,
  Loader2,
  Image as ImageIcon,
  Ticket,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  message: string;
  category: string;
  status: "open" | "under_review" | "resolved" | "action_required";
  priority: "low" | "medium" | "high" | "urgent";
  proofUrls: string[];
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  title?: string;
  amount?: number;
  status?: string;
}

const FAQS = [
  {
    question: "How does the AssetXtack escrow protection work?",
    answer: "When a buyer pays for a publisher account, funds are held securely in our vault. The seller then releases the account credentials. The buyer gets an inspection timer to log in and verify assets before funds are released to the seller."
  },
  {
    question: "What should I do if the login details provided don't work?",
    answer: "Do not confirm the order! Immediately click 'Raise Dispute' on your escrow order page or submit a ticket here with screenshot proof. Our team will freeze the vault timer and step in to verify credentials or process a full refund."
  },
  {
    question: "How long do payout withdrawals take?",
    answer: "Withdrawals to verified Nigerian bank accounts (Kuda, GTBank, Zenith, etc.) are processed automatically within 5 to 15 minutes."
  }
];

const CATEGORIES = [
  "Invalid Account Credentials",
  "Account Description Mismatch",
  "Withdrawal / Payout Delay",
  "Unresponsive Seller / Buyer",
  "Account Banned / Recovered",
  "Other"
];

export default function SupportPage() {
  const { user } = useAuth();
  const currentUserId = user?.uid || "";

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [category, setCategory] = useState("Invalid Account Credentials");
  
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch user's orders for dropdown
  useEffect(() => {
    if (!currentUserId) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`/api/support/orders?userId=${encodeURIComponent(currentUserId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const rawOrders = data.orders || [];
        const seen = new Set<string>();
        const uniqueOrders = rawOrders.filter((order: Order) => {
          const id = order.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setOrders(uniqueOrders);
      }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [currentUserId]);

  // Real-time ticket listener
  useEffect(() => {
    if (!currentUserId) return;

    const ticketsQuery = query(
      collection(db, "supportTickets"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            userId: d.userId || "",
            orderId: d.orderId || "",
            subject: d.subject || "",
            message: d.message || "",
            category: d.category || "",
            status: d.status || "open",
            priority: d.priority || "medium",
            proofUrls: d.proofUrls || [],
            messages: (d.messages || []) as TicketMessage[],
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date(d.createdAt).toISOString(),
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : new Date(d.updatedAt).toISOString(),
          };
        }) as Ticket[];
        setTickets(docs);
        setLoadingTickets(false);
      },
      (error) => {
        console.error("Tickets listener error:", error);
        setLoadingTickets(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Load messages for selected ticket
  useEffect(() => {
    if (!selectedTicketId) return;

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, "supportTickets", selectedTicketId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            senderId: d.senderId || "",
            senderName: d.senderName || "",
            text: d.text || "",
            isAdmin: Boolean(d.isAdmin),
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date(d.createdAt).toISOString(),
          };
        }) as TicketMessage[];
        setTicketMessages(msgs);
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Ticket messages listener error:", error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [selectedTicketId]);

  const handleUploadSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    const secureUrl = info?.secure_url;
    if (secureUrl) {
      setProofUrls((prev) => [...prev, secureUrl]);
    }
  };

  const removeProof = (urlToRemove: string) => {
    setProofUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !currentUserId) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          orderId: selectedOrder || undefined,
          subject: ticketSubject,
          message: ticketMessage,
          category,
          proofUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setSubmittedSuccess(true);
      setTicketSubject("");
      setTicketMessage("");
      setProofUrls([]);
      setSelectedOrder("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit support ticket";
      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId || !currentUserId) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          senderId: currentUserId,
          senderName: user?.displayName || user?.email?.split("@")[0] || "User",
          text: newMessage.trim(),
          isAdmin: false,
          ticketUserId: currentUserId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setTicketMessages([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return { label: "Open", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "under_review":
        return { label: "Under Review", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "resolved":
        return { label: "Resolved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "action_required":
        return { label: "Action Required", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
      default:
        return { label: status, className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-[#EDEFF2]">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
          <div>
            <h1 className="text-2xl font-bold text-[#EDEFF2] flex items-center gap-2 font-display">
              <HelpCircle className="text-[#FFB020]" size={24} /> Support & Dispute Resolution
            </h1>
            <p className="text-xs text-[#8A93A3] mt-1">
              Need help with a trade or withdrawal? Our local support team is here to protect your funds and resolve disputes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-[#FFB020]" />
            <span className="text-xs font-mono text-[#8A93A3]">
              {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
        </div>

        {selectedTicketId ? (
          /* TICKET DETAIL VIEW */
          <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#242938] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-2 rounded-lg bg-[#0B0E14] border border-[#242938] text-[#8A93A3] hover:text-[#EDEFF2] transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-[#EDEFF2]">Ticket #{selectedTicketId.slice(0, 6).toUpperCase()}</h2>
                  <p className="text-[10px] text-[#8A93A3] font-mono">
                    {tickets.find(t => t.id === selectedTicketId)?.subject}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(tickets.find(t => t.id === selectedTicketId)?.status || "").className}`}>
                {getStatusBadge(tickets.find(t => t.id === selectedTicketId)?.status || "").label}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Original Ticket Message */}
              <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                    {tickets.find(t => t.id === selectedTicketId)?.category}
                  </span>
                  <span className="text-[10px] text-[#8A93A3] font-mono">
                    {formatDate(tickets.find(t => t.id === selectedTicketId)?.createdAt || "")}
                  </span>
                </div>
                <p className="text-xs text-[#EDEFF2] leading-relaxed">
                  {tickets.find(t => t.id === selectedTicketId)?.message}
                </p>
                {tickets.find(t => t.id === selectedTicketId)?.proofUrls && tickets.find(t => t.id === selectedTicketId)!.proofUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tickets.find(t => t.id === selectedTicketId)!.proofUrls.map((url, idx) => (
                      <img key={idx} src={url} alt={`Proof ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-[#242938]" />
                    ))}
                  </div>
                )}
              </div>

              {/* Messages Thread */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#EDEFF2] flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#FFB020]" /> Conversation
                </h3>
                
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#FFB020]" />
                  </div>
                ) : ticketMessages.length === 0 ? (
                  <p className="text-[10px] text-[#8A93A3] text-center py-4">
                    No replies yet. Support will respond shortly.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {ticketMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? "items-start" : "items-end"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-[#8A93A3]">
                            {msg.isAdmin ? "Support Team" : "You"} • {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.isAdmin
                            ? "bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] rounded-tl-none"
                            : "bg-[#FFB020] text-[#0B0E14] font-medium rounded-tr-none"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-[#242938]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a follow-up message..."
                  className="flex-1 bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="p-2.5 rounded-xl bg-[#FFB020] text-[#0B0E14] hover:bg-[#e09b1c] disabled:opacity-50 transition-colors"
                >
                  {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* TICKETS LIST VIEW */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Open Dispute / Ticket Form */}
              <div className="lg:col-span-2 bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
              <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-400" /> Open a Dispute or Ticket
              </h2>
              <span className="text-[10px] font-mono text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                Escrow Protection Active
              </span>
            </div>

            {submittedSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> Support ticket created successfully!
                </span>
                <button 
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} /> {errorMessage}
                </span>
                <button 
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                    Related Order ID
                  </label>
                  <select
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    disabled={loadingOrders}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono disabled:opacity-50"
                  >
                    <option value="">-- Select Order --</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id} {order.title ? `— ${order.title}` : ""} {order.amount ? `— ₦${Number(order.amount).toLocaleString()}` : ""}
                      </option>
                    ))}
                    <option value="NONE">General / Account / Payout Issue</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                    Category
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened when you tried logging in or processing your payout..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  required
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-3 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 resize-none"
                />
              </div>

              {/* Proof Screenshots Upload Section */}
              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Proof Screenshots / Evidence (Recommended)
                </label>

                <div className="space-y-3">
                  <CldUploadWidget 
                    uploadPreset="assetxtack_preset"
                    options={{
                      cloudName: "vqwtykcl"
                    }}
                    onSuccess={handleUploadSuccess as (result: unknown) => void}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full border border-dashed border-[#242938] hover:border-[#FFB020]/50 bg-[#0B0E14] rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-xs text-[#8A93A3] hover:text-[#EDEFF2] transition-all"
                      >
                        <Upload size={14} className="text-[#FFB020]" />
                        <span>Upload Proof (Failed login screens, screenshots)</span>
                      </button>
                    )}
                  </CldUploadWidget>

                  {/* Uploaded Thumbnails List */}
                  {proofUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {proofUrls.map((url, idx) => (
                        <div key={idx} className="relative group bg-[#0B0E14] border border-[#242938] rounded-lg p-1.5 flex items-center gap-2 text-[10px] text-[#8A93A3]">
                          <ImageIcon size={12} className="text-[#FFB020]" />
                          <span className="truncate max-w-[100px]">Proof #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeProof(url)}
                            className="text-rose-400 hover:text-rose-300 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !currentUserId}
                className="flex items-center justify-center gap-2 w-full bg-[#FFB020] hover:bg-[#e09b1c] disabled:opacity-50 text-[#0B0E14] font-bold text-xs py-3 rounded-xl transition-all shadow-md mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Submitting Ticket...
                  </>
                ) : (
                  <>
                    Submit Support Ticket <Send size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Tickets Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#FFB020]" /> Active Tickets
                </h2>
                <span className="text-[10px] font-mono text-[#8A93A3] bg-[#0B0E14] px-2 py-0.5 rounded border border-[#242938]">
                  {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
                </span>
              </div>

              <div className="space-y-3">
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#FFB020]" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <Ticket size={32} className="text-[#8A93A3] mx-auto opacity-50" />
                    <p className="text-xs text-[#8A93A3] font-mono">
                      No active support tickets found.
                    </p>
                    <p className="text-[10px] text-[#8A93A3]">
                      Tickets you submit will appear here.
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    return (
                      <div 
                        key={ticket.id} 
                        className="bg-[#0B0E14] border border-[#242938] p-3.5 rounded-xl space-y-2 hover:border-[#FFB020]/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                            {ticket.id}
                          </span>
                          <span className="text-[10px] text-[#8A93A3] font-mono">{formatDate(ticket.updatedAt)}</span>
                        </div>
                        <h3 className="text-xs font-bold text-[#EDEFF2] line-clamp-1">{ticket.subject}</h3>
                        <p className="text-[10px] text-[#8A93A3] line-clamp-2">{ticket.message}</p>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#242938]">
                          <span className="text-[#8A93A3]">
                            {ticket.orderId && ticket.orderId !== "NONE" ? `Order: ${ticket.orderId}` : "General Inquiry"}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                        {ticket.proofUrls.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-[#8A93A3]">
                            <ImageIcon size={10} className="text-[#FFB020]" />
                            <span>{ticket.proofUrls.length} proof image{ticket.proofUrls.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Notice */}
            <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#EDEFF2]">
                <AlertTriangle size={15} className="text-[#FFB020]" /> Response SLA
              </div>
              <p className="text-[11px] text-[#8A93A3] leading-relaxed">
                Dispute tickets involving active escrow orders freeze all vault payouts immediately. Our team usually reviews logs within 1 to 4 hours.
              </p>
             </div>
           </div>
         </div>
         </>
       )}

        {/* Frequently Asked Questions */}
        <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
            <FileText size={18} className="text-[#7C5CFC]" /> Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-[#0B0E14] border border-[#242938] rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-[#EDEFF2] hover:text-[#FFB020] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[#8A93A3] leading-relaxed border-t border-[#242938]/50 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
