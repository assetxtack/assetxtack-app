"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreateListingModal from "@/app/components/dashboard/CreateListingModal";
import KycReminderModal from "@/app/components/dashboard/KycReminderModal";
import SellerKycModal from "@/app/components/SellerKycModal";
import type { AppUser } from "@/app/context/AuthContext";
import { SUPPORTED_GAMES, type Game } from "@/lib/constants/games";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKycReminderOpen, setIsKycReminderOpen] = useState(false);
  const [isSellerKycOpen, setIsSellerKycOpen] = useState(false);
  const isVerifiedSeller = Boolean((user as AppUser)?.isVerified);
  const hasOpenedModal = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (hasOpenedModal.current) return;
    if (!authLoading && user && selectedGame) {
      hasOpenedModal.current = true;
      setTimeout(() => {
        if (isVerifiedSeller) {
          setIsCreateModalOpen(true);
        } else {
          setIsKycReminderOpen(true);
        }
      }, 0);
    }
  }, [authLoading, user, selectedGame, isVerifiedSeller]);

  const handleClose = () => {
    setIsCreateModalOpen(false);
    router.push("/my-listings");
  };

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    router.push("/my-listings");
  };

  const handleContinueUnverified = () => {
    setIsKycReminderOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleVerifyKyc = () => {
    setIsKycReminderOpen(false);
    setIsSellerKycOpen(true);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b101b] text-white">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <section className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-black text-[#EDEFF2] font-[var(--font-display)]">Select Game to List</h1>
            <p className="text-base text-[#8A93A3] max-w-xl mx-auto">
              Choose the game for the publisher account you want to sell. You will be guided through account verification and secure credential handover.
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUPPORTED_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-[#151922] border border-[#242938] hover:border-[#FFB020]/40 rounded-2xl p-6 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#FFB020] bg-[#FFB020]/10 px-3 py-1 rounded-lg border border-[#FFB020]/20 font-[var(--font-mono)] uppercase tracking-wider">
                    {game.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#EDEFF2] mb-2 group-hover:text-[#FFB020] transition-colors">{game.name}</h3>
                <p className="text-xs text-[#8A93A3] leading-relaxed">
                  Attributes: {game.requiredAttributes.join(", ")}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        isVerifiedSeller={isVerifiedSeller}
        onVerifyKyc={handleVerifyKyc}
        selectedGame={selectedGame}
      />

      <KycReminderModal
        isOpen={isKycReminderOpen}
        onClose={() => setIsKycReminderOpen(false)}
        onContinueUnverified={handleContinueUnverified}
      />

      <SellerKycModal
        isOpen={isSellerKycOpen}
        onClose={() => setIsSellerKycOpen(false)}
        onSuccess={() => {
          setIsSellerKycOpen(false);
          setIsCreateModalOpen(true);
        }}
      />
    </div>
  );
}
