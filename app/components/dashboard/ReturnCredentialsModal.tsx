"use client";

import { useState } from "react";
import { Key, X, Mail, Lock, ShieldCheck } from "lucide-react";

interface ReturnCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (credentials: string) => void;
  isProcessing: boolean;
}

export default function ReturnCredentialsModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: ReturnCredentialsModalProps) {
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [transferCode, setTransferCode] = useState("");

  if (!isOpen) return null;

  const buildCredentialsBlob = () => {
    const parts = [
      primaryEmail ? `Primary Email: ${primaryEmail}` : "",
      password ? `Password: ${password}` : "",
      recoveryEmail ? `Recovery Email: ${recoveryEmail}` : "",
      transferCode ? `Transfer Code: ${transferCode}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blob = buildCredentialsBlob();
    if (!blob.trim()) return;
    await onConfirm(blob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Key className="w-4 h-4" /> Return Credentials to Seller
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Enter the reverted account credentials below. These will be securely shared with the seller for verification during dispute resolution.</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Primary Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="email"
                  required
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  placeholder="account@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !primaryEmail || !password}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-900 hover:bg-amber-400 font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                  Returning...
                </>
              ) : (
                <>Return to Seller</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
