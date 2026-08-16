"use client";

import { useState } from "react";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldCheck, Key, AlertTriangle, X } from "lucide-react";

interface DeliveryModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryModal({ orderId, isOpen, onClose }: DeliveryModalProps) {
  const [credentials, setCredentials] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.trim()) return;

    setIsSubmitting(true);

    try {
      // 1. Update order status in Firestore
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "DELIVERED",
        deliveredAt: serverTimestamp(),
        credentialsSubmitted: credentials,
        deliveryNotes: notes,
      });

      // 2. Broadcast Escrow System Message
      await addDoc(collection(db, "chats"), {
        orderId,
        senderId: "SYSTEM",
        senderName: "System Guard",
        text: "🔒 Seller has submitted credentials & marked order as DELIVERED. Buyer inspection window is now ACTIVE.",
        isSystemMessage: true,
        createdAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error("Error submitting delivery:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Key className="w-4 h-4" /> Secure Account Delivery
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitDelivery} className="p-5 space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Credentials will be securely logged to the Vault. Buyer receives access immediately upon submission.</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Account Credentials (Login / Email / Password / Transfer Code)
            </label>
            <textarea
              required
              rows={3}
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g. Email: account@domain.com | Pass: ******* | Recovery Key: XYZ"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Additional Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bound email password changed, check inbox."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-xs transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Deliver Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}