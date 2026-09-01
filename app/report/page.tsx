"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Loader2, Send } from "lucide-react";

type ReportType = "scam" | "bug" | "dispute";

export default function ReportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reportType: "scam" as ReportType,
    subject: "",
    description: "",
    orderId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setFormData({ reportType: "scam", subject: "", description: "", orderId: "" });
      alert("Report submitted successfully. Our team will investigate within 24 hours.");
    } catch {
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-rose-500/10 border border-rose-500/20">
            <ShieldAlert size={14} className="text-rose-400" />
            <span className="text-xs font-bold text-rose-400 font-[var(--font-mono)] uppercase tracking-wider">Safety</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#EDEFF2] font-[var(--font-display)]">Report an Issue</h1>
          <p className="text-base text-[#8A93A3] max-w-xl mx-auto">
            Found a scam attempt, system bug, or order dispute? Report it here and our team will investigate immediately.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#151922] border border-[#242938] rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#EDEFF2]">Issue Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["scam", "bug", "dispute"] as ReportType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, reportType: type })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    formData.reportType === type
                      ? "bg-[#FFB020]/10 border-[#FFB020]/30 text-[#FFB020]"
                      : "bg-[#0B0E14] border-[#242938] text-[#8A93A3] hover:text-[#EDEFF2]"
                  }`}
                >
                  {type === "scam" ? "Scam Attempt" : type === "bug" ? "System Bug" : "Order Dispute"}
                </button>
              ))}
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
              placeholder="Brief summary of the issue"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#EDEFF2]">Order ID (optional)</label>
            <input
              type="text"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
              placeholder="e.g. abc123xyz"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#EDEFF2]">Description</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-3 text-sm text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors resize-none"
              placeholder="Provide as much detail as possible including usernames, screenshots links, and timeline..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send size={16} /> Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
