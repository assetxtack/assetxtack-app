"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, requiresEmailVerification } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && requiresEmailVerification) {
      router.replace("/verify-email");
    }
  }, [loading, user, requiresEmailVerification, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#0B0E14] flex items-center justify-center"
        role="status"
        aria-label="Checking your session"
      >
        <Loader2 size={36} className="animate-spin text-[#FFB020]" />
      </div>
    );
  }

  if (!user || requiresEmailVerification) {
    return null;
  }

  return <>{children}</>;
}
