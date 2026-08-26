"use client";

import { useState, useEffect } from "react";
import { 
  PlusCircle, Gamepad2, Edit3, Trash2, Search, ShieldCheck, 
  TrendingUp, Eye, Sparkles, AlertCircle, Loader2, Star, Zap 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CreateListingModal from "@/app/components/dashboard/CreateListingModal";
import KycReminderModal from "@/app/components/dashboard/KycReminderModal";
import SellerKycModal from "@/app/components/SellerKycModal";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, onSnapshot, 
  deleteDoc, doc 
} from "firebase/firestore";

export default function MyListingsPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKycReminderOpen, setIsKycReminderOpen] = useState(false);
  const [isSellerKycOpen, setIsSellerKycOpen] = useState(false);
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerRating, setSellerRating] = useState<number | null>(null);

  // Live Firestore listener for real-time user KYC verification status
  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
    });

    return () => unsubscribeUser();
  }, [user?.uid]);

  const isVerifiedSeller = 
    userData?.kycStatus === "VERIFIED" || 
    userData?.sellerVerified === true || 
    (user as unknown as Record<string, unknown>)?.isVerified || 
    false;

  // Real-time listener for current user's listings
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "listings"),
      where("sellerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "reviews"), where("sellerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const reviews = snapshot.docs.map((d) => d.data() as Record<string, unknown>);
       if (reviews.length > 0) {
         const total = reviews.reduce((sum, r) => sum + Number((r as { rating?: number }).rating || 0), 0);
        setSellerRating(Number((total / reviews.length).toFixed(1)));
      } else {
        setSellerRating(null);
      }
    }, (err) => {
      console.error("Error fetching seller reviews:", err);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handlePostAccountClick = () => {
    if (isVerifiedSeller) {
      setIsCreateModalOpen(true);
    } else {
      setIsKycReminderOpen(true);
    }
  };

  const handleContinueUnverified = () => {
    setIsKycReminderOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleVerifyKyc = () => {
    setIsKycReminderOpen(false);
    setIsSellerKycOpen(true);
  };

  // Add new listing to Firestore with skin tags & featured boost
  const handleAddListing = async (newListingData: Record<string, unknown>) => {
    if (!user?.uid) return;

    try {
      const numericPrice = Number(newListingData.price) || 0;
      const isFeatured = Boolean(newListingData.isFeatured);
      const featureBoostFee = isFeatured ? Math.round(numericPrice * 0.05) : 0;
      
      const payload = {
        title: newListingData.title,
        rank: newListingData.rank,
        skinsCount: Number(newListingData.skinsCount),
        heroesCount: Number(newListingData.heroesCount),
        winRate: newListingData.winRate || "N/A",
        featuredSkins: newListingData.featuredSkins || [],
        price: numericPrice,
        isFeatured,
        featureBoostFee,
        hasShieldHandover: true,
        sellerId: user.uid,
        sellerName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        sellerVerified: isVerifiedSeller,
      };

      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing in Firestore:", error);
    }
  };

  // Delete listing from Firestore
  const handleDeleteListing = async (docId: string) => {
    try {
      await deleteDoc(doc(db, "listings", docId));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = String(item.status ?? "active").toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const activeListingsCount = listings.filter(
    (item) => String(item.status ?? "active").toLowerCase() === "active"
  ).length;
  const totalValue = listings.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto text-[#EDEFF2]">
      
      {/* Premium Banner */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#151922] via-[#1C2230] to-[#151922] p-6 md:p-8 rounded-2xl border border-[#242938] shadow-2xl">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#FFB020]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-[#FFB020] bg-[#FFB020]/10 px-3 py-1 rounded-md border border-[#FFB020]/20 uppercase flex items-center gap-1.5">
              <Sparkles size={14} /> Seller Management Portal
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#EDEFF2] font-display tracking-tight flex items-center gap-3">
            <Gamepad2 className="text-[#FFB020]" size={30} /> My Listings
          </h1>
          <p className="text-sm text-[#8A93A3] max-w-xl leading-relaxed">
            Manage your active MLBB gaming accounts, highlight high-tier skin tags, and list new assets for secure escrow settlements.
          </p>
        </div>

        <button 
          onClick={handlePostAccountClick}
          className="relative z-10 flex items-center justify-center gap-2.5 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 shrink-0 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <PlusCircle size={19} className="stroke-[2.5]" /> Post New Account
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider block">Active Accounts</span>
            <span className="text-2xl font-black font-mono text-[#EDEFF2] mt-1 block">{activeListingsCount}</span>
          </div>
          <div className="p-3 bg-[#FFB020]/10 text-[#FFB020] rounded-xl border border-[#FFB020]/20">
            <Gamepad2 size={22} />
          </div>
        </div>

        <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider block">Inventory Value</span>
            <span className="text-2xl font-black font-mono text-[#EDEFF2] mt-1 block">₦{totalValue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider block">Seller Status</span>
            <span className={`text-sm font-bold mt-1.5 flex items-center gap-1.5 ${isVerifiedSeller ? "text-emerald-400" : "text-amber-400"}`}>
              {isVerifiedSeller ? (
                <><ShieldCheck size={16} /> Identity Verified</>
              ) : (
                <><AlertCircle size={16} /> Verification Pending</>
              )}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${isVerifiedSeller ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Tab Container */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-[#242938]">
          <div className="flex items-center bg-[#0B0E14] p-1.5 rounded-xl border border-[#242938] w-full md:w-auto">
            {["Active", "Sold", "Drafts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#FFB020] text-[#0B0E14] shadow-md"
                    : "text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
            <input
              type="text"
              placeholder="Search ID or account title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 transition-all"
            />
          </div>
        </div>

        {/* Listings Grid / Loader */}
        {loading ? (
          <div className="py-16 text-center text-[#8A93A3] flex flex-col items-center gap-2">
            <Loader2 size={28} className="animate-spin text-[#FFB020]" />
            <p className="text-xs">Fetching live listings from database...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-[#0B0E14] border border-[#242938] text-[#8A93A3] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Gamepad2 size={30} />
            </div>
            <div>
              <p className="text-base font-bold text-[#EDEFF2]">No {activeTab.toLowerCase()} listings found</p>
              <p className="text-xs text-[#8A93A3] mt-1 max-w-sm mx-auto">
                {searchQuery ? "No listings matched your search criteria." : `You currently have no account listings in '${activeTab}'.`}
              </p>
            </div>
            {activeTab === "Active" && (
              <button
                onClick={handlePostAccountClick}
                className="inline-flex items-center gap-2 bg-[#FFB020] text-[#0B0E14] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#e09b1c] transition-all cursor-pointer"
              >
                <PlusCircle size={16} /> Post Your First Account
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.map((item) => (
               <div 
                 key={item.id} 
                 className="bg-[#0B0E14] border border-[#242938] hover:border-[#FFB020]/40 rounded-2xl flex flex-col justify-between gap-5 transition-all group hover:shadow-lg overflow-hidden"
               >
                  {/* Listing Image */}
                  <div className="relative w-full h-40 bg-[#151922] border-b border-[#242938] overflow-hidden">
                    <img
                      src={item.images?.[0] || item.imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"}
                      alt={item.title || "Listing"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/80 to-transparent" />
                  </div>

                  <div className="space-y-3 p-5">
                   <div className="flex items-center justify-between flex-wrap gap-2">
                     <div className="flex items-center gap-2 flex-wrap">
                       <span className="text-xs font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-3 py-1 rounded-lg border border-[#FFB020]/20">
                         {item.id.slice(0, 8)}
                       </span>
                       <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                         {item.status}
                       </span>
                       {item.isFeatured && (
                         <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                           <Zap size={12} className="fill-amber-300" /> Featured Boost
                         </span>
                       )}
                     </div>

                     <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                       <Eye size={14} />
                       <span className="font-mono">{item.views || 0} views</span>
                     </div>
                   </div>

                   <h3 className="text-base font-bold text-[#EDEFF2] group-hover:text-[#FFB020] transition-colors leading-snug">
                     {item.title}
                   </h3>

                   <div className="flex items-center gap-1 text-xs font-bold text-[#FFB020]">
                     <Star size={12} fill="#FFB020" /> {sellerRating !== null ? sellerRating.toFixed(1) : (item.sellerRating || "5.0")}
                   </div>

                  {/* Rare Skin Tags Display */}
                  {Array.isArray(item.featuredSkins) && item.featuredSkins.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.featuredSkins.map((skin: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="text-[11px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-0.5 rounded-md border border-[#A855F7]/20 flex items-center gap-1"
                        >
                          <Sparkles size={10} /> {skin}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 bg-[#151922] p-3 rounded-xl border border-[#242938] text-xs">
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Rank</span>
                      <span className="font-bold text-[#EDEFF2] truncate block">{item.rank}</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Skins</span>
                      <span className="font-bold text-[#EDEFF2]">{item.skinsCount}</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Heroes</span>
                      <span className="font-bold text-[#EDEFF2]">{item.heroesCount}</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Win Rate</span>
                      <span className="font-bold text-emerald-400">{item.winRate || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#242938] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3] block font-medium">Listing Price</span>
                    <span className="text-lg font-black font-mono text-[#EDEFF2]">₦{(item.price || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      title="Edit Listing"
                      className="p-2.5 text-[#8A93A3] hover:text-[#EDEFF2] bg-[#151922] border border-[#242938] hover:border-[#FFB020]/50 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteListing(item.id)}
                      title="Delete Listing"
                      className="p-2.5 text-rose-400 hover:text-rose-300 bg-[#151922] border border-[#242938] hover:border-rose-500/50 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      <CreateListingModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleAddListing}
        isVerifiedSeller={isVerifiedSeller}
        onVerifyKyc={handleVerifyKyc}
      />

      <KycReminderModal
        isOpen={isKycReminderOpen}
        onClose={() => setIsKycReminderOpen(false)}
        onContinueUnverified={handleContinueUnverified}
      />

      <SellerKycModal
        isOpen={isSellerKycOpen}
        onClose={() => setIsSellerKycOpen(false)}
        onSuccess={() => {
          setIsSellerKycOpen(false);
          setIsCreateModalOpen(true);
        }}
      />
    </div>
  );
}