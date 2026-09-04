"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AuthGuard from "../../components/AuthGuard";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function CheckoutVerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const trxref = searchParams.get("trxref");

      if (!trxref) {
        setStatus("error");
        setMessage("Missing payment reference. Please contact support if your payment was successful.");
        return;
      }

      try {
        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: trxref }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStatus("error");
          setMessage(data.error || "Payment verification failed. Please contact support.");
          return;
        }

        const metadata = data.metadata || {};
        const listingId = metadata.listingId as string | undefined;
        const buyerId = metadata.buyerId as string | undefined;

        if (!listingId || !buyerId || !user?.uid) {
          setStatus("error");
          setMessage("Payment verified, but order context is missing. Please contact support.");
          return;
        }

        if (buyerId !== user.uid) {
          setStatus("error");
          setMessage("This payment does not belong to your account.");
          return;
        }

        const listingSnap = await getDoc(doc(db, "listings", listingId));
        if (!listingSnap.exists()) {
          setStatus("error");
          setMessage("Listing not found. Please contact support.");
          return;
        }

        const listingData = listingSnap.data() as Record<string, unknown>;
        const sellerId = String(listingData.sellerId || "");
        const sellerName = String(listingData.sellerName || listingData.seller || "Seller");

        if (sellerId === user.uid) {
          setStatus("error");
          setMessage("You cannot purchase your own listing.");
          return;
        }

        const createResponse = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            title: listingData.title,
            amount: listingData.price,
            sellerName,
            sellerId,
            sellerVerified: Boolean(listingData.sellerVerified),
            hasShieldProtection: Boolean(listingData.hasShieldProtection ?? listingData.sellerVerified),
            listingPlan: String(listingData.listingPlan || (Boolean(listingData.hasShieldProtection) ? "shield" : "standard")),
            buyerId: user.uid,
            rank: listingData.rank,
            skinsCount: listingData.skins ?? listingData.skinsCount ?? 0,
            paymentReference: trxref,
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok || !createData.success) {
          setStatus("error");
          setMessage(createData.error || "Order creation failed. Please contact support.");
          return;
        }

        setStatus("success");
        setMessage("Payment verified and order created successfully!");
        setTimeout(() => {
          router.push(`/orders/${createData.orderId}`);
        }, 2000);
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification. Please contact support.");
      }
    };

    verifyPayment();
  }, [searchParams, router, user]);

  return (
    <AuthGuard>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="p-12 bg-[#151922] border border-[#242938] rounded-2xl text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 size={48} className="animate-spin text-[#FFB020] mx-auto" />
              <p className="text-xs text-[#8A93A3]">Verifying your payment...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="text-emerald-400 mx-auto" size={48} />
              <h1 className="text-lg font-bold text-[#EDEFF2]">Payment Verified</h1>
              <p className="text-xs text-[#8A93A3]">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <AlertTriangle className="text-rose-400 mx-auto" size={48} />
              <h1 className="text-lg font-bold text-[#EDEFF2]">Verification Failed</h1>
              <p className="text-xs text-[#8A93A3]">{message}</p>
              <button
                onClick={() => router.push("/marketplace")}
                className="px-4 py-2 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-xs"
              >
                Back to Marketplace
              </button>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
