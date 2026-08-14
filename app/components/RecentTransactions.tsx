"use client";

import Link from "next/link";
import { mockTransactions } from "@/lib/mockData";
import { ArrowUpRight, ArrowDownLeft, Shield, ChevronRight } from "lucide-react";

export default function RecentTransactions() {
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case "escrow_payout":
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <ArrowDownLeft size={16} />
          </div>
        );
      case "withdrawal":
        return (
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
            <ArrowUpRight size={16} />
          </div>
        );
      case "escrow_lock":
      default:
        return (
          <div className="p-2 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] shrink-0">
            <Shield size={16} />
          </div>
        );
    }
  };

  return (
    <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[#242938] flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-display)] font-bold text-base text-[#EDEFF2]">
            Recent Wallet Activity
          </h2>
          <p className="text-xs text-[#8A93A3]">Latest payouts, locks, and withdrawals.</p>
        </div>
        <Link href="/wallet" className="text-[#FFB020] text-xs font-bold hover:underline flex items-center gap-1">
          Full Wallet History <ChevronRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-[#242938]">
        {mockTransactions.map((tx) => (
          <div 
            key={tx.id} 
            className="p-4 flex items-center justify-between gap-4 hover:bg-[#0B0E14]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getTxIcon(tx.type)}
              <div>
                <div className="font-bold text-xs md:text-sm text-[#EDEFF2]">
                  {tx.description}
                </div>
                <div className="text-[11px] text-[#8A93A3] mt-0.5">
                  {tx.date} • <span className="uppercase text-[10px] font-semibold text-[#8A93A3]">{tx.id}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={`font-bold text-xs md:text-sm ${
                tx.type === "escrow_payout" 
                  ? "text-emerald-400" 
                  : tx.type === "withdrawal" 
                  ? "text-red-400" 
                  : "text-[#EDEFF2]"
              }`}>
                {tx.type === "withdrawal" ? `- ${formatNaira(tx.amount)}` : `+ ${formatNaira(tx.amount)}`}
              </div>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full mt-1 ${
                tx.status === "completed" 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "bg-[#FFB020]/10 text-[#FFB020]"
              }`}>
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}