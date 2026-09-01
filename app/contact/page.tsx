"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      alert("Message sent successfully! Our team will get back to you within 24 hours.");
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20">
            <Mail size={14} className="text-[#7C5CFC]" />
            <span className="text-xs font-bold text-[#7C5CFC] font-[var(--font-mono)] uppercase tracking-wider">Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Contact Us</h1>
          <p className="text-base text-[#8A93A3] max-w-xl mx-auto">
            Have a question about an order, payout, or account transfer? Our support team is ready to help.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#EDEFF2] mb-1">Email</h3>
                  <p className="text-sm text-[#8A93A3]">support@assetxtack.com</p>
                  <p className="text-xs text-[#8A93A3] mt-1">We reply within 24 hours</p>
                </div>
              </div>
            </div>
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#EDEFF2] mb-1">Phone</h3>
                  <p className="text-sm text-[#8A93A3]">+234 800 000 0000</p>
                  <p className="text-xs text-[#8A93A3] mt-1">Mon-Fri, 9am - 6pm WAT</p>
                </div>
              </div>
            </div>
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#EDEFF2] mb-1">Office</h3>
                  <p className="text-sm text-[#8A93A3]">Lagos, Nigeria</p>
                  <p className="text-xs text-[#8A93A3] mt-1">By appointment only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-[#151922] border border-[#242938] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#EDEFF2]">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#EDEFF2]">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#EDEFF2]">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#EDEFF2]">Message</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors resize-none"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-sm px-8 py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
