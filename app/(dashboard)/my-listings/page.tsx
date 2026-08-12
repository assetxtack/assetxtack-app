"use client";

import { useState } from "react";
import { PlusCircle, Gamepad2, ShieldCheck, Tag, Trash2, Edit3 } from "lucide-react";
import CreateListingModal from "../../components/dashboard/CreateListingModal";

const INITIAL_LISTINGS = [
  {
    id: "AX-8810",
    title: "Epic Rank — Collector Skins Pack",
    rank: "Epic",
    skinsCount: 45,
    heroesCount: 70,
    price: 32000,
    status: "Active",
    date: "Aug 12, 2026",
  },
];

export default function MyListingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listings, setListings] = useState(INITIAL_LISTINGS);

  const handleAddListing = (newListingData: any) => {
    const newEntry = {
      id: `AX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newListingData.title,
      rank: newListingData.rank,
      skinsCount: Number(newListingData.skinsCount),
      heroesCount: Number(newListingData.heroesCount),
      price: Number(newListingData.price),
      status: "Active",
      date: "Just now",
    };

    setListings((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] font-display flex items-center gap-2">
            <Gamepad2 className="text-[#FFB020]" size={24} /> My Listings
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Manage your active MLBB account sales or list a new account for escrow protection.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0"
        >
          <PlusCircle size={16} /> Post New Account
        </button>
      </div>

      {/* Listings Table */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#242938] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#EDEFF2]">Your Active Accounts ({listings.length})</h2>
        </div>

        <div className="divide-y divide-[#242938]">
          {listings.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0B0E14]/40 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                    {item.id}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#EDEFF2]">{item.title}</h3>
                <div className="text-[10px] text-[#8A93A3] flex items-center gap-3">
                  <span>Rank: <strong className="text-[#EDEFF2]">{item.rank}</strong></span>
                  <span>Skins: <strong className="text-[#EDEFF2]">{item.skinsCount}</strong></span>
                  <span>Heroes: <strong className="text-[#EDEFF2]">{item.heroesCount}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-left sm:text-right">
                  <span className="text-sm font-bold font-mono text-[#EDEFF2]">₦{item.price.toLocaleString()}</span>
                  <span className="text-[10px] text-[#8A93A3] block">{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-[#8A93A3] hover:text-[#EDEFF2] bg-[#0B0E14] border border-[#242938] rounded-lg">
                    <Edit3 size={14} />
                  </button>
                  <button className="p-2 text-rose-400 hover:bg-rose-500/10 bg-[#0B0E14] border border-[#242938] rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAddListing}
      />
    </div>
  );
}