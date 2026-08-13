"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Updated to direct to your actual listings page
        router.push("/listings"); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-between items-center py-8 px-4">
      {/* Header with Logo only */}
      <header className="w-full max-w-6xl flex justify-between items-center py-2">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Asset<span className="text-amber-500">Xtack</span>
        </Link>
      </header>

      {/* Sign-in Form */}
      <main className="w-full max-w-md my-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to AssetXtack</h1>
          <p className="text-gray-400 text-sm">
            Sign in or create an account to buy and sell safely.
          </p>
        </div>

        <div className="bg-[#121722] border border-gray-800/80 rounded-2xl p-6 shadow-2xl">
          <button
            onClick={() => {
              /* Google Sign-In Logic */
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all"
          >
            Continue with Google
          </button>
        </div>
      </main>

      <footer className="text-xs text-gray-500">
        No password needed — we'll email you a secure sign-in link.
      </footer>
    </div>
  );
}