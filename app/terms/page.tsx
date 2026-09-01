import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AssetXtack",
  description: "Platform terms covering escrow terms, prohibited activities, platform fees, and user responsibilities.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#FFB020]/10 border border-[#FFB020]/20">
            <ShieldCheck size={14} className="text-[#FFB020]" />
            <span className="text-xs font-bold text-[#FFB020] font-[var(--font-mono)] uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Terms of Service</h1>
          <p className="text-sm text-[#8A93A3]">Last updated: August 2026</p>
        </section>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl p-8 md:p-10 space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">1. Acceptance of Terms</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              By accessing or using AssetXtack, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. We may update these terms from time to time, and continued use constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">2. Escrow Terms</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              AssetXtack acts as an escrow agent for transactions between buyers and sellers. Funds are held securely until the buyer confirms successful handover of the gaming account. We are not a party to the underlying transaction but provide the infrastructure for secure settlement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">3. User Responsibilities</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>Provide accurate account details and identity information during verification.</li>
              <li>Not share passwords or sensitive credentials outside the secure escrow environment.</li>
              <li>Report suspicious activity or scams immediately via the Report an Issue page.</li>
              <li>Comply with all applicable Nigerian laws and regulations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">4. Prohibited Activities</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>Listing accounts you do not own or have explicit permission to sell.</li>
              <li>Providing false information about account rank, skins, or ownership history.</li>
              <li>Attempting to bypass escrow payments or request direct bank transfers.</li>
              <li>Harassing other users or support staff.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">5. Platform Fees</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              AssetXtack charges a service fee on completed transactions. Fees are displayed transparently before transaction confirmation. Additional fees may apply for premium features such as featured listings or dispute resolution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">6. Limitation of Liability</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              AssetXtack is not liable for indirect, incidental, or consequential damages arising from use of the platform. Our total liability shall not exceed the transaction amount in dispute. We do not guarantee uninterrupted access or error-free operation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">7. Governing Law</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State.
            </p>
          </section>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-[#8A93A3] hover:text-[#FFB020] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
