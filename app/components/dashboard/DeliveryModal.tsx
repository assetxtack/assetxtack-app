"use client";

import { useState } from "react";
import { ShieldCheck, Key, X, Mail, Lock, FileText } from "lucide-react";

interface DeliveryModalProps {
  orderId: string;
  buyerId: string;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryModal({ orderId, buyerId, sellerId, isOpen, onClose }: DeliveryModalProps) {
  const [moontonEmail, setMoontonEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [transferCode, setTransferCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const buildCredentialsBlob = () => {
    const parts = [
      moontonEmail ? `Moonton Email: ${moontonEmail}` : "",
      password ? `Password: ${password}` : "",
      recoveryEmail ? `Recovery Email: ${recoveryEmail}` : "",
      transferCode ? `Transfer Code: ${transferCode}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    const blob = buildCredentialsBlob();
    if (!blob.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            buyerId,
            sellerId,
            credentials: blob,
            deliveryNotes: notes,
          }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deliver credentials");
      }

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
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Key className="w-4 h-4" /> Secure Account Delivery
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmitDelivery} className="p-5 space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Enter the account credentials below. Each field will be shown separately to the buyer with copy buttons.</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Moonton Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="email"
                  required
                  value={moontonEmail}
                  onChange={(e) => setMoontonEmail(e.target.value)}
                  placeholder="account@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Account Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Recovery Email / Gmail (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="recovery@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Transfer Code / PIN (Optional)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="text"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  placeholder="XYZ-123"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Additional Instructions (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-zinc-500" size={14} />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bound email password changed, check inbox."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
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

