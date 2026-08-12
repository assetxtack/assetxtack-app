"use client";

import Link from "next/link";
import { 
  Wallet, 
  ShieldCheck, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Store,
  ChevronRight,
  TrendingUp,
  Eye
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
            Dashboard Overview
          </h1>
          <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
            Track your escrow orders, active listings, and wallet balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#151922] border border-[#242938] text-[#EDEFF2] hover:border-[#FFB020]/40 transition-colors"
          >
            <Store size={16} className="text-[#FFB020]" />
            <span>Browse Market</span>
          </Link>

          <Link
            href="/my-listings/new"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            <span>List Account</span>
          </Link>
        </div>
      </div>

      {/* Financial & Trade Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Wallet Balance */}
        <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3]">Available Wallet</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#EDEFF2]">₦120,500</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#8A93A3]">Ready for payout</span>
              <Link href="/wallet" className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1">
                Withdraw <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3]">In Escrow Vault</span>
            <div className="p-2 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020]">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#EDEFF2]">₦45,000</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#8A93A3]">1 Active Order</span>
              <Link href="/orders" className="text-xs font-bold text-[#7C5CFC] hover:underline flex items-center gap-1">
                View Escrow <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Active Buying Orders */}
        <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3]">Buying Orders</span>
            <div className="p-2 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC]">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#EDEFF2]">1 Pending</div>
            <p className="text-[11px] text-[#8A93A3] mt-2">Awaiting Moonton transfer</p>
          </div>
        </div>

        {/* Active Sales Listings */}
        <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A93A3]">Active Listings</span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#EDEFF2]">2 Listed</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#8A93A3]">128 Views total</span>
              <Link href="/my-listings" className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1">
                Manage <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Active Escrow Trades Section */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#242938] flex items-center justify-between">
          <div>
            <h2 className="font-[var(--font-display)] font-bold text-base text-[#EDEFF2]">
              Active Escrow Transactions
            </h2>
            <p className="text-xs text-[#8A93A3]">Ongoing trades requiring buyer or seller action.</p>
          </div>
          <Link href="/orders" className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1">
            View All Orders <ChevronRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-[#242938]">
          
          {/* Buying Order Item */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#0B0E14]/40 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] flex items-center justify-center shrink-0 font-bold text-xs">
                BUY
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#EDEFF2]">Mythical Glory — 72 Skins, All Heroes</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30">
                    Action Needed
                  </span>
                </div>
                <div className="text-xs text-[#8A93A3] mt-1 flex flex-wrap items-center gap-3">
                  <span>Order ID: <strong className="text-[#EDEFF2]">#AX-9821</strong></span>
                  <span>•</span>
                  <span>Amount: <strong className="text-emerald-400">₦45,000</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#FFB020]">
                    <Clock size={12} /> Verification Timer: 18h 40m remaining
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Link
                href="/orders/AX-9821"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7C5CFC] text-white hover:bg-[#6847ec] transition-colors"
              >
                Inspect Credentials
              </Link>
            </div>
          </div>

          {/* Seller Listed Item */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#0B0E14]/40 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] flex items-center justify-center shrink-0 font-bold text-xs">
                SELL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#EDEFF2]">Epic Rank — Collector Skins Pack</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Listing
                  </span>
                </div>
                <div className="text-xs text-[#8A93A3] mt-1 flex items-center gap-3">
                  <span>Price: <strong className="text-[#EDEFF2]">₦32,000</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> 48 Views
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Link
                href="/my-listings/AX-3301"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A93A3] bg-[#0B0E14] border border-[#242938] hover:text-[#EDEFF2] transition-colors"
              >
                Edit Listing
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}