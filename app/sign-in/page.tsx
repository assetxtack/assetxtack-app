"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirect signed-in users directly to the marketplace
        router.push("/marketplace");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome to AssetXtack</h1>
        <p className="text-gray-400 mb-8">Sign in or create an account to buy and sell safely.</p>

        <div className="bg-[#121722] border border-gray-800 rounded-2xl p-6 shadow-xl">
          {/* Sign-in buttons & forms go here */}
          <button 
            onClick={() => {
              /* Your Google Sign-In Handler */
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}