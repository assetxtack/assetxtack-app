"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#242938] bg-[#151922] rounded-xl overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-base text-[#EDEFF2] hover:text-[#FFB020] transition-colors"
      >
        <span>{question}</span>
        <ChevronDown size={20} className={`shrink-0 transition-transform ${open ? "rotate-180 text-[#FFB020]" : "text-[#8A93A3]"}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-[#8A93A3] border-t border-[#242938]/50 pt-4 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

const FAQS = [
  {
    question: "How does the escrow protection work?",
    answer:
      "When a buyer purchases an account, the funds are paid directly to AssetXtack Escrow via Paystack or Flutterwave. We notify the seller to release the account credentials. The buyer inspects the account, and once confirmed, the funds are released to the seller's bank account.",
  },
  {
    question: "How fast do sellers get paid?",
    answer:
      "Once the buyer approves the handover, funds are transferred instantly to the seller's registered Nigerian bank account. Payouts typically complete within minutes during business hours.",
  },
  {
    question: "What happens if the seller gives wrong credentials?",
    answer:
      "You can open a dispute immediately from your order dashboard. The seller will not receive payment, and our support team will verify the credentials and issue a full refund if the claim is valid.",
  },
  {
    question: "Is it safe to link my Nigerian bank account?",
    answer:
      "Yes. All financial transactions are processed securely through CBN-licensed payment partners like Paystack and Flutterwave with enterprise-grade encryption and compliance standards.",
  },
  {
    question: "What are the platform fees?",
    answer:
      "AssetXtack charges a small service fee on completed transactions. Exact fees are displayed transparently before you confirm any purchase. There are no hidden charges.",
  },
  {
    question: "How do I transfer a publisher account safely?",
    answer:
      "Sellers should never share passwords in chat. Use the secure handover tool in your order dashboard. Once the buyer confirms receipt, the escrow system automatically releases your payment.",
  },
  {
    question: "Can I cancel an order after payment?",
    answer:
      "Orders can only be cancelled before the seller releases credentials. Once credentials are shared and the buyer verifies access, the transaction is final and funds are released.",
  },
  {
    question: "What should I do if I suspect a scam?",
    answer:
      "Immediately open a dispute from your order page or use the Report an Issue form. Do not share personal banking details outside the platform. Our support team will investigate within 24 hours.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#FFB020]/10 border border-[#FFB020]/20">
            <HelpCircle size={14} className="text-[#FFB020]" />
            <span className="text-xs font-bold text-[#FFB020] font-[var(--font-mono)] uppercase tracking-wider">Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Frequently Asked Questions</h1>
          <p className="text-base text-[#8A93A3] max-w-xl mx-auto">
            Everything you need to know about trading on AssetXtack. Can&apos;t find what you are looking for? Contact our support team.
          </p>
        </section>

        {/* FAQ Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </section>

        {/* Contact CTA */}
        <section className="bg-[#151922] border border-[#242938] rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-[#EDEFF2]">Still have questions?</h3>
          <p className="text-sm text-[#8A93A3] max-w-md mx-auto">Our support team is here to help you with any issues regarding orders, payouts, or account transfers.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-6 py-3 rounded-xl transition-colors">
            Contact Support <HelpCircle size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
