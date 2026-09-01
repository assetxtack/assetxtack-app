"use client";

import { useState } from "react";
import { 
  X, ShieldCheck, Gamepad2, AlertCircle, Upload, Key, Eye, EyeOff, 
  Trash2, ChevronRight, ChevronLeft, ShieldAlert, Zap, Lock, CheckCircle2, FileText, Sparkles, Info, AlertTriangle
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { type Game, SUPPORTED_GAMES } from "@/lib/constants/games";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (formData: Record<string, unknown>, id: string) => void;
  isVerifiedSeller?: boolean;
  onViewListing?: (id: string) => void;
  onVerifyKyc?: () => void;
  selectedGame?: Game;
}

const POPULAR_SKIN_TAGS = ["Collector", "Legend", "PRIME", "KOF", "Aspirants", "M-Series", "Zodiac", "STUN", "11.11", "515"];

export default function CreateListingModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  isVerifiedSeller = false,
  onViewListing,
  onVerifyKyc,
  selectedGame,
}: CreateListingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecondaryPass, setShowSecondaryPass] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string>("");
  const [internalSelectedGame, setInternalSelectedGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  const game = selectedGame || internalSelectedGame;
  const [formData, setFormData] = useState({
    title: "",
    gameId: game?.id ?? "",
    gameName: game?.name ?? "",
    loginProvider: "Email / Publisher ID",
    accountType: "Full Account Transfer",
    rank: "",
    price: "",
    description: "",
    featuredSkins: [] as string[],

    // Dynamic Game Attributes
    skinsCount: "",
    heroesCount: "",
    winRate: "",
    townHall: "",
    gems: "",
    heroLevels: "",
    seasonLevel: "",
    cosmetics: "",
    kdRatio: "",
    agents: "",
    hoursPlayed: "",
    inventoryValue: "",
    medals: "",
    battlePass: "",
    vbucks: "",
    wins: "",
    weapons: "",
    operatorSkins: "",
    tier: "",
    champions: "",

    // Linked Account Unbind Statuses
    vkBoundStatus: "Unbound",
    facebookBoundStatus: "Unbound",
    tiktokBoundStatus: "Unbound",

    // Credentials Payload
    accountEmail: "",
    accountPassword: "",
    secondaryPassword: "",
    has2FA: "No",
    twoFactorDetails: "",
    unboundConfirmation: false,

    // Listing Plan & Featured Boost
    listingPlan: "shield" as "shield" | "standard",
    shieldDurationDays: 30,
  });

  // Screenshot Upload State (Max 15)
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  if (!isOpen) return null;

  // Real-time Dynamic Fee Calculation
  const numericPrice = Number(formData.price) || 0;
  const isFeaturedBoost = formData.listingPlan === "shield";
  const feePercentage = isFeaturedBoost ? 10 : 5; // 10% for Featured Boost / Shield Guard, 5% for Standard
  const calculatedFee = Math.round((numericPrice * feePercentage) / 100);
  const netPayout = numericPrice - calculatedFee;

  const toggleSkinTag = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.featuredSkins.includes(tag);
      return {
        ...prev,
        featuredSkins: exists 
          ? prev.featuredSkins.filter((s) => s !== tag)
          : [...prev.featuredSkins, tag]
      };
    });
  };

  const formatAttributeLabel = (attr: string) => {
    return attr
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (screenshots.length + files.length > 15) {
      setError("You can upload a maximum of 15 account screenshots.");
      return;
    }

    const updatedFiles = [...screenshots, ...files];
    setScreenshots(updatedFiles);

    const updatedPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(updatedPreviews);
    setError("");
  };

  const removeImage = (index: number) => {
    const updatedFiles = screenshots.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setScreenshots(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };

  const handleNextStep = () => {
    setError("");

    if (currentStep === 1) {
      if (!formData.title.trim()) return setError("Please enter a listing title.");
      if (!game) return setError("Please select a game.");
      if (!formData.price || Number(formData.price) <= 0) return setError("Please enter a valid selling price.");
      if (!formData.description.trim()) return setError("Please describe the account features and in-game assets.");

      const required = game.requiredAttributes;
      for (const attr of required) {
        const value = (formData as unknown as Record<string, string | number>)[attr];
        if (!value || String(value).trim() === "") {
          return setError(`Please enter ${formatAttributeLabel(attr).toLowerCase()}.`);
        }
      }
    }

    if (currentStep === 2) {
      if (screenshots.length === 0) return setError("Please upload at least 1 screenshot proving account ownership.");
    }

    if (currentStep === 3) {
      if (!formData.accountEmail.trim()) return setError("Primary account email is required.");
      if (!formData.accountPassword.trim()) return setError("Primary account password is required.");
      if (!formData.unboundConfirmation) {
        return setError("You must confirm that all linked third-party accounts are unbound before proceeding.");
      }
      if (formData.has2FA === "Yes" && !formData.twoFactorDetails.trim()) {
        setError("Please explain how 2FA codes will be delivered to the buyer.");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  // Cloudinary Upload
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "assetxtack_preset");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/vqwtykcl/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to upload screenshot to Cloudinary. Check your upload preset name.");
    }

    const fileData = await res.json();
    return fileData.secure_url;
  };

  // Prevent Duplicate Submission with Loading Locks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Guard against duplicate button taps

    setError("");
    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      const uploadedImageUrls: string[] = [];
      if (screenshots.length > 0) {
        for (let i = 0; i < screenshots.length; i++) {
          const url = await uploadToCloudinary(screenshots[i]);
          uploadedImageUrls.push(url);
        }
      }

      const payload = {
        title: formData.title,
        rank: formData.rank,
        skinsCount: Number(formData.skinsCount),
        heroesCount: Number(formData.heroesCount),
        winRate: formData.winRate || "N/A",
        price: Number(formData.price),
        calculatedFee,
        netPayout,
        feePercentage,
        loginProvider: formData.loginProvider,
        description: formData.description,
        featuredSkins: formData.featuredSkins,
        isFeatured: isFeaturedBoost,
        hasShieldProtection: isFeaturedBoost,
        listingPlan: formData.listingPlan,
        sellerId: currentUser?.uid || "anonymous_seller",
        sellerName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Seller",
        sellerVerified: isVerifiedSeller,
        sellerRating: 5.0,
        images: uploadedImageUrls,

        // Game-specific attributes
        gameAttributes: game?.requiredAttributes.reduce((acc, attr) => {
          const value = (formData as Record<string, unknown>)[attr];
          if (value !== undefined && value !== "" && value !== null) {
            acc[attr] = value as string | number | boolean;
          }
          return acc;
        }, {} as Record<string, string | number | boolean>) || {},

        // Linked Account Unbind Certifications
        vkBoundStatus: formData.vkBoundStatus,
        facebookBoundStatus: formData.facebookBoundStatus,
        tiktokBoundStatus: formData.tiktokBoundStatus,

        // Handover Security Credentials
        accountEmail: formData.accountEmail,
        accountPassword: formData.accountPassword,
        secondaryPassword: formData.secondaryPassword,
        has2FA: formData.has2FA,
        twoFactorDetails: formData.twoFactorDetails,
      };

      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create listing");
      }

      const newId = data.listingId;

      if (onSuccess) {
        onSuccess(payload, newId);
      }

      setCreatedId(newId);
      setLoading(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Error creating listing:", err);
      setError(err instanceof Error ? err.message : "Failed to create listing. Please try again.");
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccessModalOpen(false);
    onClose();
  };

  const handleViewListing = () => {
    if (onViewListing && createdId) {
      onViewListing(createdId);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/85 backdrop-blur-md">
      <div className="bg-[#151922] border border-[#242938] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-[#EDEFF2] shadow-2xl relative">
        
        {isSuccessModalOpen ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[#EDEFF2]">
                Listing Posted Successfully!
              </h3>
              <p className="text-xs text-[#8A93A3] max-w-md mx-auto leading-relaxed">
                Your publisher account credentials and unbind status have been securely logged.
              </p>
            </div>

            <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-4 max-w-sm mx-auto space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-[#8A93A3]">Listing Title:</span>
                <span className="font-semibold text-[#EDEFF2] truncate max-w-[180px]">{formData.title}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8A93A3]">Selling Price:</span>
                <span className="font-mono font-bold text-emerald-400">₦{numericPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8A93A3]">Plan Fee ({feePercentage}%):</span>
                <span className="font-mono font-bold text-rose-400">-₦{calculatedFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-[#242938]">
                <span className="text-[#8A93A3] font-bold">Your Net Payout:</span>
                <span className="font-mono font-bold text-[#FFB020]">₦{netPayout.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleViewListing}
              className="bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              View My Listing
            </button>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] rounded-xl">
                  <Gamepad2 size={24} />
                </div>
                 <div>
                   <h2 className="text-lg font-bold font-display">List Publisher Account</h2>
                   <p className="text-sm text-[#8A93A3]">Step {currentStep} of 4 — Verify linked accounts and enter credentials.</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14] rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step} 
                  className={`h-1.5 rounded-full transition-all ${
                    step <= currentStep ? "bg-[#FFB020]" : "bg-[#242938]"
                  }`} 
                />
              ))}
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-400">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: SELECT GAME & ACCOUNT STATISTICS */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Step 1 Pre-Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                  <Info size={18} className="shrink-0 text-amber-400 mt-0.5" />
                   <div>
                     <strong className="font-bold text-amber-400 block mb-0.5">Important Notice for Sellers:</strong>
                     Ensure all account attributes match your in-game profile exactly. Mismatched stats will cause escrow buyer rejections.
                   </div>
                 </div>

                 {!game ? (
                   <div className="space-y-4">
                     <div>
                       <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Listing Title *</label>
                       <input
                         type="text"
                         placeholder="e.g. Max Level Account — Rare Skins, Battle Pass Active"
                         value={formData.title}
                         onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                         className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                       />
                     </div>

                     <div>
                       <label className="text-sm font-semibold text-[#EDEFF2] block mb-3">Select Game *</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {SUPPORTED_GAMES.map((g) => (
                           <button
                             key={g.id}
                             type="button"
                              onClick={() => {
                                setInternalSelectedGame(g);
                                setSelectedGameId(g.id);
                                setFormData((prev) => ({
                                  ...prev,
                                  gameId: g.id,
                                  gameName: g.name,
                                }));
                              }}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                selectedGameId === g.id
                                  ? "border-[#FFB020] bg-[#FFB020]/10"
                                  : "border-[#242938] bg-[#0B0E14] hover:border-[#FFB020]/40"
                              }`}
                           >
                             <span className="text-xs font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded-md border border-[#FFB020]/20 font-mono uppercase tracking-wider">
                               {g.category}
                             </span>
                             <h4 className="text-sm font-bold text-[#EDEFF2] mt-2 mb-1">{g.name}</h4>
                             <p className="text-[11px] text-[#8A93A3] leading-relaxed">
                               Attributes: {g.requiredAttributes.join(", ")}
                             </p>
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-5">
                     <div className="flex items-center justify-between">
                       <div>
                         <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Listing Title *</label>
                         <input
                           type="text"
                           placeholder={`e.g. ${game.name} — Max Level, Rare Assets`}
                           value={formData.title}
                           onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                           className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                         />
                       </div>
                       <button
                         type="button"
                         onClick={() => setInternalSelectedGame(null)}
                         className="text-xs text-[#8A93A3] hover:text-[#FFB020] transition-colors mt-5"
                       >
                         Change Game
                       </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Selling Price (₦ NGN) *</label>
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8A93A3]">₦</span>
                           <input
                             type="number"
                             placeholder="45000"
                             value={formData.price}
                             onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                             className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-4 py-3 text-sm text-[#EDEFF2] font-mono transition-all"
                           />
                         </div>
                       </div>

                       <div>
                         <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Account Type</label>
                         <select
                           value={formData.accountType}
                           onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                           className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                         >
                           <option value="Full Account Transfer">Full Account Transfer</option>
                           <option value="Shared Access">Shared Access</option>
                           <option value="Temporary Boost">Temporary Boost</option>
                         </select>
                       </div>
                     </div>

                     {/* Dynamic Game Attributes */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {game.requiredAttributes.map((attr) => {
                         const fieldId = `attr-${attr}`;
                         const label = formatAttributeLabel(attr);
                         const required = ["rank", "townHall", "seasonLevel", "agents", "battlePass", "tier", "champions", "gems"].includes(attr);
                         
                         return (
                           <div key={fieldId}>
                             <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">{label} {required && "*"}</label>
                             {attr === "rank" ? (
                               <select
                                 value={formData.rank}
                                 onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                 className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                               >
                                 <option value="">Select rank...</option>
                                 <option value="Mythical Immortal">Mythical Immortal</option>
                                 <option value="Mythical Glory">Mythical Glory</option>
                                 <option value="Mythical Honor">Mythical Honor</option>
                                 <option value="Mythic">Mythic</option>
                                 <option value="Legend">Legend</option>
                                 <option value="Epic">Epic</option>
                               </select>
                             ) : (
                               <input
                                 type={attr.includes("Count") || attr.includes("Level") || attr === "gems" || attr === "agents" || attr === "champions" || attr === "hoursPlayed" || attr === "inventoryValue" || attr === "battlePass" || attr === "vbucks" || attr === "wins" ? "number" : "text"}
                                 placeholder={`Enter ${label.toLowerCase()}`}
                                  value={((formData as unknown) as Record<string, string | number>)[attr] || ""}
                                 onChange={(e) => setFormData({ ...formData, [attr]: e.target.value })}
                                 className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] font-mono transition-all"
                               />
                             )}
                           </div>
                         );
                       })}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Description & Account Features *</label>
                    <textarea
                      rows={3}
                      placeholder="Describe account level, rare in-game assets, emblem levels, and transfer details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-3.5 text-sm text-[#EDEFF2] placeholder-[#8A93A3] resize-none transition-all"
                    />
                  </div>
                </div>
              )}

                 {/* Rare Skins Tag Select */}
                 <div>
                   <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Rare Asset Badges</label>
                   <div className="flex flex-wrap gap-2">
                     {POPULAR_SKIN_TAGS.map((tag) => {
                       const isSelected = formData.featuredSkins.includes(tag);
                       return (
                         <button
                           key={tag}
                           type="button"
                           onClick={() => toggleSkinTag(tag)}
                           className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-all cursor-pointer ${
                             isSelected
                               ? "bg-[#7C5CFC] text-white border-[#7C5CFC]"
                               : "bg-[#0B0E14] text-[#8A93A3] border-[#242938] hover:border-[#7C5CFC]/50"
                           }`}
                         >
                           <Sparkles size={12} className={isSelected ? "text-[#FFB020]" : "text-[#8A93A3]"} />
                           {tag}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               </div>
              )}

            {/* STEP 2: SCREENSHOT PROOF (UP TO 15 IMAGES) */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Step 2 Pre-Notice */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                  <Info size={18} className="shrink-0 text-blue-400 mt-0.5" />
                  <div>
                    <strong className="font-bold text-blue-400 block mb-0.5">Screenshot Verification Guide:</strong>
                     Upload up to **15 screenshots** showing: Account Profile, Asset Gallery, Win Rate, Emblem Levels, and the **Account Bind Status Page**.
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#EDEFF2]">
                    Upload Screenshots <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-xs font-mono text-[#8A93A3]">{screenshots.length} / 15 uploaded</span>
                </div>

                <div className="relative border-2 border-dashed border-[#242938] hover:border-[#FFB020]/50 rounded-xl p-6 bg-[#0B0E14]/50 text-center transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload size={28} className="mx-auto text-[#8A93A3] mb-2" />
                  <p className="text-sm font-semibold text-[#EDEFF2]">Click or drag screenshots here</p>
                  <p className="text-xs text-[#8A93A3] mt-1">PNG, JPG or WEBP (Max 15 images)</p>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-2 max-h-56 overflow-y-auto pr-1">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#242938] aspect-video bg-[#0B0E14]">
                        <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-rose-500/80 hover:bg-rose-600 text-white p-1 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: LINKED ACCOUNT UNBIND CHECK & CREDENTIAL HANDOVER */}
            {currentStep === 3 && (
              <div className="space-y-5">
                {/* Step 3 Mandatory Pre-Notice */}
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                    <ShieldAlert size={18} />
                    <span>MANDATORY LINKED ACCOUNT UNBIND NOTICE</span>
                  </div>
                  <p className="leading-relaxed">
                    Before providing credentials, **ALL linked third-party accounts** MUST be completely unbound. Leaving linked accounts will allow buyers to reject the order or trigger fraud disputes.
                  </p>
                </div>

                {/* Social Unbind Confirmation Grid */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-[#FFB020] uppercase tracking-wider font-mono flex items-center gap-2">
                    <Lock size={14} /> 1. Confirm Linked Account Unbind Status
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">VKontakte (VK)</label>
                      <select
                        value={formData.vkBoundStatus}
                        onChange={(e) => setFormData({ ...formData, vkBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#FFB020]"
                      >
                        <option value="Unbound">Unbound (Clean)</option>
                        <option value="Bound - Handing Over Login">Bound (Handing over VK email/pass)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">Facebook Account</label>
                      <select
                        value={formData.facebookBoundStatus}
                        onChange={(e) => setFormData({ ...formData, facebookBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#FFB020]"
                      >
                        <option value="Unbound">Unbound (Clean)</option>
                        <option value="Bound - Handing Over Login">Bound (Handing over FB login)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">TikTok Account</label>
                      <select
                        value={formData.tiktokBoundStatus}
                        onChange={(e) => setFormData({ ...formData, tiktokBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2 text-xs text-[#EDEFF2] focus:border-[#FFB020]"
                      >
                        <option value="Unbound">Unbound (Clean)</option>
                        <option value="Bound - Handing Over Login">Bound (Handing over TikTok login)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Primary Credentials */}
                <div className="space-y-3 pt-2 border-t border-[#242938]">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Key size={14} /> 2. Publisher Account Credentials
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Primary Account Email *</label>
                      <input
                        type="email"
                        placeholder="account@email.com"
                        value={formData.accountEmail}
                        onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">Primary Account Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.accountPassword}
                          onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-11 py-3 text-sm text-[#EDEFF2] font-mono focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3] hover:text-[#EDEFF2]"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unbind Checkbox Certification */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0B0E14] border border-[#242938] cursor-pointer hover:border-[#FFB020]/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.unboundConfirmation}
                    onChange={(e) => setFormData({ ...formData, unboundConfirmation: e.target.checked })}
                    className="mt-1 rounded accent-[#FFB020] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-[#EDEFF2] leading-relaxed">
                    <strong>I certify that all linked accounts are unbound</strong> and the buyer will have full direct access without recovery risks.
                  </span>
                </label>
              </div>
            )}

            {/* STEP 4: LISTING PLAN & FEATURED BOOST FEE CALCULATION */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {!isVerifiedSeller && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <strong className="font-bold text-amber-400 block mb-0.5">KYC Verification Required:</strong>
                      Complete{" "}
                      {onVerifyKyc ? (
                        <button
                          type="button"
                          onClick={onVerifyKyc}
                          className="underline font-semibold hover:text-amber-200 transition-colors"
                        >
                          account verification
                        </button>
                      ) : (
                        <span>account verification</span>
                      )}
                      {" "}to unlock Featured status and top-tier marketplace placement.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Featured Boost Option (10% Fee) */}
                  <div
                    onClick={() => isVerifiedSeller && setFormData({ ...formData, listingPlan: "shield" })}
                    className={`rounded-2xl border p-5 transition-all ${
                      !isVerifiedSeller
                        ? "border-[#242938] bg-[#0B0E14]/60 opacity-60 cursor-not-allowed"
                        : formData.listingPlan === "shield"
                        ? "border-[#FFB020] bg-[#FFB020]/10 shadow-lg shadow-[#FFB020]/10"
                        : "border-[#242938] bg-[#0B0E14]/60 hover:border-[#FFB020]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={28} className={`shrink-0 ${!isVerifiedSeller ? "text-[#8A93A3]" : "text-[#FFB020]"}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[#EDEFF2]">Featured Boost</h4>
                          {isVerifiedSeller && (
                            <span className="bg-[#FFB020]/20 text-[#FFB020] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#FFB020]/30">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8A93A3] mt-1">
                          {isVerifiedSeller
                            ? "Top listing placement + Gold animated border badge."
                            : "Locked until KYC verification is complete."}
                        </p>
                        <p className="text-xs font-bold text-[#FFB020] mt-2">10% Platform Fee</p>
                      </div>
                    </div>
                  </div>

                  {/* Standard Option (5% Fee) */}
                  <div
                    onClick={() => setFormData({ ...formData, listingPlan: "standard" })}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                      formData.listingPlan === "standard"
                        ? "border-[#7C5CFC] bg-[#7C5CFC]/10 shadow-lg shadow-[#7C5CFC]/10"
                        : "border-[#242938] bg-[#0B0E14]/60 hover:border-[#7C5CFC]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText size={28} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-[#EDEFF2]">Standard Plan</h4>
                        <p className="text-xs text-[#8A93A3] mt-1">Standard marketplace placement and escrow guard.</p>
                        <p className="text-xs font-bold text-[#7C5CFC] mt-2">5% Platform Fee</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Fee Breakdown Card */}
                <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-4 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between text-[#8A93A3]">
                    <span>Asking Price:</span>
                    <span className="text-[#EDEFF2] font-bold">₦{numericPrice.toLocaleString()} NGN</span>
                  </div>
                  <div className="flex justify-between text-[#8A93A3]">
                    <span>Platform Fee ({feePercentage}%):</span>
                    <span className="text-rose-400 font-bold">-₦{calculatedFee.toLocaleString()} NGN</span>
                  </div>
                  <div className="pt-2 border-t border-[#242938] flex justify-between items-center text-sm font-sans">
                    <span className="font-bold text-[#EDEFF2]">Estimated Net Payout:</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      ₦{netPayout.toLocaleString()} NGN
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A93A3] pt-1">
                    {isVerifiedSeller
                      ? "Verified sellers receive instant payout processing directly to their wallet/bank account upon successful buyer delivery."
                      : "Unverified sellers are subject to standard verification processing times before payout release."}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#242938]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#242938] bg-[#0B0E14] text-[#EDEFF2] hover:bg-[#151922] text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] text-xs font-bold cursor-pointer transition-all"
                >
                  Next Step <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B0E14] text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  {loading ? "Submitting..." : "Complete & Submit Listing"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}