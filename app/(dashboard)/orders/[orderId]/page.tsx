"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import TradeChat from "../../../components/dashboard/TradeChat";
import DeliveryModal from "../../../components/dashboard/DeliveryModal";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Wallet, 
  KeyRound,
  AlertTriangle 
} from "lucide-react";

export default function OrderDashboardPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active user identity (will bind to Firebase Auth currentUser in production)
  const currentUserId = "USER_BUYER_ID";
  const currentUserName = "Asset Xtack";

  useEffect(() => {
    if (!orderId) return;

    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  // Determine user permissions and seller verification state
  const isBuyer = order?.buyerId ? currentUserId === order.buyerId : true; 
  const isSeller = order?.sellerId ? currentUserId === order.sellerId : false;
  const isSellerVerified = order?.sellerVerified ?? false;

  // Handler: Confirm Delivery & Release Escrow Funds
  const handleReleaseFunds = async () => {
    if (
      !confirm(
        "Are you sure you want to release funds to the seller? This action is irreversible."
      )
    )
      return;

    setIsProcessing(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      await setDoc(
        orderRef,
        {
          status: "COMPLETED",
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "chats"), {
        orderId,
        senderId: "SYSTEM",
        senderName: "System Guard",
        text: "🎉 Buyer confirmed delivery. Escrow funds released to Seller's Wallet payout balance.",
        isSystemMessage: true,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error releasing funds:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Raise Escrow Dispute
  const handleRaiseDispute = async () => {
    if (
      !confirm(
        "Raise an escrow dispute? An admin mediator will join this chat log."
      )
    )
      return;

    setIsProcessing(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      await setDoc(
        orderRef,
        {
          status: "DISPUTED",
          disputedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "chats"), {
        orderId,
        senderId: "SYSTEM",
        senderName: "System Guard",
        text: "🚨 Order DISPUTED by Buyer. Vault frozen. AssetXtack Mediator assigned.",
        isSystemMessage: true,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error raising dispute:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Terminal COMPLETED State Banner */}
      {order?.status === "COMPLETED" && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-400 w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-[#EDEFF2]">
                {isBuyer ? "Order Completed & Escrow Released" : "Trade Settled & Funds Credited"}
              </h4>
              <p className="text-xs text-[#8A93A3] mt-0.5">
                {isBuyer
                  ? "You have confirmed delivery. Escrow funds have been permanently released to the seller."
                  : `Buyer confirmed delivery. ₦${(order?.amount || 0).toLocaleString()} has been credited to your payout wallet.`}
              </p>
            </div>
          </div>

          {isSeller && (
            <Link
              href="/wallet"
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 shrink-0"
            >
              <Wallet size={14} /> View Wallet
            </Link>
          )}
        </div>
      )}

      {/* Dynamic Order Header Banner */}
      <div className="p-6 bg-[#151922] border border-[#242938] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 font-semibold">
              Order #{orderId}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Status:{" "}
              {order?.status || "IN_ESCROW"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#EDEFF2] mt-2">
            {order?.title || "MLBB Account Escrow Trade"}
          </h1>
        </div>

        {/* Logical Action Controls */}
        <div className="flex items-center gap-3">
          {/* Seller Action: Deliver Credentials */}
          {(isSeller || !order?.sellerId) && (!order?.status || order?.status === "IN_ESCROW") && (
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#FFB020] hover:bg-[#ffa500] text-[#0B0E14] font-bold text-xs transition shadow-lg"
            >
              Submit Credentials / Deliver
            </button>
          )}

          {/* Buyer Action: Raise Dispute */}
          {isBuyer && (!order?.status || order?.status === "IN_ESCROW" || order?.status === "DELIVERED") && (
            <button
              onClick={handleRaiseDispute}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition disabled:opacity-50"
            >
              Raise Dispute
            </button>
          )}

          {/* Buyer Action: Confirm Delivery */}
          {isBuyer && order?.status === "DELIVERED" && (
            <button
              onClick={handleReleaseFunds}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0E14] font-bold text-xs transition shadow-lg disabled:opacity-50"
            >
              Confirm Delivery & Release Funds
            </button>
          )}

          {/* Terminal Badges */}
          {order?.status === "COMPLETED" && (
            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Order Completed & Paid
            </span>
          )}

          {order?.status === "DISPUTED" && (
            <span className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Escrow Frozen (In Dispute)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Details Sidebar + Live Trade Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          
          {/* Delivered Credentials Box for Buyer */}
          {isBuyer && order?.credentials && (
            <div className="p-5 bg-[#151922] border border-[#FFB020]/30 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-[#FFB020]">
                <KeyRound size={16} />
                <h3 className="text-xs uppercase font-extrabold tracking-wider">
                  Delivered Account Credentials
                </h3>
              </div>
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#242938] font-mono text-xs text-amber-300 select-all whitespace-pre-wrap break-all">
                {order.credentials}
              </div>
              <p className="text-[11px] text-[#8A93A3]">
                Please verify login details in-game before clicking &quot;Confirm Delivery & Release Funds&quot;.
              </p>
            </div>
          )}

          {/* Transaction Metadata */}
          <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-[#EDEFF2] border-b border-[#242938] pb-3">
              Transaction Details
            </h3>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8A93A3]">Total Escrow Amount</span>
              <span className="font-mono font-bold text-[#EDEFF2]">
                ₦{order?.amount?.toLocaleString() || "185,000"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8A93A3]">Seller</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#FFB020] font-medium">
                  @{order?.sellerName || "IyereStore"}
                </span>
                
                {/* KYC Verification Badge */}
                {isSellerVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <AlertTriangle size={12} /> Unverified
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8A93A3]">Vault Protection</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> 24-Hour Hold
              </span>
            </div>
          </div>

          {/* Sentinel Security & Caution Banner */}
          <div className="p-4 bg-[#151922]/60 border border-[#242938] rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#FFB020] shrink-0 mt-0.5" />
            <p className="text-xs text-[#8A93A3] leading-relaxed">
              {!isSellerVerified && (
                <strong className="block text-amber-400 mb-1">
                  Caution: Unverified Seller
                </strong>
              )}
              Never share account passwords or accept payments outside AssetXtack. All trade logs are monitored by Sentinel Security.
            </p>
          </div>
        </div>

        {/* Live Trade Chat Module */}
        <div className="lg:col-span-7">
          <TradeChat
            orderId={orderId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            orderStatus={order?.status || "IN_ESCROW"}
          />
        </div>
      </div>

      {/* Delivery Modal Component */}
      <DeliveryModal
        orderId={orderId}
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
    </div>
  );
}