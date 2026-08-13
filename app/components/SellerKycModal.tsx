"use client";

import { useState } from "react";
import { X, ShieldCheck, Upload, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

interface SellerKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SellerKycModal({ isOpen, onClose, onSuccess }: SellerKycModalProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idType, setIdType] = useState("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [fileAttached, setFileAttached] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Strict Validation Checks
    if (!fullName.trim()) {
      setError("Please enter your full legal name as it appears on your ID.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Please provide a valid phone number.");
      return;
    }
    if (!idNumber.trim()) {
      setError(`Please enter your valid ${idType} identification number.`);
      return;
    }
    if (!fileAttached) {
      setError("Please upload a photo or document of your government-issued ID.");
      return;
    }

    setLoading(true);

    // Simulate AssetXtack KYC verification process
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1200);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileAttached(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#242938] bg-[#151922] p-6 md:p-8 shadow-2xl text-[#EDEFF2]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-[#EDEFF2]">Seller Identity Verification</h2>
              <p className="text-xs text-[#8A93A3]">Verify identity for AssetXtack Shield Guard listing approval.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
              Full Legal Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all"
            />
          </div>

          {/* ID Type & Number Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
                ID Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020]/60 transition-all"
              >
                <option value="NIN">NIN</option>
                <option value="BVN">BVN</option>
                <option value="Voters ID">Voter's Card</option>
                <option value="Passport">International Passport</option>
                <option value="Drivers License">Driver's License</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
                {idType} Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder={`Enter your ${idType} number`}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all font-mono"
              />
            </div>
          </div>

          {/* ID Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
              Government ID Photo <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-[#242938] bg-[#0B0E14]/60 p-5 text-center hover:border-[#FFB020]/40 transition-all">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFileAttached(e.target.files?.[0] || null)}
                className="absolute inset-0 cursor-pointer opacity-0 z-10"
              />
              {fileAttached ? (
                <div className="flex items-center justify-between w-full px-2 z-20">
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium truncate">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span className="truncate max-w-[220px]">{fileAttached.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={22} className="text-[#8A93A3] mb-1.5" />
                  <p className="text-sm font-medium text-[#EDEFF2]">Click or drag photo here to upload</p>
                  <p className="text-xs text-[#8A93A3] mt-0.5">JPG, PNG, or PDF up to 5MB</p>
                </>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-[#FFB020] py-3.5 text-sm font-bold text-[#0B0E14] hover:bg-[#e09b1c] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Identity...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Submit & Complete Verification</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}