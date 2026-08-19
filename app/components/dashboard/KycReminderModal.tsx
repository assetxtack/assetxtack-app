"use client";

import { useState } from "react";
import { X, ShieldCheck, ArrowRight } from "lucide-react";
import SellerKycModal from "@/app/components/SellerKycModal";

interface KycReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueUnverified: () => void;
}

export default function KycReminderModal({ isOpen, onClose, onContinueUnverified }: KycReminderModalProps) {
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleVerifyFirst = () => {
    setIsKycModalOpen(true);
  };

  const handleKycSuccess = () => {
    setIsKycModalOpen(false);
    onClose();
    onContinueUnverified();
  };

  const handleKycSkip = () => {
    setIsKycModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#141c2e] border border-slate-800/80 shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/30 flex items-center justify-center text-[#FFB020]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Boost Your Listing Trust with KYC</h2>
            <p className="text-xs text-slate-400 mt-0.5">Identity verification benefits</p>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-4 mb-6">
          <p className="text-sm text-[#EDEFF2] leading-relaxed">
            Verified sellers get <span className="text-emerald-400 font-semibold">instant escrow payouts</span>, top-tier marketplace placement, and lower buyer caution warnings. Unverified accounts can still post using the Standard Plan with standard payout processing times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleVerifyFirst}
            className="flex-1 py-3 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-sm hover:bg-[#ffa500] transition-colors flex items-center justify-center gap-2"
          >
            Verify Account First <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onContinueUnverified();
            }}
            className="flex-1 py-3 rounded-xl border border-[#242938] bg-[#0B0E14] text-[#EDEFF2] font-bold text-sm hover:border-[#FFB020]/50 transition-colors"
          >
            Continue as Unverified
          </button>
        </div>

        <SellerKycModal
          isOpen={isKycModalOpen}
          onClose={handleKycSkip}
          onSuccess={handleKycSuccess}
          onSkip={handleKycSkip}
        />
      </div>
    </div>
  );
}
