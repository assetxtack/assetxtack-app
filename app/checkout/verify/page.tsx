import { Suspense } from "react";
import CheckoutVerifyClient from "./VerifyClient";

export default function CheckoutVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="p-12 bg-[#151922] border border-[#242938] rounded-2xl text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB020] mx-auto"></div>
            <p className="text-xs text-[#8A93A3]">Loading verification...</p>
          </div>
        </main>
      }
    >
      <CheckoutVerifyClient />
    </Suspense>
  );
}
