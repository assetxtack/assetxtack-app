"use client";

import Link from "next/link";
import { ShieldCheck, Wallet, ScrollText, ArrowRightLeft, ArrowRight, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    title: "Buyer Deposits Funds",
    description:
      "When a buyer purchases an account, the money is safely locked in the AssetXtack Escrow vault via Paystack or Flutterwave. Funds are held securely until the buyer confirms successful handover.",
    icon: Wallet,
    color: "text-[#FFB020]",
    bg: "bg-[#FFB020]/10",
    border: "border-[#FFB020]/20",
  },
  {
    title: "Seller Transfers Account Credentials",
    description:
      "The seller releases publisher account credentials. The buyer verifies account access and in-game assets before confirming handover. All credentials are exchanged within the secure escrow environment.",
    icon: ArrowRightLeft,
    color: "text-[#7C5CFC]",
    bg: "bg-[#7C5CFC]/10",
    border: "border-[#7C5CFC]/20",
  },
  {
    title: "Buyer Verifies Account Access",
    description:
      "The buyer inspects the gaming account to confirm it matches the listing description. If something is wrong, a dispute can be raised immediately and funds remain protected.",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    title: "Escrow Releases Funds to Seller",
    description:
      "Once the buyer approves the handover, escrow instantly releases payment to the seller's registered Nigerian bank account. The entire process typically completes in under 15 minutes.",
    icon: CheckCircle2,
    color: "text-[#FFB020]",
    bg: "bg-[#FFB020]/10",
    border: "border-[#FFB020]/20",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#FFB020]/10 border border-[#FFB020]/20">
            <ScrollText size={14} className="text-[#FFB020]" />
            <span className="text-xs font-bold text-[#FFB020] font-[var(--font-mono)] uppercase tracking-wider">Escrow Pipeline</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">How AssetXtack Works</h1>
          <p className="text-base md:text-lg text-[#8A93A3] max-w-2xl mx-auto">
            No WhatsApp middleman risks. No Discord scams. Trade Mobile Legends accounts with zero risk using our secure escrow pipeline.
          </p>
        </section>

        {/* Steps */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="bg-[#151922] border border-[#242938] rounded-2xl p-6 relative overflow-hidden group hover:border-[#FFB020]/30 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full" />
              <div className={`w-12 h-12 rounded-xl ${step.bg} border ${step.border} ${step.color} flex items-center justify-center mb-5`}>
                <step.icon size={24} />
              </div>
              <div className="text-xs font-bold text-[#8A93A3] font-[var(--font-mono)] mb-2">STEP {idx + 1}</div>
              <h3 className="text-lg font-bold text-[#EDEFF2] mb-2">{step.title}</h3>
              <p className="text-sm text-[#8A93A3] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </section>

        {/* Trust Section */}
        <section className="bg-[#151922] border border-[#242938] rounded-3xl p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#EDEFF2]">100% Escrow Protected</h3>
              <p className="text-sm text-[#8A93A3]">Funds are held securely until both parties confirm the transaction.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center mx-auto">
                <ScrollText size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#EDEFF2]">Verified Sellers</h3>
              <p className="text-sm text-[#8A93A3]">Every seller undergoes identity and account verification before listing.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#EDEFF2]">Instant Payouts</h3>
              <p className="text-sm text-[#8A93A3]">Sellers receive payment directly to their Nigerian bank account within minutes.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-[#EDEFF2] font-[var(--font-display)]">Ready to trade safely?</h2>
          <p className="text-sm text-[#8A93A3] max-w-md mx-auto">Join hundreds of Nigerian Mobile Legends gamers trading accounts without fear of getting scammed.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-in?mode=signup" className="rounded-xl px-7 py-3 text-sm font-bold inline-flex items-center gap-2 bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] transition-colors">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="/listings" className="rounded-xl px-7 py-3 text-sm font-semibold text-[#EDEFF2] border border-[#242938] hover:bg-[#151922] transition-colors">
              Browse Listings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
