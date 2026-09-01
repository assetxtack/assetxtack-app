import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — AssetXtack",
  description: "Comprehensive privacy standards detailing user data protection, cookies, and payment details processing.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20">
            <ShieldCheck size={14} className="text-[#7C5CFC]" />
            <span className="text-xs font-bold text-[#7C5CFC] font-[var(--font-mono)] uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Privacy Policy</h1>
          <p className="text-sm text-[#8A93A3]">Last updated: August 2026</p>
        </section>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl p-8 md:p-10 space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">1. Information We Collect</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              We collect information you provide directly, such as your name, email address, phone number, and identity verification documents. We also collect transaction data, listing details, and communication records within the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>To facilitate escrow transactions and payouts securely.</li>
              <li>To verify seller identity and prevent fraud.</li>
              <li>To send order updates, notifications, and support responses.</li>
              <li>To improve platform performance and user experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">3. Payment Data Processing</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              Payment details are processed by trusted CBN-licensed partners including Paystack and Flutterwave. AssetXtack does not store full credit card or bank credentials. We retain only transaction reference IDs and payout metadata required for dispute resolution and accounting.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">4. Cookies and Tracking</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              We use essential cookies for authentication, session management, and security. Optional analytics cookies help us understand platform usage. You can disable non-essential cookies in your browser settings without affecting core functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">5. Data Sharing and Disclosure</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              We do not sell your personal data. Information may be shared with payment processors, identity verification providers, and law enforcement when legally required. Seller and buyer IDs are anonymized in public review displays.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">6. Data Security</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              We implement industry-standard encryption, access controls, and regular security audits. Firebase Firestore and Google Cloud infrastructure protect data at rest and in transit. Users are encouraged to enable two-factor authentication where available.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">7. Your Rights</h2>
            <ul className="list-disc list-inside text-sm text-[#8A93A3] space-y-2">
              <li>Request access to your personal data.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Opt out of non-essential communications at any time.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#EDEFF2]">8. Contact</h2>
            <p className="text-sm text-[#8A93A3] leading-relaxed">
              For privacy-related inquiries, contact us at privacy@assetxtack.com or via our <Link href="/contact" className="text-[#FFB020] hover:underline">Contact</Link> page.
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
