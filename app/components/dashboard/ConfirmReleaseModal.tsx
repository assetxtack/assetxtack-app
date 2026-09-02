"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, X, Loader2 } from "lucide-react";

interface ConfirmReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  orderTitle?: string;
  amount?: number;
}

const CONFIRMATION_PHRASE = "CONFIRM CREDENTIALS";

export default function ConfirmReleaseModal({
  isOpen,
  onClose,
  onConfirm,
  orderTitle,
  amount,
}: ConfirmReleaseModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmed = inputValue.trim().toUpperCase() === CONFIRMATION_PHRASE;

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setIsReleasing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isReleasing) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isReleasing, onClose]);

  if (!isOpen) return null;

  const handleRelease = async () => {
    if (!isConfirmed || isReleasing) return;
    setIsReleasing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to release escrow funds:", error);
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isReleasing) onClose();
      }}
    >
      <div className="bg-[#12131a] border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <ShieldAlert size={18} className="text-amber-400" />
            </div>
            <h2 className="text-sm font-bold text-[#EDEFF2]">Release Escrow Funds</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isReleasing}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-5">
          <p className="text-xs text-rose-300 leading-relaxed">
            Confirm that you have logged in and verified the delivered account credentials.
            This action cannot be undone. Funds will be permanently released to the seller.
          </p>
        </div>

        {orderTitle && (
          <div className="mb-4 p-3 bg-[#0B0E14] border border-gray-800 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Order</span>
              <span className="text-[#EDEFF2] font-medium truncate ml-2">{orderTitle}</span>
            </div>
            {amount !== undefined && (
              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-gray-500">Amount to release</span>
                <span className="text-emerald-400 font-mono font-bold">₦{Number(amount).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Type <span className="text-amber-400 font-mono font-bold">{CONFIRMATION_PHRASE}</span> to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={CONFIRMATION_PHRASE}
            disabled={isReleasing}
            className="w-full bg-[#0B0E14] border border-gray-700 rounded-xl px-4 py-3 text-xs text-[#EDEFF2] font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500 disabled:opacity-50 transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isConfirmed && !isReleasing) {
                handleRelease();
              }
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isReleasing}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRelease}
            disabled={!isConfirmed || isReleasing}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-[#0B0E14] font-bold text-xs hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isReleasing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Releasing...
              </>
            ) : (
              "Release Escrow Funds"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
