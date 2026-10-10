"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Mail, ArrowLeft, Loader2, Send, FileText, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

interface BanData {
  banCategory?: string;
  banReason?: string;
  bannedAt?: string | Date;
  bannedBy?: string;
  status?: string;
}

interface AppealForm {
  email: string;
  fullName: string;
  subject: string;
  message: string;
  category: string;
}

const CATEGORIES = [
  "Account Banned - Wrongful Ban",
  "Account Banned - Mistaken Identity",
  "Account Banned - Want to Resolve Issue",
  "Other Appeal Reason",
];

const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "vqwtykcl";

function AppealContent() {
  const searchParams = useSearchParams();
  const [banData, setBanData] = useState<BanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AppealForm>({
    email: "",
    fullName: "",
    subject: "",
    message: "",
    category: "Account Banned - Wrongful Ban",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const uid = searchParams.get("uid");

  useEffect(() => {
    const fetchBanData = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/user/ban-status?uid=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setBanData(data);
          setFormData(prev => ({
            ...prev,
            subject: `Ban Appeal: ${data.banCategory || "Account Suspension"}`,
            message: `I am appealing the ban on my account (UID: ${uid}).\n\nBan Category: ${data.banCategory || "Not specified"}\nBan Reason: ${data.banReason || "Not specified"}\nBanned On: ${data.bannedAt ? new Date(data.bannedAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"}\n\nPlease review my case. I believe this ban was issued in error because:\n\n[Please explain why you believe the ban was incorrect]`,
          }));
        }
      } catch (err) {
        console.error("Error fetching ban data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanData();
  }, [uid]);

  const formatDate = (timestamp?: string | Date) => {
    if (!timestamp) return "Unknown date";
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    switch (category) {
      case "Fraud / Scam Attempt":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Fake Listing Credentials":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Terms of Service Violation":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Abusive Dispute Behavior":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
        <div className="w-full max-w-2xl">
          <div className="bg-[#141c2e]/90 rounded-2xl p-8 border border-slate-800/80">
            <div className="flex items-center justify-center gap-4 py-12">
              <Loader2 size={48} className="text-[#FFB020] animate-spin" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Loading...</h2>
                <p className="text-slate-400 mt-1">Preparing your appeal form</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUploadSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    const secureUrl = info?.secure_url;
    if (secureUrl) {
      setProofUrls((prev) => [...prev, secureUrl]);
    }
  };

  const removeProof = (urlToRemove: string) => {
    setProofUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!formData.email || !formData.fullName || !formData.subject || !formData.message) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid || "banned-user",
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          proofUrls,
          isAppeal: true,
          bannedUserEmail: formData.email,
          bannedUserName: formData.fullName,
          originalBanUid: uid,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit appeal");
      }

      setSubmittedSuccess(true);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to submit appeal. Please try again.";
      setErrorMessage(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
      <div className="w-full max-w-2xl">
        <div className="bg-[#141c2e]/90 rounded-2xl p-8 border border-slate-800/80 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto border border-[#7C5CFC]/20">
              <Mail size={40} className="text-[#7C5CFC]" />
            </div>
            <div>
              <h1 className="font-[var(--font-display)] font-extrabold text-3xl md:text-4xl text-white">
                Submit Ban Appeal
              </h1>
              <p className="mt-2 text-lg text-slate-300">
                Your account was suspended. Submit an appeal for our team to review.
              </p>
            </div>
          </div>

          {banData && (
            <div className="bg-[#0B0E14] rounded-xl border border-slate-800 p-6 space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${getCategoryColor(banData.banCategory)}`}>
                <FileText size={20} className="text-rose-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ban Category</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {banData.banCategory || "Not specified"}
                  </div>
                </div>
              </div>

              {banData.banReason && (
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <AlertCircle size={14} />
                    Admin Notes
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">{banData.banReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Banned On</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {banData.bannedAt ? formatDate(banData.bannedAt) : "Unknown"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Account UID</div>
                  <div className="text-sm font-medium text-rose-400 mt-1 font-mono">
                    {uid || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {submittedSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 space-y-4 text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-emerald-400">Appeal Submitted Successfully</h2>
              <p className="text-slate-300">
                Our support team has received your appeal and will review it within 24-48 hours.
                You&apos;ll receive an email update once a decision is made.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  href="/sign-in"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7C5CFC] text-slate-950 font-bold hover:bg-[#7C5CFC]/90 transition"
                >
                  <ArrowLeft size={18} />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-rose-400" />
                  <p className="text-rose-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Appeal Category <span className="text-rose-400">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief summary of your appeal"
                  className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Explanation <span className="text-rose-400">*</span></label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Explain why you believe the ban was incorrect. Include any relevant details, timestamps, or evidence that supports your case..."
                  className="w-full rounded-lg bg-[#0b101b] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Supporting Evidence (Optional)</label>
                <div className="border border-dashed border-slate-800 hover:border-amber-500/50 bg-[#0b101b] rounded-xl p-6 space-y-4 transition-colors">
                  <CldUploadWidget
                    uploadPreset="assetxtack_preset"
                    options={{
                      cloudName: CLOUDINARY_CLOUD_NAME,
                      multiple: true,
                      maxFiles: 5,
                    }}
                    onSuccess={handleUploadSuccess as (result: unknown) => void}
                  >
                    {({ open, isLoading }) => (
                      <div className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer" onClick={() => !isLoading && !isSubmitting && open()}>
                        {isLoading ? (
                          <Loader2 size={24} className="text-amber-500 animate-spin" />
                        ) : (
                          <Upload size={24} className="text-amber-500" />
                        )}
                        <p className="text-sm text-slate-400">
                          Upload screenshots or documents that support your appeal
                        </p>
                        <p className="text-xs text-slate-600">
                          (Login error screens, correspondence, payment proofs, etc.)
                        </p>
                      </div>
                    )}
                  </CldUploadWidget>

                  {proofUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {proofUrls.map((url, idx) => (
                        <div key={idx} className="relative group bg-[#0B0E14] border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <FileText size={12} className="text-amber-500" />
                          <span className="truncate max-w-[120px]">Proof #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeProof(url)}
                            className="text-rose-400 hover:text-rose-300 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7C5CFC] text-slate-950 font-bold hover:bg-[#7C5CFC]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting Appeal...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Appeal for Review
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-800">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-amber-500 hover:text-amber-400 transition inline-flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>

          <p className="text-center text-xs text-slate-500">
            AssetXtack &copy; {new Date().getFullYear()} — Account Appeals & Compliance
          </p>
        </div>
      </div>
    </div>
  );
}

const loadingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
    <div className="w-full max-w-2xl">
      <div className="bg-[#141c2e]/90 rounded-2xl p-8 border border-slate-800/80">
        <div className="flex items-center justify-center gap-4 py-12">
          <Loader2 size={48} className="text-[#FFB020] animate-spin" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
            <p className="text-slate-400 mt-1">Preparing your appeal form</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function AppealPage() {
  return (
    <Suspense fallback={loadingFallback}>
      <AppealContent />
    </Suspense>
  );
}