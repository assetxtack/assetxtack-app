"use client";

import { useState } from "react";
import { 
  X, ShieldCheck, Gamepad2, AlertCircle, Upload, Key, Eye, EyeOff, 
  Trash2, ChevronRight, ChevronLeft, ShieldAlert, Zap, Lock, CheckCircle2 
} from "lucide-react";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (formData: any) => void;
  isVerifiedSeller?: boolean; // Controls whether instant or pending approval message displays
}

export default function CreateListingModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  isVerifiedSeller = false 
}: CreateListingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecondaryPass, setShowSecondaryPass] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Listing Details
    title: "",
    rank: "Mythical Glory",
    skinsCount: "",
    heroesCount: "",
    price: "",
    loginMethod: "Moonton Account",
    description: "",

    // Step 3: Comprehensive Security Credentials
    accountEmail: "",
    accountPassword: "",
    secondaryPassword: "",
    has2FA: "No",
    twoFactorDetails: "",
    vkBoundStatus: "Unbound",
    vkEmailOrPhone: "",
    tiktokBoundStatus: "Unbound",
    facebookBoundStatus: "Unbound",
    recoveryNotes: "",

    // Step 4: AssetXtack Shield Guard
    enableShieldGuard: true, // Recommended by default
    shieldDurationDays: 30,
  });

  // Multiple Image Previews State (Step 2)
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  if (!isOpen) return null;

  // Real-time Fee Calculation (10% AssetXtack Shield Fee)
  const numericPrice = Number(formData.price) || 0;
  const calculatedShieldFee = Math.round(numericPrice * 0.10);

  // Handle Screenshot Selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (screenshots.length + files.length > 8) {
      setError("You can upload a maximum of 8 account screenshots.");
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

  // Step Validation logic before moving forward
  const handleNextStep = () => {
    setError("");

    if (currentStep === 1) {
      if (!formData.title.trim()) return setError("Please enter a listing title.");
      if (!formData.skinsCount || Number(formData.skinsCount) < 0) return setError("Please enter a valid skins count.");
      if (!formData.heroesCount || Number(formData.heroesCount) < 0) return setError("Please enter a valid heroes count.");
      if (!formData.price || Number(formData.price) <= 0) return setError("Please enter a valid selling price.");
      if (!formData.description.trim()) return setError("Please enter key account features or skin details.");
    }

    if (currentStep === 2) {
      if (screenshots.length === 0) return setError("Please upload at least 1 screenshot proving account ownership.");
    }

    if (currentStep === 3) {
      if (!formData.accountEmail.trim()) return setError("Moonton / Main account email is required.");
      if (!formData.accountPassword.trim()) return setError("Main account password is required.");
      if (formData.has2FA === "Yes" && !formData.twoFactorDetails.trim()) {
        setError("Please explain how 2nd verification / 2FA will be handed over to the buyer.");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const finalData = {
        ...formData,
        calculatedShieldFee,
        screenshots,
      };

      if (onSuccess) {
        onSuccess(finalData);
      }

      setLoading(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Error creating listing:", err);
      setError("Failed to create listing. Please try again.");
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccessModalOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-sm">
      <div className="bg-[#151922] border border-[#242938] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-[#EDEFF2] shadow-2xl relative">
        
        {/* Success Modal Screen Overlay */}
        {isSuccessModalOpen ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[#EDEFF2]">
                Listing Submitted Successfully!
              </h3>
              <p className="text-xs text-[#8A93A3] max-w-md mx-auto leading-relaxed">
                {isVerifiedSeller 
                  ? "Your account details have passed automated verification and are now live on the AssetXtack marketplace."
                  : "Your listing has been submitted for review. Our inspection team will verify the account statistics and social unbinds before publishing it live."}
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
              {formData.enableShieldGuard && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A93A3]">AssetXtack Shield Protection (10%):</span>
                  <span className="font-mono font-bold text-[#FFB020]">₦{calculatedShieldFee.toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md"
            >
              Done & Go to Marketplace
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] rounded-xl">
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display">Post MLBB Account</h2>
                  <p className="text-sm text-[#8A93A3]">Step {currentStep} of 4 — Complete all security requirements.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Indicator Bar */}
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

            {/* Global Error Alert */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-400">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: BASIC DETAILS & PRICING */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Step Warning & Policy */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                    <ShieldAlert size={18} />
                    <span>Step 1 Guidelines & Consequences</span>
                  </div>
                  <p>
                    Ensure all skin counts, ranks, and pricing are 100% accurate. Misrepresenting account statistics will result in listing rejection and seller score penalties.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                    Listing Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mythical Glory — 120 Skins, All Heroes, Collector Chou"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                      Highest Rank <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                    >
                      <option value="Mythical Immortal">Mythical Immortal</option>
                      <option value="Mythical Glory">Mythical Glory</option>
                      <option value="Mythic">Mythic</option>
                      <option value="Legend">Legend</option>
                      <option value="Epic">Epic</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                      Skins Count <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="85"
                      value={formData.skinsCount}
                      onChange={(e) => setFormData({ ...formData, skinsCount: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                      Heroes Count <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="122"
                      value={formData.heroesCount}
                      onChange={(e) => setFormData({ ...formData, heroesCount: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 font-mono transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                      Selling Price (₦ NGN) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8A93A3]">₦</span>
                      <input
                        type="number"
                        placeholder="35000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                      Primary Bind Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.loginMethod}
                      onChange={(e) => setFormData({ ...formData, loginMethod: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/60 transition-all"
                    >
                      <option value="Moonton Account">Moonton Account (Clean Email)</option>
                      <option value="VK / TikTok Unbind">VK / TikTok Unbound</option>
                      <option value="All Unbound">All Socials Unbound (All-Clean)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time 10% Protection Fee Preview */}
                {numericPrice > 0 && (
                  <div className="p-3.5 bg-[#0B0E14] border border-[#FFB020]/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#8A93A3] flex items-center gap-1.5">
                      <Zap size={14} className="text-[#FFB020]" />
                      Estimated AssetXtack Shield Protection Fee (10%):
                    </span>
                    <span className="font-mono font-bold text-[#FFB020]">
                      ₦{calculatedShieldFee.toLocaleString()} NGN
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                    Key Features & Notable Skins <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe key skins (e.g. KOF Chou, Legend Gusion, Collector skins)..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-3.5 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/60 resize-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: SCREENSHOT PROOF UPLOADS */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Step Warning & Policy */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                    <ShieldAlert size={18} />
                    <span>Screenshot Verification Policy</span>
                  </div>
                  <p>
                    Upload clear, unedited screenshots of your MLBB profile, skin gallery, and account bind page. Uploading edited or stolen images leads to an <strong>immediate permanent ban</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#EDEFF2]">
                    Upload Account Screenshots <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-xs text-[#8A93A3]">{screenshots.length} / 8 uploaded</span>
                </div>

                {/* Dropzone */}
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
                  <p className="text-xs text-[#8A93A3] mt-1">Proof of skins, win rates, emblems, and bind status page</p>
                </div>

                {/* Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#242938] aspect-video bg-[#0B0E14]">
                        <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-rose-500/80 hover:bg-rose-600 text-white p-1 rounded-lg transition-all opacity-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: FULL ACCOUNT RECOVERY PREVENTION CREDENTIALS */}
            {currentStep === 3 && (
              <div className="space-y-5">
                {/* Severe Penalty Warning Banner */}
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                    <ShieldAlert size={18} />
                    <span>Anti-Pullback Legal Notice & Ban Policy</span>
                  </div>
                  <p className="leading-relaxed">
                    By entering credentials below, you guarantee total ownership transfer. Attempting to recover/pull back this account through Moonton support or linked socials post-sale is a fraudulent crime. Your legal KYC identity on file will be submitted to security authorities, and earned funds will be frozen indefinitely.
                  </p>
                </div>

                {/* Moonton Core Logins */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Key size={14} /> 1. Moonton Primary Logins
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                        Moonton / Login Email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="mlbbaccount@gmail.com"
                        value={formData.accountEmail}
                        onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-emerald-500/60 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                        Moonton Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.accountPassword}
                          onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-11 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
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

                {/* In-Game Security & Secondary Passwords */}
                <div className="space-y-4 pt-2 border-t border-[#242938]">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Lock size={14} /> 2. In-Game Secondary Password & 2FA
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                        In-Game Secondary Verification Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSecondaryPass ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.secondaryPassword}
                          onChange={(e) => setFormData({ ...formData, secondaryPassword: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-4 pr-11 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecondaryPass(!showSecondaryPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3] hover:text-[#EDEFF2]"
                        >
                          {showSecondaryPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                        Is 2-Step Verification / 2FA Enabled? <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.has2FA}
                        onChange={(e) => setFormData({ ...formData, has2FA: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-3 text-sm text-[#EDEFF2] focus:outline-none focus:border-emerald-500/60 transition-all"
                      >
                        <option value="No">No (Clean Direct Login)</option>
                        <option value="Yes">Yes (Requires Verification Handover)</option>
                      </select>
                    </div>
                  </div>

                  {formData.has2FA === "Yes" && (
                    <div>
                      <label className="text-sm font-semibold text-[#EDEFF2] block mb-1.5">
                        2FA Code / Transfer Instructions <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Provide 2FA backup codes or state if email access is included"
                        value={formData.twoFactorDetails}
                        onChange={(e) => setFormData({ ...formData, twoFactorDetails: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-emerald-500/60 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Social Bind Verification (VK, TikTok, FB) */}
                <div className="space-y-4 pt-2 border-t border-[#242938]">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      3. Social Media Unbind Status
                    </h4>
                    <p className="text-[11px] text-[#8A93A3] mt-0.5">
                      Ensure all social media accounts are unbinded before listing. Bound social accounts without transferred access will lead to listing rejection during inspection.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">VK Account</label>
                      <select
                        value={formData.vkBoundStatus}
                        onChange={(e) => setFormData({ ...formData, vkBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2]"
                      >
                        <option value="Unbound">Unbound (Removed / Clean)</option>
                        <option value="Bound - Handing Over">Bound (Include Login)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">TikTok Account</label>
                      <select
                        value={formData.tiktokBoundStatus}
                        onChange={(e) => setFormData({ ...formData, tiktokBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2]"
                      >
                        <option value="Unbound">Unbound (Removed / Clean)</option>
                        <option value="Bound - Handing Over">Bound (Include Login)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#8A93A3] block mb-1 font-semibold">Facebook Account</label>
                      <select
                        value={formData.facebookBoundStatus}
                        onChange={(e) => setFormData({ ...formData, facebookBoundStatus: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2]"
                      >
                        <option value="Unbound">Unbound (Removed / Clean)</option>
                        <option value="Bound - Handing Over">Bound (Include Login)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ASSETXTACK SHIELD GUARD PROTECTION */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Step Explanation Banner */}
                <div className="p-4 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/30 text-xs text-[#EDEFF2] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#FFB020] text-sm">
                    <Zap size={18} />
                    <span>AssetXtack Shield Guard Protection</span>
                  </div>
                  <p className="text-[#8A93A3] leading-relaxed">
                    Supercharge your listing visibility and buyer confidence with Shield Guard protection. Protected listings sell 3x faster with priority escrow processing.
                  </p>
                </div>

                {/* Shield Toggle Card */}
                <div 
                  onClick={() => setFormData({ ...formData, enableShieldGuard: !formData.enableShieldGuard })}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    formData.enableShieldGuard 
                      ? "border-[#FFB020] bg-[#FFB020]/10 shadow-lg shadow-[#FFB020]/5" 
                      : "border-[#242938] bg-[#0B0E14]/60 hover:border-[#FFB020]/40"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-xl border ${
                      formData.enableShieldGuard ? "bg-[#FFB020] text-[#0B0E14] border-[#FFB020]" : "bg-[#151922] text-[#FFB020] border-[#242938]"
                    }`}>
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#EDEFF2]">Enable AssetXtack Shield Guard</h4>
                        <span className="bg-[#FFB020]/20 text-[#FFB020] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-[#FFB020]/30">
                          Recommended
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-[#8A93A3]">
                        <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Featured "Shield Protected" badge on marketplace card</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Priority top-of-page search placement</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Accelerated escrow payout release</li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto border-t md:border-t-0 border-[#242938] pt-3 md:pt-0">
                    <p className="text-xs text-[#8A93A3]">Protection Fee (10%)</p>
                    <p className="text-lg font-bold font-mono text-[#FFB020]">
                      ₦{calculatedShieldFee.toLocaleString()} <span className="text-xs text-[#8A93A3]">/ 30 Days</span>
                    </p>
                  </div>
                </div>

                {/* Total Cost Summary */}
                <div className="p-4 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between text-sm">
                  <span className="text-[#8A93A3]">Standard Listing Fee:</span>
                  <span className="font-bold font-mono text-emerald-400">FREE</span>
                </div>
                {formData.enableShieldGuard && (
                  <div className="p-4 bg-[#0B0E14] border border-[#FFB020]/30 rounded-xl flex items-center justify-between text-sm">
                    <span className="text-[#EDEFF2] font-semibold flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#FFB020]" /> AssetXtack Shield Fee (10%):
                    </span>
                    <span className="font-bold font-mono text-[#FFB020]">₦{calculatedShieldFee.toLocaleString()} NGN</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP CONTROLS & NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t border-[#242938]">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 rounded-xl border border-[#242938] text-sm font-semibold text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14] transition-colors flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#242938] text-sm font-semibold text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14] transition-colors"
                >
                  Cancel
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  Continue to Step {currentStep + 1} <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Publishing to Escrow..." : "Confirm & Publish Listing"}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}