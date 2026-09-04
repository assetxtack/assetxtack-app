"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle, Clock, KeyRound, ShieldAlert, ShieldCheck, Wallet, Copy, Check, Star } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import DeliveryModal from "../../../components/dashboard/DeliveryModal";
import TradeChat from "../../../components/dashboard/TradeChat";
import ReviewModal from "../../../components/dashboard/ReviewModal";
import OrderCountdown from "../../../components/dashboard/OrderCountdown";
import ConfirmReleaseModal from "../../../components/dashboard/ConfirmReleaseModal";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../../../context/AuthContext";

type Order = {
  id: string;
  title?: string;
  amount?: number;
  sellerId?: string;
  sellerName?: string;
  buyerId?: string;
  status?: "IN_ESCROW" | "AWAITING_CREDENTIALS" | "INSPECTION_PERIOD" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "CANCELLED";
  credentials?: string;
  credentialsSubmitted?: string;
  deliveryNotes?: string;
  listingId?: string;
  paymentVerifiedAt?: string | Date | null;
  credentialsDeliveredAt?: string | Date | null;
};

export default function OrderDashboardPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderExists, setOrderExists] = useState(true);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent SSR hydration mismatches with dynamic elements/timers on Vercel
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentUserId = user?.uid ?? "";
  const currentUserName = user?.displayName || user?.email?.split("@")[0] || "AssetXtack User";
  const isBuyer = currentUserId !== "" && order?.buyerId === currentUserId;
  const isSeller = currentUserId !== "" && order?.sellerId === currentUserId;
  const isParticipant = isBuyer || isSeller;
  const credentials = order?.credentialsSubmitted || order?.credentials;
  const recipientId = isBuyer ? (order?.sellerId || "") : isSeller ? (order?.buyerId || "") : "";

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snapshot) => {
        if (cancelled) return;
        if (!snapshot.exists()) {
          setOrderExists(false);
          setOrder(null);
          return;
        }
        setOrderExists(true);
        setOrder({ id: snapshot.id, ...(snapshot.data() as Omit<Order, "id">) });
      },
      (error) => {
        if (cancelled) return;
        console.error("Firestore order listener error:", error);
        setOrderExists(false);
        setOrder(null);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !isBuyer || order?.status !== "COMPLETED") return;
    let cancelled = false;

    const q = query(collection(db, "reviews"), where("orderId", "==", orderId));
    const unsub = onSnapshot(q, (snap) => {
      if (cancelled) return;
      setHasReviewed(!snap.empty);
    }, (err) => {
      if (cancelled) return;
      console.error("Error fetching reviews for order:", err);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [orderId, isBuyer, order?.status]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!order?.id || !order?.sellerId || !currentUserId) return;

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        listingId: order.listingId || order.id,
        sellerId: order.sellerId,
        buyerId: currentUserId,
        rating,
        comment,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to submit review");
    }
  };

  const parseCredentialLine = (line: string) => {
    const [key, ...valueParts] = line.split(":");
    if (!key || valueParts.length === 0) return null;
    const value = valueParts.join(":").trim();
    if (!value) return null;
    return { key: key.trim(), value };
  };

  const credentialFields = credentials
    ? credentials.split("\n").map(parseCredentialLine).filter(Boolean) as { key: string; value: string }[]
    : [];

  const copyToClipboard = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Copy failed");
    }
  };

  const updateStatus = async (status: "COMPLETED" | "DISPUTED" | "CANCELLED", text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId || "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
          disputedAt: status === "DISPUTED" ? new Date().toISOString() : undefined,
          initiatorId: currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order");
      }

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          senderId: "SYSTEM",
          senderName: "System Guard",
          text,
          isSystemMessage: true,
        }),
      });
    } catch (error) {
      console.error(`Unable to mark order as ${status}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const raiseDispute = () => {
    if (!window.confirm("Raise an escrow dispute? The vault will be frozen.")) return;
    if (!order?.id) return;

    void updateStatus(
      "DISPUTED",
      `Order disputed by ${isSeller ? "seller" : "buyer"}. Vault frozen; an AssetXtack mediator has been assigned.`
    );
  };

  const releaseFunds = async () => {
    try {
      await updateStatus("COMPLETED", "Buyer confirmed delivery. Escrow funds released to the seller.");
    } catch (error) {
      console.error("Unable to release funds:", error);
    }
  };

  const isAwaitingCredentials = order?.status === "AWAITING_CREDENTIALS" || order?.status === "IN_ESCROW";
  const isInspectionPeriod = order?.status === "INSPECTION_PERIOD" || order?.status === "DELIVERED";

  // Prevent layout shifts during SSR hydration phase
  if (!isMounted) {
    return (
      <AuthGuard>
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="p-12 bg-[#151922] border border-[#242938] rounded-2xl text-center text-zinc-400">
            Loading secure vault session...
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {!orderExists ? (
          <div className="p-6 bg-[#151922] border border-rose-500/30 rounded-2xl text-center space-y-3">
            <ShieldAlert className="mx-auto text-rose-400" />
            <h1 className="text-lg font-bold text-[#EDEFF2]">Order not found</h1>
            <Link href="/marketplace" className="text-xs font-bold text-[#FFB020] hover:underline">Back to marketplace</Link>
          </div>
        ) : (
          <>
            <section className="p-6 bg-[#151922] border border-[#242938] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 font-semibold">Order #{orderId}</span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><ShieldCheck size={14} /> {order?.status || "AWAITING_CREDENTIALS"}</span>
                  {isParticipant && <span className="text-[10px] font-bold text-[#EDEFF2] bg-[#0B0E14] px-2 py-1 rounded border border-[#242938]">You are the {isSeller ? "seller" : "buyer"}</span>}
                </div>
                <h1 className="text-xl font-bold text-[#EDEFF2] mt-2">{order?.title || "Loading escrow order..."}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isSeller && isAwaitingCredentials && <button onClick={() => setIsDeliveryModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-xs">Submit Credentials</button>}
                {isBuyer && isAwaitingCredentials && <button onClick={raiseDispute} disabled={isProcessing} className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold disabled:opacity-50">Raise Dispute</button>}
                {isSeller && isInspectionPeriod && <button onClick={raiseDispute} disabled={isProcessing} className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold disabled:opacity-50">Raise Dispute</button>}
                {isBuyer && isInspectionPeriod && <button onClick={() => setIsReleaseModalOpen(true)} disabled={isProcessing} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0B0E14] font-bold text-xs disabled:opacity-50">Confirm Delivery & Release Funds</button>}
                {order?.status === "COMPLETED" && <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5"><CheckCircle size={16} /> Completed</span>}
                {isBuyer && order?.status === "COMPLETED" && !hasReviewed && (
                  <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-xs flex items-center gap-1.5 hover:bg-[#ffa500] transition">
                    <Star size={14} /> Leave a Review
                  </button>
                )}
                {order?.status === "DISPUTED" && <span className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5"><ShieldAlert size={16} /> Escrow frozen</span>}
                {order?.status === "CANCELLED" && <span className="px-4 py-2 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold flex items-center gap-1.5"><ShieldAlert size={16} /> Cancelled & Refunded</span>}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                {(isAwaitingCredentials || isInspectionPeriod) && (
                  <OrderCountdown
                    status={isAwaitingCredentials ? "AWAITING_CREDENTIALS" : "INSPECTION_PERIOD"}
                    paymentVerifiedAt={order?.paymentVerifiedAt}
                    credentialsDeliveredAt={order?.credentialsDeliveredAt}
                    isBuyer={isBuyer}
                    isSeller={isSeller}
                  />
                )}
                {isBuyer && credentialFields.length > 0 && (
                  <section className="p-5 bg-[#151922] border border-[#FFB020]/30 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 text-[#FFB020]">
                      <KeyRound size={16} />
                      <h2 className="text-xs uppercase font-extrabold tracking-wider">Delivered Account Credentials</h2>
                    </div>
                    <div className="space-y-3">
                      {credentialFields.map((field) => (
                        <div key={field.key} className="bg-[#0B0E14] border border-[#242938] rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-[#8A93A3] block mb-0.5">{field.key}</span>
                            <span className="text-xs font-mono font-bold text-[#EDEFF2] break-all">{field.value}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(field.value, field.key)}
                            className="shrink-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#FFB020] hover:border-[#FFB020]/40 transition-colors"
                            title={`Copy ${field.key}`}
                          >
                            {copiedField === field.key ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                    {order?.deliveryNotes && (
                      <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-[#8A93A3] block mb-0.5">Seller Notes</span>
                        <span className="text-xs text-[#EDEFF2]">{order.deliveryNotes}</span>
                      </div>
                    )}
                  </section>
                )}
                <section className="p-5 bg-[#151922] border border-[#242938] rounded-2xl space-y-4 shadow-xl">
                  <h2 className="text-sm font-semibold text-[#EDEFF2] border-b border-[#242938] pb-3">Transaction Details</h2>
                  <div className="flex justify-between text-xs"><span className="text-[#8A93A3]">Total Escrow Amount</span><span className="font-mono font-bold text-[#EDEFF2]">₦{Number(order?.amount || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#8A93A3]">Seller</span><Link href={`/seller/${order?.sellerId}`} className="text-[#FFB020] font-medium hover:underline">{order?.sellerName || "Seller"}</Link></div>
                  <div className="flex justify-between text-xs"><span className="text-[#8A93A3]">Vault Protection</span><span className="text-emerald-400 font-medium flex items-center gap-1"><Clock size={12} /> 24-Hour Phase Timer</span></div>
                  {isSeller && order?.status === "COMPLETED" && <Link href="/wallet" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"><Wallet size={14} /> View Wallet</Link>}
                </section>
                <section className="p-4 bg-[#151922]/60 border border-[#242938] rounded-2xl flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-[#FFB020] shrink-0" /><p className="text-xs text-[#8A93A3]">Keep every part of this transaction within AssetXtack. {isAwaitingCredentials ? "Seller must deliver credentials before the timer expires." : isInspectionPeriod ? "Funds remain locked until the buyer confirms or the inspection period ends." : "Funds remain locked until the buyer confirms delivery."}</p></section>
              </div>
              <div className="lg:col-span-7">
                {isParticipant ? (
                  <TradeChat orderId={orderId} currentUserId={currentUserId} currentUserName={currentUserName} recipientId={recipientId} orderStatus={order?.status || "AWAITING_CREDENTIALS"} />
                ) : (
                  <div className="h-full min-h-48 bg-[#151922] border border-rose-500/30 rounded-2xl p-6 text-center">
                    <ShieldAlert className="mx-auto text-rose-400 mb-3" />
                    <h2 className="text-sm font-bold text-[#EDEFF2]">This order belongs to another buyer and seller</h2>
                    <p className="text-xs text-[#8A93A3] mt-2">Only the buyer and seller linked to this order can view its trade chat or take escrow actions.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <DeliveryModal orderId={orderId} buyerId={order?.buyerId || ""} sellerId={order?.sellerId || ""} isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />
      <ConfirmReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirm={releaseFunds}
        orderTitle={order?.title || undefined}
        amount={order?.amount || undefined}
      />
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        sellerName={order?.sellerName}
      />
    </AuthGuard>
  );
}