"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and auto-redirect to dashboard
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard"); // Redirects directly to your dashboard
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-between items-center py-8 px-4">
      {/* Clean Header: Brand Logo Only */}
      <header className="w-full max-w-6xl flex justify-between items-center py-2">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Asset<span className="text-amber-500">Xtack</span>
        </Link>
      </header>

      {/* Main Sign-In Card */}
      <main className="w-full max-w-md my-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to AssetXtack</h1>
          <p className="text-gray-400 text-sm">
            Sign in or create an account to buy and sell safely.
          </p>
        </div>

        <div className="bg-[#121722] border border-gray-800/80 rounded-2xl p-6 shadow-2xl">
          {/* Continue with Google */}
          <button
            onClick={() => {
              /* Your Google Sign-In logic */
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <span className="relative bg-[#121722] px-3 text-xs text-gray-500 uppercase font-medium">
              OR
            </span>
          </div>

          {/* Email input and button */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 text-left">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full bg-[#0a0d14] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200"
            >
              Continue with email
            </button>
          </form>
        </div>
      </main>

      {/* Footer hint */}
      <footer className="text-xs text-gray-500">
        No password needed — we'll email you a secure sign-in link.
      </footer>
    </div>
  );
}