"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  AlertTriangle, 
  MessageSquare, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  FileText
} from "lucide-react";

const MOCK_DISPUTES = [
  {
    id: "DSP-4091",
    orderId: "AX-9821",
    subject: "Moonton Account Password Incorrect",
    status: "Under Review",
    category: "Invalid Credentials",
    updatedAt: "2 hours ago",
  },
];

const FAQS = [
  {
    question: "How does the AssetXtack escrow protection work?",
    answer: "When a buyer pays for an MLBB account, funds are held securely in our vault. The seller then releases the account credentials. The buyer gets an inspection timer to log in and verify skins and heroes before funds are released to the seller."
  },
  {
    question: "What should I do if the login details provided don't work?",
    answer: "Do not confirm the order! Immediately click 'Raise Dispute' on your escrow order page. Our team will freeze the vault timer and step in to verify credentials with the seller or process a full refund."
  },
  {
    question: "How long do payout withdrawals take?",
    answer: "Withdrawals to verified Nigerian bank accounts (Kuda, GTBank, Zenith, etc.) are processed automatically within 5 to 15 minutes."
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("AX-9821");

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] font-display flex items-center gap-2">
            <HelpCircle className="text-[#FFB020]" size={24} /> Support & Dispute Resolution
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Need help with a trade or withdrawal? Our local support team is here to protect your funds and resolve disputes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Dispute / Ticket Form */}
        <div className="lg:col-span-2 bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#242938]">
            <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" /> Open a Dispute or Ticket
            </h2>
            <span className="text-[10px] font-mono text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
              Escrow Protection Active
            </span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Related Order ID
                </label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
                >
                  <option value="AX-9821">AX-9821 (Mythical Glory — ₦45,000)</option>
                  <option value="AX-9912">AX-9912 (Epic Rank — ₦32,000)</option>
                  <option value="NONE">General / Account Issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Category
                </label>
                <select className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50">
                  <option>Invalid Account Credentials</option>
                  <option>Account Description Mismatch</option>
                  <option>Withdrawal / Payout Delay</option>
                  <option>Unresponsive Seller / Buyer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                Detailed Description & Proof Details
              </label>
              <textarea
                rows={4}
                placeholder="Describe what happened when you tried logging in or processing your payout..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl p-3 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 resize-none"
              />
            </div>

            <button className="flex items-center justify-center gap-2 w-full bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs py-3 rounded-xl transition-all shadow-md">
              Submit Support Ticket <Send size={15} />
            </button>
          </form>
        </div>

        {/* Active Tickets Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#FFB020]" /> Active Tickets
            </h2>

            <div className="space-y-3">
              {MOCK_DISPUTES.map((ticket) => (
                <div key={ticket.id} className="bg-[#0B0E14] border border-[#242938] p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                      {ticket.id}
                    </span>
                    <span className="text-[10px] text-[#8A93A3] font-mono">{ticket.updatedAt}</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#EDEFF2]">{ticket.subject}</h3>
                  <div className="flex items-center justify-between text-[10px] text-[#8A93A3] pt-1 border-t border-[#242938]">
                    <span>Order: {ticket.orderId}</span>
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <Clock size={10} /> {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-[#151922] border border-[#242938] p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#EDEFF2]">
              <AlertTriangle size={15} className="text-[#FFB020]" /> Response SLA
            </div>
            <p className="text-[11px] text-[#8A93A3] leading-relaxed">
              Dispute tickets involving active escrow orders freeze all vault payouts immediately. Our team usually reviews logs within 1 to 4 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
          <FileText size={18} className="text-[#7C5CFC]" /> Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-[#0B0E14] border border-[#242938] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-[#EDEFF2] hover:text-[#FFB020] transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-[#8A93A3] leading-relaxed border-t border-[#242938]/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}