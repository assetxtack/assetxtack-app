"use client";

import { useState } from "react";
import { X, Upload, ShieldCheck, Gamepad2 } from "lucide-react";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (formData: any) => void;
}

export default function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    rank: "Mythical Glory",
    skinsCount: "",
    heroesCount: "",
    price: "",
    loginMethod: "Moonton Account",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (onSuccess) {
        onSuccess(formData);
      }
      setLoading(false);
      onClose();
    } catch (error) {
      console.error("Error creating listing:", error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-sm">
      <div className="bg-[#151922] border border-[#242938] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-[#EDEFF2]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] rounded-xl">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">Post MLBB Account</h2>
              <p className="text-xs text-[#8A93A3]">Fill in account details to make it live on the marketplace.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[#8A93A3] hover:text-[#EDEFF2] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Listing Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Mythical Glory — 120 Skins, All Heroes Unlocked"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Highest Rank</label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
              >
                <option value="Mythical Immortal">Mythical Immortal</option>
                <option value="Mythical Glory">Mythical Glory</option>
                <option value="Mythic">Mythic</option>
                <option value="Legend">Legend</option>
                <option value="Epic">Epic</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Skins Count</label>
              <input
                type="number"
                required
                placeholder="85"
                value={formData.skinsCount}
                onChange={(e) => setFormData({ ...formData, skinsCount: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Heroes Count</label>
              <input
                type="number"
                required
                placeholder="122"
                value={formData.heroesCount}
                onChange={(e) => setFormData({ ...formData, heroesCount: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Selling Price (₦ NGN)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8A93A3]">₦</span>
                <input
                  type="number"
                  required
                  placeholder="35000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-8 pr-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Account Bind Status</label>
              <select
                value={formData.loginMethod}
                onChange={(e) => setFormData({ ...formData, loginMethod: e.target.value })}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
              >
                <option value="Moonton Account">Moonton Account (Clean / Changeable Email)</option>
                <option value="VK / TikTok Unbind">VK / TikTok Unbound</option>
                <option value="All Unbound">All Socials Unbound (All-Clean)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">Key Features & Notable Skins</label>
            <textarea
              rows={3}
              placeholder="List main skins (e.g., KOF Chou, Legend Gusion)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-3 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 resize-none"
            />
          </div>

          <div className="p-3 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center gap-2.5 text-[11px] text-[#8A93A3]">
            <ShieldCheck size={18} className="text-[#FFB020] shrink-0" />
            <span>Funds are held in Escrow Vault until buyer verifies account access.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#242938] text-xs font-semibold text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish to Marketplace"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}