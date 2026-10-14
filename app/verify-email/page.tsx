"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { sendEmailVerification, applyActionCode, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    if (user.emailVerified) {
      router.replace("/dashboard");
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (db && auth?.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data()?.emailVerified === true) {
          clearInterval(intervalRef.current!);
          router.replace("/dashboard");
        }
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, router]);

  const handleResend = async () => {
    if (!auth || !auth.currentUser) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/verify-email`, handleCodeInApp: true });
      setSuccess("Verification email sent! Check your inbox (and spam folder).");
      setCooldown(60);

      const cooldownInterval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOobRedirect = async () => {
    if (typeof window !== "undefined") {
      const mode = new URLSearchParams(window.location.search).get("mode");
      if (mode === "verifyEmail") {
        const oobCode = new URLSearchParams(window.location.search).get("oobCode");
        const apiKey = new URLSearchParams(window.location.search).get("apiKey");
        if (oobCode && apiKey && auth) {
          try {
            let currentUser = auth.currentUser;
            if (!currentUser) {
              currentUser = await new Promise<User | null>((resolve) => {
                const unsub = onAuthStateChanged(auth, (u) => {
                  unsub();
                  resolve(u);
                });
              });
            }
            if (!currentUser) {
              setError("Unable to confirm your session. Please sign in again.");
              return;
            }
            await applyActionCode(auth, oobCode);
            if (db) {
              const userRef = doc(db, "users", currentUser.uid);
              await updateDoc(userRef, { emailVerified: true });
            }
            router.replace("/dashboard");
          } catch (err) {
            const error = err as { message?: string };
            setError(error.message || "Verification failed. The link may have expired.");
          }
        }
      }
    }
  };

  useEffect(() => {
    handleOobRedirect();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl bg-[#141c2e]/90 p-8 shadow-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-4">
            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
        </div>

        <p className="text-sm text-slate-300 text-center mb-6">
          We've sent a verification email to <span className="font-semibold text-amber-400">{user?.email}</span>.
          Please check your inbox and click the verification link to continue.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/20 text-center font-medium">
            {success}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="w-full rounded-lg bg-amber-500 py-3 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 mb-4"
        >
          {loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
        </button>

        <div className="text-center text-xs text-slate-400">
          Didn't receive the email? Check your spam folder or{" "}
          <Link href="/support" className="font-semibold text-amber-500 hover:text-amber-400 transition">
            contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
