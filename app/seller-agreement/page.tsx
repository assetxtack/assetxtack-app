import Link from "next/link";
import { ShieldCheck, AlertTriangle, Award, Clock } from "lucide-react";

export const metadata = {
  title: "Seller Agreement — AssetXtack",
  description: "Clear seller guidelines regarding account ownership verification, delivery timelines, seller ratings, and penalty rules for fraudulent listings.",
};

export default function SellerAgreementPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 font-[var(--font-mono)] uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Seller Agreement</h1>
          <p className="text-sm text-[#8A93A3]">Last updated: August 2026</p>
        </section>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl p-8 md:p-10 space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">1. Account Ownership Verification</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              Sellers must provide proof of ownership for every listed account. This includes email access, publisher ID control, and any associated recovery methods. AssetXtack reserves the right to request additional verification at any time. Accounts that cannot be verified will be removed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">2. Delivery Timelines</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>Credentials must be released within 2 hours of escrow lock for standard orders.</li>
              <li>Delayed delivery beyond 24 hours may trigger automatic refund and account suspension.</li>
              <li>Sellers must remain responsive via platform chat during active orders.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">3. Seller Ratings and Reviews</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              Buyers leave ratings and reviews after successful handover. Ratings directly influence seller visibility and trust level. Artificial inflation of ratings through fake accounts is strictly prohibited and may result in permanent bans.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">4. Listing Accuracy</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>All account details, including rank, skins, heroes, and win rate, must be accurate.</li>
              <li>Misrepresentation may lead to refunds, chargebacks, and seller penalties.</li>
              <li>Featured boosts must only be used for genuinely high-value accounts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">5. Penalty Rules for Fraudulent Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-5 text-center space-y-2">
                <AlertTriangle size={24} className="text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold text-[#EDEFF2]">First Offense</h3>
                <p className="text-xs text-[#8A93A3]">Listing removal, warning, and 7-day suspension.</p>
              </div>
              <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-5 text-center space-y-2">
                <AlertTriangle size={24} className="text-orange-400 mx-auto" />
                <h3 className="text-sm font-bold text-[#EDEFF2]">Second Offense</h3>
                <p className="text-xs text-[#8A93A3]">30-day suspension and forfeiture of pending payouts.</p>
              </div>
              <div className="bg-[#0B0E14] border border-[#242938] rounded-xl p-5 text-center space-y-2">
                <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                <h3 className="text-sm font-bold text-[#EDEFF2]">Third Offense</h3>
                <p className="text-xs text-[#8A93A3]">Permanent ban and referral to relevant authorities.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">6. Payouts and Fees</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              Sellers receive payouts to their registered Nigerian bank account after successful transaction completion. AssetXtack deducts applicable service fees before disbursement. Sellers are responsible for any local bank charges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">7. Termination</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination, outstanding escrow transactions will be completed or refunded according to platform rules. Historical ratings and reviews remain visible for transparency.
            </p>
          </section>
        </div>

        <div className="text-center">
          <Link href="/sell" className="inline-flex items-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-7 py-3 rounded-xl transition-colors">
            <Award size={16} /> Start Selling
          </Link>
        </div>
      </div>
    </div>
  );
}
