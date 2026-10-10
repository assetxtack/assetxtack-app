"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, AlertCircle, Mail, ArrowLeft, Shield, User, FileText } from "lucide-react";

interface BanData {
  banCategory?: string;
  banReason?: string;
  bannedAt?: string | Date;
  bannedBy?: string;
  status?: string;
}

function SuspendedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [banData, setBanData] = useState<BanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          setError("Failed to fetch ban details");
        }
      } catch (err) {
        console.error("Error fetching ban data:", err);
        setError("Failed to load ban details");
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
              <ShieldAlert size={48} className="text-[#FFB020] animate-pulse" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Loading...</h2>
                <p className="text-slate-400 mt-1">Checking your account status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
      <div className="w-full max-w-2xl">
        <div className="bg-[#141c2e]/90 rounded-2xl p-8 border border-slate-800/80 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert size={40} className="text-rose-400" />
            </div>
            <div>
              <h1 className="font-[var(--font-display)] font-extrabold text-3xl md:text-4xl text-white">
                Account Suspended
              </h1>
              <p className="mt-2 text-lg text-slate-300">
                Your AssetXtack account has been permanently restricted.
              </p>
            </div>
          </div>

          <div className="bg-[#0B0E14] rounded-xl border border-slate-800 p-6 space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${getCategoryColor(banData?.banCategory)}`}>
              <FileText size={20} className="text-rose-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ban Category</div>
                <div className="text-lg font-bold text-white mt-1">
                  {banData?.banCategory || "Not specified"}
                </div>
              </div>
            </div>

            {banData?.banReason && (
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
                  {banData?.bannedAt ? formatDate(banData.bannedAt) : "Unknown"}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Account Status</div>
                <div className="text-sm font-medium text-rose-400 mt-1 flex items-center gap-1">
                  <User size={12} className="shrink-0" />
                  Banned
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-400" />
              <h3 className="text-lg font-bold text-amber-400">What This Means</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                You can no longer access your dashboard, create listings, or make purchases.
              </li>
              <li className="flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                Your wallet has been frozen — withdrawals and transfers are blocked.
              </li>
              <li className="flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                Any active orders or escrow transactions have been suspended.
              </li>
              <li className="flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                Your Firebase Authentication account has been disabled.
              </li>
            </ul>
          </div>

          <div className="bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-[#7C5CFC]" />
              <h3 className="text-lg font-bold text-[#7C5CFC]">Believe This Is a Mistake?</h3>
            </div>
            <p className="text-slate-300">
              If you believe your account was suspended in error or you'd like to appeal this decision,
              you can submit an appeal directly below. Our team will review your case within 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/appeal${uid ? `?uid=${uid}` : ""}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7C5CFC] text-slate-950 font-bold hover:bg-[#7C5CFC]/90 transition"
              >
                <Mail size={18} />
                Submit Ban Appeal
              </Link>
              <button
                onClick={() => router.push("/sign-in")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition border border-slate-700"
              >
                <ArrowLeft size={18} />
                Back to Sign In
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">
            AssetXtack &copy; {new Date().getFullYear()} — Account Security & Compliance
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0b101b] px-4 py-12 text-white">
        <div className="w-full max-w-2xl">
          <div className="bg-[#141c2e]/90 rounded-2xl p-8 border border-slate-800/80">
            <div className="flex items-center justify-center gap-4 py-12">
              <ShieldAlert size={48} className="text-[#FFB020] animate-pulse" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Loading...</h2>
                <p className="text-slate-400 mt-1">Checking your account status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SuspendedContent />
    </Suspense>
  );
}
