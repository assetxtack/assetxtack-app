"use client";

import { useState } from "react";
import { 
  PlusCircle, Gamepad2, Edit3, Trash2, Search, ShieldCheck, 
  TrendingUp, Eye, Sparkles, AlertCircle 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CreateListingModal from "@/app/components/dashboard/CreateListingModal";
import SellerKycModal from "@/app/components/SellerKycModal";

const INITIAL_LISTINGS = [
  {
    id: "AX-8810",
    title: "Epic Rank — Collector Skins Pack",
    rank: "Epic",
    skinsCount: 45,
    heroesCount: 70,
    price: 32000,
    status: "Active",
    views: 142,
    date: "Aug 12, 2026",
  },
];

export default function MyListingsPage() {
  const { user } = useAuth();
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");

  // Verification check
  const isVerifiedSeller = (user as any)?.isVerified || false;

  const handlePostAccountClick = () => {
    if (!isVerifiedSeller) {
      setIsKycModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleAddListing = (newListingData: any) => {
    const newEntry = {
      id: `AX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newListingData.title,
      rank: newListingData.rank,
      skinsCount: Number(newListingData.skinsCount),
      heroesCount: Number(newListingData.heroesCount),
      price: Number(newListingData.price),
      status: "Active",
      views: 0,
      date: "Just now",
    };

    setListings((prev) => [newEntry, ...prev]);
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  // Filter listings based on active tab and search query
  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = item.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalValue = listings.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto text-[#EDEFF2]">
      
      {/* Premium Banner */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#151922] via-[#1C2230] to-[#151922] p-6 md:p-8 rounded-2xl border border-[#242938] shadow-2xl">
        {/* Glow ambient background effect */}
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
            Manage your active MLBB gaming accounts, track live views, and list new assets for escrow-protected settlements.
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
            <span className="text-2xl font-black font-mono text-[#EDEFF2] mt-1 block">{listings.length}</span>
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
          
          {/* Status Tabs */}
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

          {/* Search Input */}
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

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
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
                className="bg-[#0B0E14] border border-[#242938] hover:border-[#FFB020]/40 p-5 rounded-2xl flex flex-col justify-between gap-5 transition-all group hover:shadow-lg"
              >
                {/* Account Details Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-3 py-1 rounded-lg border border-[#FFB020]/20">
                        {item.id}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                      <Eye size={14} />
                      <span className="font-mono">{item.views} views</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#EDEFF2] group-hover:text-[#FFB020] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Specs Box */}
                  <div className="grid grid-cols-3 gap-2 bg-[#151922] p-3 rounded-xl border border-[#242938] text-xs">
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Rank</span>
                      <span className="font-bold text-[#EDEFF2]">{item.rank}</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Skins</span>
                      <span className="font-bold text-[#EDEFF2]">{item.skinsCount} Skins</span>
                    </div>
                    <div>
                      <span className="text-[#8A93A3] text-[11px] block font-medium">Heroes</span>
                      <span className="font-bold text-[#EDEFF2]">{item.heroesCount} Heroes</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#242938] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#8A93A3] block font-medium">Listing Price</span>
                    <span className="text-lg font-black font-mono text-[#EDEFF2]">₦{item.price.toLocaleString()}</span>
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

      {/* Verification Check Modal */}
      <SellerKycModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onSuccess={() => {
          setIsKycModalOpen(false);
          setIsCreateModalOpen(true);
        }}
      />
    
      {/* Listing Form Modal */}
      <CreateListingModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleAddListing}
      />
    </div>
  );
}