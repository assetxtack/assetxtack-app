"use client";

import { useState } from "react";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

const MOCK_TRANSACTIONS = [
  {
    id: "TX-99182",
    type: "Payout",
    amount: 15000,
    status: "Completed",
    date: "Aug 10, 2026",
    description: "Withdrawal to Kuda Bank (***4012)",
  },
  {
    id: "TX-88210",
    type: "Escrow Deposit",
    amount: 45000,
    status: "Locked",
    date: "Aug 08, 2026",
    description: "Purchase Order #AX-9821 (Mythic Glory)",
  },
  {
    id: "TX-77102",
    type: "Listing Sale",
    amount: 32000,
    status: "Completed",
    date: "Aug 02, 2026",
    description: "Sold Account #AX-7820 (Legend III)",
  },
];

export default function WalletPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("");

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] font-display flex items-center gap-2">
            <Wallet className="text-[#FFB020]" size={24} /> Wallet & Payouts
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Manage your payout account, monitor escrow vault allocations, and request bank withdrawals.
          </p>
        </div>
      </div>

      {/* Main Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Available Wallet Balance */}
        <div className="bg-gradient-to-br from-[#151922] to-[#1A202C] border border-[#242938] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EDEFF2] font-mono">₦120,500</div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Ready for instant payout
            </p>
          </div>
        </div>

        {/* Locked Escrow Vault */}
        <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
              Escrow Vault
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EDEFF2] font-mono">₦45,000</div>
            <p className="text-[11px] text-[#FFB020] mt-1 flex items-center gap-1">
              <Clock size={12} /> 1 Active trade pending buyer release
            </p>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
              Lifetime Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EDEFF2] font-mono">₦180,500</div>
            <p className="text-[11px] text-[#8A93A3] mt-1">Total revenue processed</p>
          </div>
        </div>
      </div>

      {/* Action Center: Payout Form + Linked Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Request Card */}
        <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5">
          <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
            <ArrowUpRight size={16} className="text-[#FFB020]" /> Withdraw Funds
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[#8A93A3]">₦</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-8 pr-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
                />
              </div>
              <span className="text-[10px] text-[#8A93A3] mt-1 block">
                Minimum payout: ₦2,000 | Fee: ₦0
              </span>
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                Destination Bank Account
              </label>
              <div className="p-3 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#151922] rounded-lg text-[#FFB020]">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#EDEFF2] block">Kuda Microfinance Bank</span>
                    <span className="text-[10px] text-[#8A93A3]">2041994012 • Iyere</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Primary
                </span>
              </div>
            </div>

            <button className="w-full bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs py-3 rounded-xl transition-all shadow-md">
              Confirm Instant Withdrawal
            </button>
          </div>
        </div>

        {/* Bank Account Settings */}
        <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
                <Building2 size={16} className="text-[#FFB020]" /> Payout Accounts
              </h2>
              <button className="text-xs text-[#FFB020] hover:underline flex items-center gap-1 font-semibold">
                <Plus size={14} /> Add New
              </button>
            </div>

            <p className="text-xs text-[#8A93A3]">
              Payouts are transferred directly to verified Nigerian bank accounts via Paystack / Flutterwave integration.
            </p>

            <div className="p-4 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center font-bold text-xs">
                  K
                </div>
                <div>
                  <div className="text-xs font-bold text-[#EDEFF2]">Kuda Bank</div>
                  <div className="text-[10px] text-[#8A93A3]">Account ending in 4012</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#0B0E14]/60 border border-[#242938] rounded-xl flex items-center gap-2.5 text-xs text-[#8A93A3]">
            <AlertCircle size={16} className="text-[#FFB020] shrink-0" />
            <span>Withdrawals are processed automatically within 5-15 minutes.</span>
          </div>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#242938] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#EDEFF2]">Transaction History</h2>
          <span className="text-xs text-[#8A93A3]">Recent activity</span>
        </div>

        <div className="divide-y divide-[#242938]">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#0B0E14]/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  tx.type === "Payout" 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : tx.status === "Locked"
                    ? "bg-[#FFB020]/10 border-[#FFB020]/20 text-[#FFB020]"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {tx.type === "Payout" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#EDEFF2] block">{tx.description}</span>
                  <span className="text-[10px] text-[#8A93A3] font-mono">{tx.id} • {tx.date}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-bold font-mono block ${
                  tx.type === "Payout" ? "text-rose-400" : "text-emerald-400"
                }`}>
                  {tx.type === "Payout" ? "-" : "+"}₦{tx.amount.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#8A93A3] uppercase font-mono">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}