"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import CreateListingModal from "@/app/components/dashboard/CreateListingModal";
import KycReminderModal from "@/app/components/dashboard/KycReminderModal";
import SellerKycModal from "@/app/components/SellerKycModal";
import type { AppUser } from "@/app/context/AuthContext";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
    if (!authLoading && user) {
      hasOpenedModal.current = true;
      setTimeout(() => {
        if (isVerifiedSeller) {
          setIsCreateModalOpen(true);
        } else {
          setIsKycReminderOpen(true);
        }
      }, 0);
    }
  }, [authLoading, user, isVerifiedSeller]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        isVerifiedSeller={isVerifiedSeller}
        onVerifyKyc={handleVerifyKyc}
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
