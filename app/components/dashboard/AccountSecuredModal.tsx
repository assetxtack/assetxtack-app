"use client";

import { useState } from "react";
import { ShieldAlert, X, CheckCircle2, AlertTriangle } from "lucide-react";

interface AccountSecuredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checklist: { assetIntegrity: boolean; credentialSecurity: boolean; noUnauthorizedBinding: boolean }) => Promise<void>;
  isProcessing: boolean;
}

export default function AccountSecuredModal({ isOpen, onClose, onConfirm, isProcessing }: AccountSecuredModalProps) {
  const [checks, setChecks] = useState([false, false, false]);

  const allChecked = checks.every(Boolean);

  const toggle = (index: number) => {
    setChecks((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" /> Account Secured Verification
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Disputes caused by inaccurate listings impact your seller trust score. Repeated listing errors will result in increased platform fee tiers (15%) or account suspension.</span>
          </div>

          <div className="space-y-3">
            {[
              "I have logged in and changed the password to a new secure string.",
              "I have verified no unauthorized third-party emails, phone numbers, or social links remain attached.",
              "I have inspected the account inventory and verified all diamonds, ranks, and assets are intact.",
            ].map((text, index) => (
              <label key={index} className="flex items-start gap-2.5 p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks[index]}
                  onChange={() => toggle(index)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-[11px] text-zinc-300 leading-relaxed">{text}</span>
              </label>
            ))}
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
              type="button"
              onClick={() =>
                onConfirm({
                  assetIntegrity: checks[0],
                  credentialSecurity: checks[1],
                  noUnauthorizedBinding: checks[2],
                })
              }
              disabled={isProcessing || !allChecked}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Confirm & Authorize Refund
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
