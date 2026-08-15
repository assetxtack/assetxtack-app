"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSuccess = () => {
    setSuccess("Login successful! Redirecting...");
    setError("");
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  useEffect(() => {
    // 1. Check redirect result when mobile returns from Google
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          handleSuccess();
        }
      })
      .catch((err) => {
        // Silently filter out browser storage warnings & user cancellations
        const isStorageError = err?.message?.includes("Database") || err?.code === "auth/internal-error";
        const isUserClosed = err?.code === "auth/popup-closed-by-user";

        if (!isStorageError && !isUserClosed) {
          setError(err.message || "Google sign-in failed. Please try again.");
        }
      });

    // 2. Active auth listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        handleSuccess();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      if (isMobile) {
        try {
          await signInWithPopup(auth, provider);
          handleSuccess();
        } catch (popupErr: any) {
          if (
            popupErr.code === "auth/popup-blocked" || 
            popupErr.code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      } else {
        await signInWithPopup(auth, provider);
        handleSuccess();
      }
    } catch (err: any) {
      const isStorageError = err?.message?.includes("Database") || err?.code === "auth/internal-error";
      const isUserClosed = err?.code === "auth/popup-closed-by-user";

      if (!isStorageError && !isUserClosed) {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
      {/* Main Glassmorphism/Dark Card */}
      <div className="w-full max-w-md rounded-2xl bg-[#141c2e]/90 p-8 shadow-2xl border border-slate-800/80 backdrop-blur-md">
        
        {/* Title & Subtitle */}
        <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-white">
          Welcome Back
        </h2>
        <p className="mb-6 text-center text-sm font-medium text-slate-400">
          Sign in to access your AssetXtack Dashboard
        </p>

        {/* Notifications */}
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

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-[#1e293b]/60 py-3 px-4 text-sm font-semibold text-white transition hover:bg-[#1e293b] hover:border-slate-600 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Divider Line */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Or with email
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign In with Email"}
          </button>
        </form>

      </div>
    </div>
  );
}