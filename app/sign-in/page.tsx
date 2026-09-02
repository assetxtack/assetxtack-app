"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!auth) return;

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // Ensure Google redirect sign-ins also sync user data to Firestore
          const googleUser = result.user;
          const userRef = doc(db, "users", googleUser.uid);
          await setDoc(userRef, {
            uid: googleUser.uid,
            email: googleUser.email || "",
            displayName: googleUser.displayName || "User",
            photoURL: googleUser.photoURL || "",
            phoneNumber: googleUser.phoneNumber || "",
            createdAt: new Date().toISOString(),
          }, { merge: true });

          setSuccess("Login successful! Redirecting...");
        }
      })
      .catch((err) => {
        const error = err as { message?: string; code?: string };
        const isNetworkError =
          error?.message?.includes("network") ||
          error?.message?.includes("fetch") ||
          error?.code === "auth/network-request-failed";
        const isStorageError = error?.message?.includes("Database") || error.code === "auth/internal-error";
        const isUserClosed = error.code === "auth/popup-closed-by-user";

        if (!isNetworkError && !isStorageError && !isUserClosed) {
          setError(error.message || "Google sign-in failed. Please try again.");
        }
      });
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please provide both email and password.");
      return;
    }

    if (!auth) {
      setError("Firebase Authentication is not initialized properly.");
      return;
    }

    setLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      const error = err as { code?: string; message?: string };
      const friendlyError =
        error.code === "auth/invalid-credential" || error.code === "auth/user-not-found"
          ? "Invalid email or password."
          : error.message || "Failed to log in. Please check your credentials.";
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Firebase Authentication is not initialized properly.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      let result;
      if (isMobile) {
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupErr) {
          const error = popupErr as { code?: string };
          if (
            error.code === "auth/popup-blocked" || 
            error.code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, provider);
            return;
          } else {
            throw popupErr;
          }
        }
      } else {
        result = await signInWithPopup(auth, provider);
      }

      if (result?.user) {
        const googleUser = result.user;
        const userRef = doc(db, "users", googleUser.uid);
        await setDoc(userRef, {
          uid: googleUser.uid,
          email: googleUser.email || "",
          displayName: googleUser.displayName || "User",
          photoURL: googleUser.photoURL || "",
          phoneNumber: googleUser.phoneNumber || "",
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      const error = err as { message?: string; code?: string };
      const isNetworkError =
        error?.message?.includes("network") ||
        error?.message?.includes("fetch") ||
        error?.code === "auth/network-request-failed";
      const isStorageError = error?.message?.includes("Database") || error.code === "auth/internal-error";
      const isUserClosed = error.code === "auth/popup-closed-by-user";

      if (!isNetworkError && !isStorageError && !isUserClosed) {
        setError(error.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address first.");
      return;
    }

    if (!auth) {
      setError("Firebase Authentication is not initialized properly.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccess("If an account with that email exists, a password reset link has been sent.");
    } catch (err) {
      const error = err as { code?: string; message?: string };
      const friendlyError =
        error.code === "auth/user-not-found"
          ? "If an account with that email exists, a password reset link has been sent."
          : error.message || "Failed to send reset email. Please try again.";
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl bg-[#141c2e]/90 p-8 shadow-2xl border border-slate-800/80 backdrop-blur-md">
        <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-white">
          Welcome Back
        </h2>
        <p className="mb-6 text-center text-sm font-medium text-slate-400">
          Sign in to access your AssetXtack Dashboard
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

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Or with email
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

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

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={loading}
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 disabled:opacity-50 transition"
          >
            Forgot Password?
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-amber-500 hover:text-amber-400 transition">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}