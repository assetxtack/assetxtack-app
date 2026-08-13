"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Gamepad2, 
  UploadCloud, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Info,
  X
} from "lucide-react";

export default function CreateListingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    currentRank: "Mythic",
    highestRank: "Mythical Glory",
    totalSkins: "",
    totalHeroes: "",
    winRate: "",
    moontonStatus: "Clean / Email Changeable",
    description: "",
    notableSkins: [] as string[],
  });

  const skinCategories = [
    "Collector", "Prime", "KOF", "Aspirants", 
    "Legend", "Zodiac", "M-World", "Transformers"
  ];

  const handleSkinToggle = (skin: string) => {
    setFormData((prev) => ({
      ...prev,
      notableSkins: prev.notableSkins.includes(skin)
        ? prev.notableSkins.filter((s) => s !== skin)
        : [...prev.notableSkins, skin],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate database saving
    setTimeout(() => {
      setIsSubmitting(false);
      // Redirect to the active marketplace listings
      router.push("/listings");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] text-xs font-semibold mb-3">
            <Gamepad2 size={14} /> Phase 1: Mobile Legends: Bang Bang Only
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">List Your MLBB Account</h1>
          <p className="text-sm text-[#8A93A3] mt-1">
            Fill in accurate details. Payouts are protected via Escrow until the buyer confirms handover.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="rounded-2xl border border-[#242938] bg-[#151922] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#EDEFF2] flex items-center gap-2">
              1. Basic Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                Listing Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mythic Glory | 145 Skins | Aspirants & KOF Skin Included"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Asking Price (NGN ₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-[#8A93A3]">₦</span>
                  <input
                    type="number"
                    required
                    placeholder="25,000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] pl-8 pr-4 py-3 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Moonton Binding Status
                </label>
                <select
                  value={formData.moontonStatus}
                  onChange={(e) => setFormData({ ...formData, moontonStatus: e.target.value })}
                  className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020] transition-colors"
                >
                  <option value="Clean / Email Changeable">Clean / Email Changeable</option>
                  <option value="Dummy Email Included">Dummy Email Account Provided</option>
                  <option value="All Socials Unlinked">All Social Links Cleared</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: MLBB Game Attributes */}
          <div className="rounded-2xl border border-[#242938] bg-[#151922] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#EDEFF2]">
              2. MLBB Account Attributes
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Current Rank
                </label>
                <select
                  value={formData.currentRank}
                  onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                  className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-xs text-[#EDEFF2] outline-none focus:border-[#FFB020]"
                >
                  <option value="Epic">Epic</option>
                  <option value="Legend">Legend</option>
                  <option value="Mythic">Mythic</option>
                  <option value="Mythical Honor">Mythical Honor</option>
                  <option value="Mythical Glory">Mythical Glory</option>
                  <option value="Mythic Immortal">Mythic Immortal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Total Skins
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 110"
                  value={formData.totalSkins}
                  onChange={(e) => setFormData({ ...formData, totalSkins: e.target.value })}
                  className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-xs text-[#EDEFF2] outline-none focus:border-[#FFB020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Total Heroes
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85"
                  value={formData.totalHeroes}
                  onChange={(e) => setFormData({ ...formData, totalHeroes: e.target.value })}
                  className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-xs text-[#EDEFF2] outline-none focus:border-[#FFB020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                  Overall Win Rate (%)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 58.5%"
                  value={formData.winRate}
                  onChange={(e) => setFormData({ ...formData, winRate: e.target.value })}
                  className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-xs text-[#EDEFF2] outline-none focus:border-[#FFB020]"
                />
              </div>
            </div>

            {/* Notable Skins Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#8A93A3] mb-2">
                Select Featured/Rare Skin Series Available:
              </label>
              <div className="flex flex-wrap gap-2">
                {skinCategories.map((skin) => {
                  const isSelected = formData.notableSkins.includes(skin);
                  return (
                    <button
                      key={skin}
                      type="button"
                      onClick={() => handleSkinToggle(skin)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? "border-[#FFB020] bg-[#FFB020]/10 text-[#FFB020]"
                          : "border-[#242938] bg-[#0B0E14] text-[#8A93A3] hover:text-[#EDEFF2]"
                      }`}
                    >
                      {skin}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">
                Account Description & Extra Details
              </label>
              <textarea
                rows={4}
                placeholder="Describe emblem levels, specific favorite hero skins, recall effects, or remaining Magic Dust/Diamonds..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] p-4 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Section 3: Escrow Protection Notice */}
          <div className="rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/5 p-4 flex gap-3 text-xs text-[#8A93A3] leading-relaxed">
            <ShieldCheck size={20} className="text-[#FFB020] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#EDEFF2] block mb-0.5">Escrow Sale Policy</span>
              When a buyer purchases this listing, their payment will be held securely in Escrow[cite: 1]. You will be notified to transfer the Moonton/Email details. Payout will be dispatched directly to your verified bank account immediately after the buyer inspects and approves access[cite: 1].
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.price || !formData.totalSkins}
            className="w-full py-4 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-sm hover:bg-[#ffa500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-spin font-bold">↻ Publishing...</span>
            ) : (
              <>
                <CheckCircle2 size={18} /> Publish MLBB Account Listing
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}