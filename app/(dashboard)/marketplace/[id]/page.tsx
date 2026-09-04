"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../components/AuthGuard";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Star, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  Lock, 
  Layers, 
  Award, 
  UserCheck, 
  Smartphone,
  Check,
  FileText,
  Image as ImageIcon,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CreditCard,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { initializePaystackTransaction } from "@/lib/paystack";

function XMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6L20 18" stroke="#FFB020" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 6L4 18" stroke="#7C5CFC" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 3.5L20 6L16 8.5" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 15.5L4 18L8 20.5" stroke="#7C5CFC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 font-[var(--font-display)] font-bold text-[#EDEFF2] hover:opacity-90 transition-opacity shrink-0"
      style={{ fontSize: size }}
    >
      Asset
      <span className="inline-flex translate-y-[2px]">
        <XMark size={size * 0.95} />
      </span>
      tack
    </Link>
  );
}

type Listing = {
  id: string;
  title?: string;
  price?: number;
  seller?: string;
  sellerName?: string;
  sellerId?: string;
  sellerVerified?: boolean;
  hasShieldProtection?: boolean;
  listingPlan?: string;
  sellerRating?: string | number;
  rank?: string;
  skins?: number;
  skinsCount?: number;
  heroes?: number;
  heroesCount?: number;
  featuredSkins?: string[];
  platform?: string;
  loginProvider?: string;
  gameId?: string;
  gameName?: string;
  gameAttributes?: Record<string, string | number | boolean>;
  credentials?: Record<string, unknown>;
  status?: string;
  images?: string[];
  description?: string;
  winRate?: string;
  emblemsMax?: number;
};

const formatAttributeLabel = (attr: string) => {
  return attr
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Format credential key to readable label
 * e.g., "tiktokBoundStatus" -> "TikTok Bound Status"
 */
const formatCredentialLabel = (key: string) => {
  // Handle specific known keys
  if (key === "vkBoundStatus") return "VKontakte (VK) Status";
  if (key === "facebookBoundStatus") return "Facebook Account Status";
  if (key === "tiktokBoundStatus") return "TikTok Account Status";
  if (key === "linkedAccount") return "Linked Account";
  if (key === "moontonStatus") return "Moonton Account Status";
  if (key === "riotAccountStatus") return "Riot Account Status";
  if (key === "steamStatus") return "Steam Account Status";
  if (key === "epicGamesStatus") return "Epic Games Status";
  if (key === "supercellIdStatus") return "Supercell ID Status";
  if (key === "emailChangeAvailability") return "Email Change Availability";
  if (key === "linkedSocials") return "Linked Socials";
  if (key === "ownershipType") return "Account Ownership";
  if (key === "region") return "Region";
  if (key === "primeStatus") return "Prime Status";
  if (key === "platform") return "Platform";
  
  // Fallback: convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Determine styling color based on credential value
 * Green for Unbound/Clean, Amber/Yellow for Bound/Warning
 */
const getSecurityStatusColor = (value: unknown): string => {
  if (!value) return "text-[#8A93A3]"; // Default gray for empty
  
  const valueStr = String(value).toLowerCase();
  
  // Check for unbound/clean status
  if (valueStr.includes("unbound") || valueStr.includes("clean") || valueStr.includes("available")) {
    return "text-emerald-400";
  }
  
  // Check for bound/warning status
  if (valueStr.includes("bound") || valueStr.includes("handing") || valueStr.includes("not available") || valueStr.includes("pending")) {
    return "text-amber-400";
  }
  
  // Default fallback
  return "text-[#EDEFF2]";
};

/**
 * Get security status icon based on value
 */
const getSecurityStatusIcon = (value: unknown) => {
  if (!value) return <Check size={14} />;
  
  const valueStr = String(value).toLowerCase();
  
  if (valueStr.includes("unbound") || valueStr.includes("clean") || valueStr.includes("available")) {
    return <Check size={14} />;
  }
  
  if (valueStr.includes("bound") || valueStr.includes("handing") || valueStr.includes("not available") || valueStr.includes("pending")) {
    return <AlertTriangle size={14} />;
  }
  
  return <Check size={14} />;
};

/**
 * Filter out sensitive credential keys that should never be rendered
 */
const excludedCredentialKeys = [
  "accountPassword",
  "secondaryPassword",
  "primaryPassword",
  "password",
  "email",
  "accountEmail",
  "primaryEmail",
];

const shouldExcludeCredential = (key: string): boolean => {
  return excludedCredentialKeys.some((excluded) => key.toLowerCase().includes(excluded));
};

export default function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "binds" | "gallery">("overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBuying, setIsBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasedListingIds, setPurchasedListingIds] = useState<Set<string>>(new Set());
  const [verifiedPayments, setVerifiedPayments] = useState<Set<string>>(new Set());
  const [paystackEmail, setPaystackEmail] = useState("");
  const [paystackPhone, setPaystackPhone] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentModalLocked, setPaymentModalLocked] = useState(false);
  const [currentPaymentReference, setCurrentPaymentReference] = useState<string | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (!resolvedParams?.id) return;
    const ref = doc(db, "listings", resolvedParams.id);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = snapshot.data() as Omit<Listing, "id">;
      setListing({ id: snapshot.id, ...data });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listing:", error);
      setNotFound(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resolvedParams?.id]);

  useEffect(() => {
    if (!listing?.sellerId) return;
    const q = query(collection(db, "reviews"), where("sellerId", "==", listing.sellerId));
    const unsubReviews = onSnapshot(q, (snap) => {
      const reviews = snap.docs.map((d) => d.data());
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, r) => sum + Number((r as { rating?: number }).rating || 0), 0);
        setSellerRating(Number((total / reviews.length).toFixed(1)));
      } else {
        setSellerRating(null);
      }
    }, (err) => {
      console.error("Error fetching seller reviews:", err);
    });

    return () => {
      unsubReviews();
    };
  }, [listing?.sellerId]);

  useEffect(() => {
    return () => {
      setPaymentModalLocked(false);
      setPaymentProcessing(false);
      setCurrentPaymentReference(null);
    };
  }, []);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePaystackFee = (amount: number) => {
    if (amount <= 0) return { fee: 0, total: 0 };
    const fee = amount * 0.015 + (amount >= 2500 ? 100 : 0);
    const cappedFee = Math.min(fee, 2000);
    return { fee: Math.round(cappedFee), total: amount + Math.round(cappedFee) };
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const initiatePayment = () => {
    if (!user?.uid || !listing) return;
    if (listing.sellerId === user.uid) {
      setPurchaseError("You cannot buy your own listing.");
      return;
    }
    if (purchasedListingIds.has(listing.id)) {
      setPurchaseError("You have already purchased this account.");
      return;
    }
    setShowPaymentModal(true);
    setPurchaseError(null);
    setPaymentModalLocked(false);
    if (user.email) setPaystackEmail(user.email);
  };

  const handlePaystackPayment = async () => {
    if (!paystackEmail || !listing) return;
    if (paymentModalLocked) return;
    
    setPaymentProcessing(true);
    setPurchaseError(null);
    setPaymentModalLocked(true);

    try {
      const amountToCharge = calculatePaystackFee(listing.price || 0).total;
      const reference = `AX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCurrentPaymentReference(reference);
      
      const result = await initializePaystackTransaction({
        email: paystackEmail,
        amount: amountToCharge,
        reference,
        metadata: {
          listingId: listing.id,
          buyerId: user!.uid,
          sellerId: listing.sellerId,
          custom_fields: [
            { display_name: "Listing", variable_name: "listing_id", value: listing.id },
            { display_name: "Buyer", variable_name: "buyer_id", value: user!.uid },
          ],
        },
      });

      window.open(result.authorizationUrl, "_blank", "width=600,height=700,noopener,noreferrer");
      
      const verifyPayment = async () => {
        if (verifiedPayments.has(reference) || paymentProcessing) return;

        try {
          const verificationResponse = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference, listingId: listing.id }),
          });

          const verificationData = await verificationResponse.json();

          if (verificationData.success) {
            setVerifiedPayments((prev) => new Set(prev).add(reference));

            if (!user?.uid || !listing) {
              setPurchaseError("Session expired. Please refresh and try again.");
              setPaymentProcessing(false);
              setPaymentModalLocked(false);
              return;
            }

            try {
              const sellerName = listing.seller || listing.sellerName || "Seller";

              const createResponse = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                listingId: listing.id,
                title: listing.title,
                amount: listing.price,
                sellerName,
                sellerId: listing.sellerId,
                sellerVerified: listing.sellerVerified ?? false,
                hasShieldProtection: listing.hasShieldProtection ?? listing.sellerVerified ?? false,
                listingPlan: listing.listingPlan || (listing.hasShieldProtection ? "shield" : "standard"),
                buyerId: user.uid,
                rank: listing.rank,
                skinsCount: listing.skins ?? listing.skinsCount ?? 0,
                paymentReference: reference,
              }),
              });

              const createData = await createResponse.json();

              if (!createResponse.ok || !createData.success) {
                const errorMsg = createData.error || createData.details || "Failed to create order";
                console.error("Order creation failed. API error:", createData.error, "Full response:", createData);
                throw new Error(errorMsg);
              }

              setShowPaymentModal(false);
              setPurchasedListingIds((prev) => new Set(prev).add(listing.id));
            } catch (dbError) {
              const errorMessage = dbError instanceof Error ? dbError.message : "Unknown error";
              console.error("Failed to create order after payment:", dbError);
              setPurchaseError(`Payment verified, but order creation failed: ${errorMessage}. Please contact support with your reference.`);
            } finally {
              setPaymentProcessing(false);
              setPaymentModalLocked(false);
              setCurrentPaymentReference(null);
            }
          } else if (verificationData.error) {
            setPurchaseError(verificationData.error);
            setPaymentProcessing(false);
            setPaymentModalLocked(false);
            setCurrentPaymentReference(null);
          }
        } catch {
          // silent fail; user can retry by switching back to this tab
        }
      };

      const handleFocus = () => {
        window.removeEventListener("focus", handleFocus);
        void verifyPayment();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    } catch (error) {
      console.error("Payment initialization failed:", error);
      const message = error instanceof Error ? error.message : "Payment gateway failed. Please refresh and try again.";
      setPurchaseError(message);
      setPaymentProcessing(false);
      setPaymentModalLocked(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#FFB020] mx-auto" />
            <p className="text-xs text-[#8A93A3]">Loading listing details...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (notFound || !listing) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 p-8 bg-[#151922] border border-rose-500/30 rounded-2xl max-w-md">
            <ShieldAlert className="mx-auto text-rose-400" size={40} />
            <h1 className="text-lg font-bold text-[#EDEFF2]">Listing not found</h1>
            <p className="text-xs text-[#8A93A3]">This account may have been sold or removed from the marketplace.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-bold text-[#FFB020] hover:underline bg-[#FFB020]/10 px-4 py-2 rounded-xl border border-[#FFB020]/20">
              <ArrowLeft size={14} /> Back to marketplace
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isProtected = listing.sellerVerified;
  const screenshots = listing.images && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
  ];

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Payment Preview Modal */}
        {showPaymentModal && listing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#151922] border border-[#242938] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn">
              <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" /> Confirm Order Details
                </div>
                <button 
                  onClick={() => !paymentModalLocked && setShowPaymentModal(false)} 
                  disabled={paymentModalLocked}
                  className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Review the account details below before paying. Credentials will only be revealed after successful payment.</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A93A3]">Account</span>
                    <span className="text-xs font-bold text-[#EDEFF2] text-right max-w-[70%]">{listing.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A93A3]">Rank</span>
                    <span className="text-xs font-bold text-[#EDEFF2]">{listing.rank || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A93A3]">Skins</span>
                    <span className="text-xs font-bold text-[#FFB020]">{listing.skins ?? listing.skinsCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A93A3]">Seller</span>
                    <Link href={`/seller/${listing.sellerId}`} className="text-xs font-bold text-[#EDEFF2] hover:text-[#FFB020] transition-colors">
                      @{listing.sellerName || listing.seller || "Seller"}
                    </Link>
                  </div>
                  <div className="border-t border-[#242938] pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8A93A3]">Account Price</span>
                      <span className="text-xs font-bold text-[#EDEFF2]">{formatNaira(listing.price || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8A93A3]">Payment Gateway Fee</span>
                      <span className="text-xs font-bold text-[#EDEFF2]">{formatNaira(calculatePaystackFee(listing.price || 0).fee)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#242938]">
                      <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider">You will be charged</span>
                      <span className="text-lg font-black text-emerald-400">{formatNaira(calculatePaystackFee(listing.price || 0).total)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3">
                    <input
                      type="checkbox"
                      id="fee-agreement"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                    />
                    <label htmlFor="fee-agreement" className="text-[11px] text-zinc-400 leading-relaxed">
                      I understand and agree that the Payment Gateway Fee ({formatNaira(calculatePaystackFee(listing.price || 0).fee)}) is non-refundable in the event of an order cancellation, dispute, or refund.
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Email for receipt</label>
                  <input
                    type="email"
                    value={paystackEmail}
                    onChange={(e) => setPaystackEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={paystackPhone}
                    onChange={(e) => setPaystackPhone(e.target.value)}
                    placeholder="080XXXXXXXX"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {purchaseError && (
                  <p className="text-[11px] text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                    {purchaseError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={paymentModalLocked}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaystackPayment}
                    disabled={paymentProcessing || !paystackEmail || !isAgreed}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} /> Confirm & Pay
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8A93A3] hover:text-[#EDEFF2] transition-colors bg-[#151922] px-3.5 py-2 rounded-xl border border-[#242938]"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>

          <span className="text-xs font-semibold text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
            Listing ID: <strong className="text-[#EDEFF2]">{listing.id}</strong>
          </span>
        </div>

        {/* Brand Header */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl p-5 flex items-center justify-between">
          <Wordmark size={20} />
          <div className="flex items-center gap-2">
            {listing.sellerId === user?.uid && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Lock size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Your Listing</span>
              </div>
            )}
            {isProtected ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020]">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Shield Protected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8A93A3]/10 border border-[#8A93A3]/20 text-[#8A93A3]">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Standard Listing</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Account Title Banner */}
            <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
               
                <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[#0B0E14] px-3 py-1.5 rounded-xl border border-[#242938]">
                  <Link href={`/seller/${listing.sellerId}`} className="text-xs font-bold text-[#EDEFF2] hover:text-[#FFB020] transition-colors">
                    {listing.sellerName || listing.seller || "Seller"}
                  </Link>
                  {isProtected ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Unverified Seller
                      </span>
                    )}
                    <span className="text-xs text-[#8A93A3]">|</span>
                     <div className="flex items-center gap-1 text-xs font-bold text-[#FFB020]">
                       <Star size={12} fill="#FFB020" /> {sellerRating !== null ? sellerRating.toFixed(1) : (listing.sellerRating || "5.0")}
                     </div>
                  </div>
                </div>

              <h1 className="font-extrabold text-xl md:text-2xl text-[#EDEFF2] leading-snug">
                {listing.title}
              </h1>

              {/* Quick Specs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
                  <Smartphone size={14} className="text-[#FFB020]" />
                  <span>Platform: <strong className="text-[#EDEFF2]">{listing.loginProvider || listing.platform || "Standard"}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
                  <KeyRound size={14} className="text-emerald-400" />
                  <span>Credentials Status: <strong className="text-emerald-400">Vault Verified & Ready</strong></span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#242938] pb-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <FileText size={14} /> Overview & Specs
              </button>
              <button
                onClick={() => setActiveTab("binds")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "binds"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <KeyRound size={14} /> Binds & Security Info
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "gallery"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <ImageIcon size={14} /> Screenshots ({screenshots.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Rank</span>
                    <strong className="text-sm md:text-base font-extrabold text-[#EDEFF2] block mt-1">{listing.rank || "N/A"}</strong>
                  </div>
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Price</span>
                    <strong className="text-sm md:text-base font-extrabold text-emerald-400 block mt-1">₦{(listing.price || 0).toLocaleString()}</strong>
                  </div>
                  {listing.gameAttributes && Object.entries(listing.gameAttributes).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">{formatAttributeLabel(key)}</span>
                      <strong className="text-sm md:text-base font-extrabold text-[#FFB020] block mt-1">{String(value)}</strong>
                    </div>
                  ))}
                  {(!listing.gameAttributes || Object.keys(listing.gameAttributes).length === 0) && (
                    <>
                      <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                        <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Skins Count</span>
                        <strong className="text-sm md:text-base font-extrabold text-[#FFB020] block mt-1">{listing.skins ?? listing.skinsCount ?? 0}</strong>
                      </div>
                      <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                        <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Win Rate</span>
                        <strong className="text-sm md:text-base font-extrabold text-emerald-400 block mt-1">{listing.winRate || "N/A"}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Featured Rare Skins */}
                {Array.isArray(listing.featuredSkins) && listing.featuredSkins.length > 0 && (
                  <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
                    <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                      <Sparkles size={16} className="text-[#FFB020]" /> Featured Rare Skins & Items
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {listing.featuredSkins.map((skin, idx) => (
                        <div
                          key={idx}
                          className="bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 text-[#9d85fc] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                        >
                          <Award size={14} className="text-[#FFB020]" /> {skin}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller Description */}
                <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-[#EDEFF2]">Seller Notes</h3>
                  <p className="text-xs text-[#8A93A3] leading-relaxed">
                     {listing.description || "Maintained account with full in-game assets, high performance, clean email transfer, and zero sanctions. Complete login control (Publisher account + dedicated recovery email) handed over immediately upon Escrow deposit lock."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "binds" && (
              <div className="bg-gradient-to-br from-[#0B2F1F] via-[#0D3D26] to-[#0A2818] border border-emerald-500/40 p-6 rounded-2xl space-y-4 shadow-lg shadow-emerald-500/10">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg uppercase tracking-wider text-emerald-400">
                    ⚡ ACCOUNT BIND & SECURITY CHECKLIST
                  </h3>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"></div>
                </div>
                
                <div className="space-y-2 pt-2">
                  {(() => {
                    // Filter and map credentials from listing.credentials
                    const credentials = listing?.credentials || {};
                    const securityEntries = Object.entries(credentials)
                      .filter(([key]) => !shouldExcludeCredential(key))
                      .map(([key, value]) => ({ key, value }));
                    
                    // Empty state fallback
                    if (securityEntries.length === 0) {
                      return (
                        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all">
                          <span className="text-xs font-bold uppercase tracking-wide text-emerald-300">✓ STANDARD SECURITY TRANSFER</span>
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Check size={14} /> NO BIND DATA
                          </span>
                        </div>
                      );
                    }
                    
                    // Dynamic rendering of security entries
                    return securityEntries.map(({ key, value }) => {
                      const displayLabel = formatCredentialLabel(key);
                      const displayValue = String(value || "Not Specified").toUpperCase();
                      const statusColor = getSecurityStatusColor(value);
                      const statusIcon = getSecurityStatusIcon(value);
                      const isGreenStatus = statusColor === "text-emerald-400";
                      
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isGreenStatus
                              ? "bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500/60"
                              : "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#E8F5E9]">
                            {displayLabel}
                          </span>
                          <span className={`text-xs font-bold flex items-center gap-1.5 tracking-wide ${
                            isGreenStatus ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            {statusIcon} {displayValue}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
               
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#FFB020]" /> Verified Screenshots ({screenshots.length})
                  </h3>
                  <span className="text-xs font-semibold text-[#8A93A3]">
                    Showing {activeImageIndex + 1} of {screenshots.length}
                  </span>
                </div>

                {/* Main Large Image Viewer */}
                <div className="relative w-full h-[320px] md:h-[420px] bg-[#0B0E14] rounded-2xl border border-[#242938] overflow-hidden group">
                  <img 
                    src={screenshots[activeImageIndex]} 
                    alt={`Screenshot ${activeImageIndex + 1}`} 
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 hover:bg-[#FFB020] hover:text-[#0B0E14] text-white p-2 rounded-xl transition-all border border-[#242938]"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 hover:bg-[#FFB020] hover:text-[#0B0E14] text-white p-2 rounded-xl transition-all border border-[#242938]"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div className="absolute top-3 left-3 bg-[#0B0E14]/70 backdrop-blur-md text-[10px] text-[#FFB020] font-extrabold px-2.5 py-1 rounded-lg border border-[#FFB020]/20 flex items-center gap-1">
                    <ShieldCheck size={12} /> AssetXtack Verified
                  </div>
                </div>

                {/* Scrollable Thumbnail Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#FFB020]">
                  {screenshots.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-20 h-14 rounded-xl border-2 overflow-hidden transition-all ${
                        activeImageIndex === idx
                          ? "border-[#FFB020] scale-105 shadow-md shadow-[#FFB020]/20"
                          : "border-[#242938] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold bg-[#0B0E14]/80 px-1 rounded text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Escrow Guarantee Banner */}
            <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
              {listing.sellerId === user?.uid ? (
                <>
                  <h3 className="font-bold text-sm text-[#EDEFF2]">
                    🛡️ Seller Payout Guarantee
                  </h3>
                  <p className="text-xs text-[#8A93A3]">
                    Your login credentials are protected in vault and only released once buyer payment is verified. Buyers must complete verification before escrow funds are released to your wallet.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                    <Lock size={16} className="text-emerald-400" /> AssetXtack Vault Protection
                  </h3>
                  <p className="text-xs text-[#8A93A3]">
                    Funds are held securely in escrow. Seller credentials (email and password) are released to you immediately after your deposit is locked. If the credentials don&apos;t match the listing description, your funds are refunded 100%.
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Right Column: Checkout Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 space-y-6">
               
                <div>
                  <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider block">Escrow Price</span>
                  <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
                    {formatNaira(listing.price || 0)}
                  </div>
                  <p className="text-[11px] text-[#8A93A3] mt-1">
                    Funds held securely in vault until credential transfer is verified by you.
                  </p>
                </div>

                {!listing.sellerVerified && listing.sellerId !== user?.uid && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <strong className="font-bold text-amber-400 block mb-0.5">⚠️ Unverified Seller</strong>
                      <span className="text-amber-300/90 leading-relaxed">
                        This seller has not completed identity verification (KYC). Please review listing screenshots carefully and verify account credentials thoroughly during the escrow handover phase before confirming order release.
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    onClick={initiatePayment}
                    disabled={isBuying || purchasedListingIds.has(listing.id) || listing.sellerId === user?.uid}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FFB020] to-[#ffa500] text-[#0B0E14] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFB020]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBuying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Locking Funds...
                      </>
                    ) : purchasedListingIds.has(listing.id) ? (
                      <>
                        <CheckCircle2 size={16} /> Purchased
                      </>
                    ) : listing.sellerId === user?.uid ? (
                      <>
                        <Lock size={16} /> Your Listing
                      </>
                    ) : (
                      <>
                        <Zap size={16} fill="#0B0E14" /> Proceed to Escrow Vault
                      </>
                    )}
                  </button>

                  {purchaseError && !showPaymentModal && (
                    <p className="text-[11px] text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                      {purchaseError}
                    </p>
                  )}

                  <p className="text-[10px] text-center text-[#8A93A3]">
                    🔒 Credentials revealed after deposit is locked in Vault.
                  </p>
                </div>

                <div className="border-t border-[#242938] pt-4 space-y-3">
                  <span className="text-[11px] font-bold text-[#EDEFF2] block">Seller Trust Info</span>
                  <div className="flex items-center justify-between text-xs text-[#8A93A3]">
                    <span className="flex items-center gap-1.5">
                      <UserCheck size={14} className="text-[#FFB020]" /> Rating
                    </span>
                     <strong className="text-[#EDEFF2]">{sellerRating !== null ? sellerRating.toFixed(1) : (listing.sellerRating || "5.0")} / 5.0</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A93A3]">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-[#FFB020]" /> Escrow Trades
                    </span>
                    <strong className="text-[#EDEFF2]">48+ Trades</strong>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </AuthGuard>
  );
}
