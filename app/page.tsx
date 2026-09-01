"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Wallet, 
  ScrollText, 
  ArrowRightLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Lock,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

const TICKER_ITEMS = [
  "Mythic rank account listed — Epic Mode",
  "Escrow released — sale completed in 6 mins",
  "New account verified: Legend IV, 62 skins",
  "Buyer payment confirmed via Paystack",
  "New listing: Mythical Glory, 8 collectors",
  "Escrow released — sale completed",
  "Fresh account verified: 40+ heroes",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden border-y border-[#242938] bg-[#151922]">
      <style>{`
        @keyframes axt-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .axt-track { animation: axt-scroll 32s linear infinite; }
      `}</style>
      <div className="axt-track flex whitespace-nowrap py-2.5">
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center px-6 text-xs font-[var(--font-mono)] text-[#8A93A3]">
            <span className="text-[#FFB020] mr-2">●</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// Interactive FAQ Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#242938] bg-[#151922] rounded-xl overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#EDEFF2] hover:text-[#FFB020] transition-colors"
      >
        <span>{question}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? "rotate-180 text-[#FFB020]" : "text-[#8A93A3]"}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs md:text-sm text-[#8A93A3] border-t border-[#242938]/50 pt-3 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#0B0E14] min-h-screen font-[var(--font-body)] text-[#EDEFF2]">
      
      {/* Dynamic Animated Hero Section */}
      <section id="overview" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-[#242938] px-5 py-16">
        
        {/* Background Image Container with Slow Zoom Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center animate-zoom opacity-20 filter brightness-75 scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')`,
            }}
          />
          {/* Radial Overlays for enhanced contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14]/80 via-[#0B0E14]/90 to-[#0B0E14]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_85%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 bg-[#151922] border border-[#242938] shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-pulse" />
            <span className="font-[var(--font-mono)] text-xs text-[#FFB020] font-medium">
              Nigeria&apos;s Premier Mobile Legends Marketplace
            </span>
          </div>

          <h1 className="font-[var(--font-display)] font-extrabold text-[#EDEFF2] tracking-tight leading-[1.1] text-4xl sm:text-5xl md:text-6xl mb-6">
            Turn your publisher account <br className="hidden sm:block" />
            into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB020] via-[#FF8800] to-[#7C5CFC]">cash safely.</span>
          </h1>

          <p className="text-[#8A93A3] text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Welcome to AssetXtack — the dedicated escrow platform for buying and selling gaming accounts. Trade with zero risk using safe payment processing via Paystack and Flutterwave.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
            <Link 
              href="/sign-in?mode=signup" 
              className="w-full sm:w-auto rounded-xl px-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2 bg-[#FFB020] text-[#0B0E14] shadow-lg shadow-[#FFB020]/10 hover:bg-[#ffa500] hover:scale-[1.02] transition-all"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link 
              href="/#how" 
              className="w-full sm:w-auto rounded-xl px-8 py-3.5 text-sm font-semibold text-[#EDEFF2] bg-[#151922] border border-[#242938] hover:border-[#FFB020]/50 transition-all"
            >
              How It Works
            </Link>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#8A93A3]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#FFB020]" /> 100% Escrow Protected</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#FFB020]" /> Instant Local Bank Payouts</span>
          </div>

        </div>
      </section>

      <Ticker />

      {/* Trust Metrics Bar */}
      <section className="border-b border-[#242938] bg-[#0B0E14]">
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-[#151922]/40 rounded-xl border border-[#242938]/60">
            <div className="text-2xl sm:text-3xl font-bold text-[#EDEFF2]">₦2.5M+</div>
            <div className="text-xs text-[#8A93A3] mt-1 font-medium">Safely Traded Volume</div>
          </div>
          <div className="p-4 bg-[#151922]/40 rounded-xl border border-[#242938]/60">
            <div className="text-2xl sm:text-3xl font-bold text-[#FFB020]">100%</div>
            <div className="text-xs text-[#8A93A3] mt-1 font-medium">Escrow Protection</div>
          </div>
          <div className="p-4 bg-[#151922]/40 rounded-xl border border-[#242938]/60">
            <div className="text-2xl sm:text-3xl font-bold text-[#EDEFF2]">&lt; 15 Mins</div>
            <div className="text-xs text-[#8A93A3] mt-1 font-medium">Avg Handover Speed</div>
          </div>
          <div className="p-4 bg-[#151922]/40 rounded-xl border border-[#242938]/60">
            <div className="text-2xl sm:text-3xl font-bold text-[#7C5CFC]">500+</div>
            <div className="text-xs text-[#8A93A3] mt-1 font-medium">Verified Gamers</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="max-w-6xl mx-auto px-5 py-16 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="font-[var(--font-mono)] text-xs text-[#FFB020] mb-2 font-semibold tracking-wider uppercase">
            SIMPLE 3-STEP PROCESS
          </div>
          <h2 className="font-[var(--font-display)] font-bold text-2xl md:text-3xl text-[#EDEFF2]">
            How AssetXtack Escrow Works
          </h2>
          <p className="text-xs md:text-sm text-[#8A93A3] mt-2">
            No WhatsApp middleman risks or Discord scams. Trade with peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151922] p-6 rounded-xl border border-[#242938] relative">
            <div className="w-8 h-8 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] font-bold text-sm flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">Buyer Deposits Funds</h3>
            <p className="text-xs text-[#8A93A3] leading-relaxed">
              When a buyer purchases an account, the money is safely locked in the AssetXtack Escrow vault via Paystack/Flutterwave.
            </p>
          </div>

          <div className="bg-[#151922] p-6 rounded-xl border border-[#242938] relative">
            <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-sm flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">Account Credential Transfer</h3>
            <p className="text-xs text-[#8A93A3] leading-relaxed">
              The seller releases publisher account credentials. The buyer verifies account access and in-game assets before confirming handover.
            </p>
          </div>

          <div className="bg-[#151922] p-6 rounded-xl border border-[#242938] relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">Instant Seller Payout</h3>
            <p className="text-xs text-[#8A93A3] leading-relaxed">
              Once the buyer approves handover, escrow instantly releases payment to the seller&apos;s Nigerian bank account.
            </p>
          </div>
        </div>
      </section>

      {/* AssetXtack Shield / Security Section */}
      <section id="escrow" className="bg-[#151922] border-y border-[#242938] py-16 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="font-[var(--font-mono)] text-xs text-[#7C5CFC] mb-2 font-semibold uppercase tracking-wider">
              AssetXtack Shield
            </div>
            <h2 className="font-[var(--font-display)] font-bold text-2xl md:text-3xl text-[#EDEFF2]">
              Why trading here is 100% scam-proof
            </h2>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-2">
              We act as a trusted middleman so neither party ever risks losing money or accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B0E14] p-6 rounded-xl border border-[#242938]">
              <div className="w-10 h-10 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/20 flex items-center justify-center mb-4 text-[#FFB020]">
                <Lock size={20} />
              </div>
              <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">Escrow Fund Vault</h3>
              <p className="text-xs text-[#8A93A3] leading-relaxed">
                Buyer payment is safely held in our system. Sellers receive payment only AFTER the buyer inspects and approves account access.
              </p>
            </div>

            <div className="bg-[#0B0E14] p-6 rounded-xl border border-[#242938]">
              <div className="w-10 h-10 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center mb-4 text-[#7C5CFC]">
                <UserCheck size={20} />
              </div>
              <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">ID Verified Sellers</h3>
              <p className="text-xs text-[#8A93A3] leading-relaxed">
                Sellers undergo account history verification and identity checks before listing high-value accounts on the marketplace.
              </p>
            </div>

            <div className="bg-[#0B0E14] p-6 rounded-xl border border-[#242938]">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <ShieldAlert size={20} />
              </div>
              <h3 className="font-semibold text-base text-[#EDEFF2] mb-2">Dispute Resolution Guarantee</h3>
              <p className="text-xs text-[#8A93A3] leading-relaxed">
                If the account details don&apos;t match the listing or access fails, our support team steps in immediately to refund your money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="max-w-4xl mx-auto px-5 py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <div className="font-[var(--font-mono)] text-xs text-[#FFB020] mb-2 font-semibold">GOT QUESTIONS?</div>
          <h2 className="font-[var(--font-display)] font-bold text-2xl md:text-3xl text-[#EDEFF2]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          <FAQItem
            question="How does the escrow protection work?"
            answer="When a buyer purchases an account, the funds are paid directly to AssetXtack Escrow (via Paystack/Flutterwave). We notify the seller to release the account credentials. The buyer inspects the account, and once confirmed, the funds are released to the seller's bank account."
          />
          <FAQItem
            question="How fast do sellers get paid?"
            answer="Once the buyer approves the handover, funds are transferred instantly to the seller's registered Nigerian bank account within minutes."
          />
          <FAQItem
            question="What happens if the seller gives me wrong credentials?"
            answer="You can open a dispute immediately from your order dashboard. The seller will not receive payment, and our support team will verify the credentials and issue you a full refund."
          />
          <FAQItem
            question="Is it safe to link my Nigerian bank account?"
            answer="Yes. All financial transactions are processed securely through CBN-licensed payment partners like Paystack and Flutterwave with enterprise 256-bit SSL encryption."
          />
        </div>
      </section>

      {/* Call to Action Box */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="rounded-2xl px-6 py-12 text-center bg-[#151922] border border-[#242938]">
          <h3 className="font-[var(--font-display)] font-bold text-2xl md:text-3xl text-[#EDEFF2] mb-3">
            Ready to trade publisher accounts safely?
          </h3>
          <p className="text-sm text-[#8A93A3] mb-7 max-w-md mx-auto">
            Join hundreds of Nigerian Mobile Legends gamers trading accounts without fear of getting scammed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-in?mode=signup" className="rounded-lg px-7 py-3 text-sm font-semibold inline-flex items-center gap-1.5 bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] transition-colors">
              Create Account <ArrowRight size={16} />
            </Link>
            <Link href="/sign-in" className="rounded-lg px-7 py-3 text-sm font-semibold text-[#EDEFF2] border border-[#242938] hover:bg-[#0B0E14] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}