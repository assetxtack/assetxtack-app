"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Clock,
  ArrowRight,
  Lock,
  Calendar
} from "lucide-react";

interface SellerKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSkip?: () => void;
}

export default function SellerKycModal({ isOpen, onClose, onSuccess, onSkip }: SellerKycModalProps) {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState<"NIN" | "BVN">("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Notice States: 'AUTO_VERIFIED' vs 'PENDING_REVIEW'
  const [submissionState, setSubmissionState] = useState<"IDLE" | "AUTO_VERIFIED" | "PENDING_REVIEW">("IDLE");
  const [verifiedName, setVerifiedName] = useState("");

  if (!isOpen) return null;

  // --- Input Handlers & Input Sanitation ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
    setFullName(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanVal = e.target.value.replace(/\D/g, "");
    if (cleanVal.length <= 11) {
      setIdNumber(cleanVal);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDob(e.target.value);
  };

  const formatDobForPrembly = (dobValue: string): string => {
    if (!dobValue) return "";
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const cleaned = dobValue.trim();
    
    if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(cleaned)) {
      return cleaned;
    }
    
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    const numbers = cleaned.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
      let day: number, month: number, year: number;
      const fourDigit = numbers.find(n => n.length === 4);
      if (fourDigit) {
        year = parseInt(fourDigit);
        const others = numbers.filter(n => n !== fourDigit);
        if (others.length >= 2) {
          day = parseInt(others[0]);
          month = parseInt(others[1]);
        } else {
          return cleaned;
        }
      } else {
        day = parseInt(numbers[0]);
        month = parseInt(numbers[1]);
        year = parseInt(numbers[2]) + 2000;
      }
      const monthIndex = month - 1;
      if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
        const paddedDay = String(day).padStart(2, "0");
        const monthName = months[monthIndex];
        return `${paddedDay}-${monthName}-${year}`;
      }
    }
    
    return cleaned;
  };

  // --- Strict Field Validation ---
  const validateForm = (): boolean => {
    setError("");

    if (!fullName.trim() || fullName.trim().split(" ").length < 2) {
      setError("Please enter your complete full legal name (First & Last name).");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    const phoneDigitsOnly = phoneNumber.replace(/\D/g, "");
    if (phoneDigitsOnly.length !== 11) {
      setError("Phone number must be exactly 11 digits without country code. Example: 09085848382");
      return false;
    }

    if (!dob || !dob.trim()) {
      setError(`Please enter your Date of Birth as registered on your ${idType}.`);
      return false;
    }

    if (!idNumber.trim() || idNumber.length !== 11) {
      setError(`Please enter a valid 11-digit ${idType} number.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError("You must be logged in to verify your identity.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          idType,
          idNumber,
          fullName,
          phoneNumber,
          dob: formatDobForPrembly(dob),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Catches route errors (e.g., DOB mismatch, Name Mismatch, or Invalid ID)
        setError(result.error || "Verification failed. Please double check your details.");
        setLoading(false);
        return;
      }

      setLoading(false);
      
      if (result.verifiedName) {
        setVerifiedName(result.verifiedName);
        setSubmissionState("AUTO_VERIFIED");
      } else {
        setSubmissionState("PENDING_REVIEW");
      }

    } catch (err) {
      console.error("KYC Submission error:", err);
      setError("Network or server connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleProceedToListing = () => {
    setSubmissionState("IDLE");
    onSuccess();
    router.push("/sell");
  };

  const handleSkipKyc = async () => {
    try {
      const userId = auth.currentUser?.uid || "USER_DEFAULT";
      await setDoc(doc(db, "users", userId), {
        kycStatus: "UNVERIFIED",
        sellerVerified: false,
      }, { merge: true });
    } catch (err) {
      console.error("Skip error:", err);
    }

    if (onSkip) {
      onSkip();
    } else {
      onClose();
      router.push("/sell");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E14]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#242938] bg-[#151922] p-6 md:p-8 shadow-2xl text-[#EDEFF2] max-h-[90vh] overflow-y-auto">
        
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

        {/* --- STATE 1: INSTANT AUTO-VERIFICATION SUCCESS --- */}
        {submissionState === "AUTO_VERIFIED" && (
          <div className="mt-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#EDEFF2]">Identity Verified Instantly!</h3>
              <p className="text-xs text-[#8A93A3] mt-2 leading-relaxed">
                Welcome, <strong className="text-emerald-400">{verifiedName}</strong>! Your {idType} record match was confirmed. 
                Your profile now holds <strong className="text-emerald-400">Verified Seller</strong> status with maximum buyer trust.
              </p>
            </div>

            <button
              type="button"
              onClick={handleProceedToListing}
              className="w-full rounded-xl bg-[#FFB020] py-3.5 text-sm font-bold text-[#0B0E14] hover:bg-[#e09b1c] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Account Listing</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* --- STATE 2: MANUAL REVIEW NOTICE --- */}
        {submissionState === "PENDING_REVIEW" && (
          <div className="mt-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#EDEFF2]">Verification Submitted for Review</h3>
              <p className="text-xs text-[#8A93A3] mt-2 leading-relaxed">
                Your KYC application has been received and is under review by the AssetXtack Verification Team. 
                Your listings will initially display as <strong className="text-amber-400">Unverified Seller</strong> in the marketplace. 
                Once approved, your profile and listings will automatically switch to <strong className="text-emerald-400">Verified Seller</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleProceedToListing}
              className="w-full rounded-xl bg-[#FFB020] py-3.5 text-sm font-bold text-[#0B0E14] hover:bg-[#e09b1c] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Account Listing</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* --- STATE 3: DEFAULT VERIFICATION FORM --- */}
        {submissionState === "IDLE" && (
          <>
            {/* Detailed Dynamic Error Alert */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                <Lock size={16} />
                <span>Your Data is Safe & Secure</span>
              </div>
              <p className="leading-relaxed">
                We only use your NIN/BVN for <strong>identity verification purposes</strong> to prevent fraudulent sellers and protect all buyers on AssetXtack. 
                Your sensitive data is <strong>encrypted</strong>, never shared with third parties, and is used solely to confirm you are a real person before listing gaming accounts.
              </p>
            </div>

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
                   onChange={handleNameChange}
                   className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all"
                 />
               </div>

               {/* Email Address */}
               <div>
                 <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
                   Email Address <span className="text-rose-400">*</span>
                 </label>
                 <input
                   type="email"
                   placeholder="seller@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all"
                 />
               </div>

               {/* Phone Number */}
               <div>
                 <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
                   Phone Number <span className="text-rose-400">*</span>
                 </label>
                 <p className="text-[10px] text-[#8A93A3] mb-1.5">Enter 11 digits only, without country code. Example: 09085848382</p>
                 <input
                   type="tel"
                   placeholder="09085848382"
                   value={phoneNumber}
                   onChange={handlePhoneChange}
                   className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all font-mono"
                 />
               </div>

                {/* Date of Birth Field with Notice */}
                <div>
                  <label className="block text-sm font-semibold text-[#EDEFF2] mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#FFB020]" />
                    <span>Date of Birth</span> <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-[11px] text-[#FFB020]/90 mb-1.5">
                    Notice: Must match the exact Date of Birth registered on your official {idType} record.
                  </p>
                   <p className="text-[11px] text-[#8A93A3] mb-1.5">
                     You can enter your Date of Birth in any format (e.g. 11-May-2004, 11/05/2004, 2004-05-11, etc.)
                   </p>
                  <input
                    type="text"
                    placeholder="11-May-2004"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all font-mono"
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
                     onChange={(e) => {
                       setIdType(e.target.value as "NIN" | "BVN");
                       setIdNumber("");
                       setError("");
                     }}
                     className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-3 py-3 text-sm text-[#EDEFF2] outline-none focus:border-[#FFB020]/60 transition-all"
                   >
                     <option value="NIN">NIN</option>
                     <option value="BVN">BVN</option>
                   </select>
                 </div>

                 <div className="sm:col-span-2">
                   <label className="block text-sm font-semibold text-[#EDEFF2] mb-1.5">
                     {idType} Number <span className="text-rose-400">*</span>
                   </label>
                   <input
                     type="text"
                     placeholder="11-digit number"
                     value={idNumber}
                     onChange={handleIdNumberChange}
                     className="w-full rounded-xl border border-[#242938] bg-[#0B0E14] px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] outline-none focus:border-[#FFB020]/60 transition-all font-mono"
                   />
                 </div>
               </div>

               {/* Actions Grid */}
               <div className="pt-2 flex items-center gap-3">
                 <button
                   type="button"
                   onClick={handleSkipKyc}
                   disabled={loading}
                   className="w-1/3 rounded-xl border border-[#242938] bg-[#0B0E14] py-3.5 text-xs font-semibold text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#151922] transition-all disabled:opacity-50"
                 >
                   Skip for Now
                 </button>

                 <button
                   type="submit"
                   disabled={loading}
                   className="w-2/3 rounded-xl bg-[#FFB020] py-3.5 text-sm font-bold text-[#0B0E14] hover:bg-[#e09b1c] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {loading ? (
                     <>
                       <Loader2 size={18} className="animate-spin text-current" />
                       <span>Verifying...</span>
                     </>
                   ) : (
                     <>
                       <ShieldCheck size={18} />
                       <span>Submit & Verify</span>
                     </>
                   )}
                 </button>
               </div>

            </form>
          </>
        )}

      </div>
    </div>
  );
}