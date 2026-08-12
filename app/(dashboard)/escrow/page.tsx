"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink
} from "lucide-react";

const MOCK_ESCROW_ORDERS = [
  {
    id: "AX-9821",
    role: "BUYER",
    title: "Mythical Glory — 72 Skins, All Heroes Unlocked",
    price: 45000,
    seller: "MoontonTrader_NG",
    status: "Verification Phase",
    timeRemaining: "18h 40m",
    credentials: {
      loginType: "Moonton Account",
      email: "mlbb_seller_99@gmail.com",
      password: "●●●●●●●●●●●●",
      realPassword: "Verified_Pass_2026!",
      recoveryKey: "REC-9921-AX"
    }
  },
  {
    id: "AX-8810",
    role: "SELLER",
    title: "Epic Rank — Collector Skins Pack",
    price: 32000,
    buyer: "ChouMaster",
    status: "Awaiting Buyer Confirmation",
    timeRemaining: "04h 12m",
    credentials: null
  }
];

export default function EscrowOrdersPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeOrder = MOCK_ESCROW_ORDERS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#7C5CFC] bg-[#7C5CFC]/10 px-2.5 py-1 rounded-md border border-[#7C5CFC]/20">
              Vault Secured
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Escrow Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] mt-2 font-display flex items-center gap-2">
            <ShieldCheck className="text-[#FFB020]" size={24} /> Escrow Orders & Vault
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Funds are locked safely in escrow until the buyer verifies and confirms MLBB account access.
          </p>
        </div>
      </div>

      {/* Active Escrow Detail Card */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 space-y-6">
        {/* Order Meta Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#242938]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                Order #{activeOrder.id}
              </span>
              <span className="text-xs font-bold text-[#EDEFF2] bg-[#0B0E14] px-2.5 py-0.5 rounded border border-[#242938]">
                Role: {activeOrder.role}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#EDEFF2]">{activeOrder.title}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-[#8A93A3] block uppercase tracking-wider">Locked Funds</span>
              <span className="text-xl font-bold font-mono text-[#EDEFF2]">
                ₦{activeOrder.price.toLocaleString()}
              </span>
            </div>
            <div className="text-left md:text-right bg-[#0B0E14] px-3 py-2 rounded-xl border border-[#242938]">
              <span className="text-[10px] text-[#8A93A3] block flex items-center gap-1">
                <Clock size={11} className="text-[#FFB020]" /> Inspection Timer
              </span>
              <span className="text-sm font-bold font-mono text-[#FFB020]">
                {activeOrder.timeRemaining}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        {activeOrder.credentials && (
          <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#EDEFF2]">
                <Lock size={15} className="text-[#FFB020]" /> Released Account Credentials
              </div>
              <span className="text-[10px] text-[#8A93A3]">Bound to Moonton Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email / Username */}
              <div className="bg-[#151922] p-3 rounded-lg border border-[#242938]">
                <span className="text-[10px] text-[#8A93A3] block mb-1">Login Email</span>
                <div className="flex items-center justify-between font-mono text-xs text-[#EDEFF2]">
                  <span>{activeOrder.credentials.email}</span>
                  <button 
                    onClick={() => handleCopy(activeOrder.credentials.email)} 
                    className="p-1 text-[#8A93A3] hover:text-[#EDEFF2]"
                    title="Copy Email"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-[#151922] p-3 rounded-lg border border-[#242938]">
                <span className="text-[10px] text-[#8A93A3] block mb-1">Password</span>
                <div className="flex items-center justify-between font-mono text-xs text-[#EDEFF2]">
                  <span>
                    {showPassword ? activeOrder.credentials.realPassword : activeOrder.credentials.password}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="p-1 text-[#8A93A3] hover:text-[#EDEFF2]"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      onClick={() => handleCopy(activeOrder.credentials.realPassword)} 
                      className="p-1 text-[#8A93A3] hover:text-[#EDEFF2]"
                      title="Copy Password"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-[#8A93A3]">
            <AlertTriangle size={15} className="text-[#FFB020] shrink-0" />
            <span>Verify account status in Mobile Legends before confirming payout release.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors">
              Raise Dispute
            </button>
            <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md">
              Confirm & Release Payment <CheckCircle2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}