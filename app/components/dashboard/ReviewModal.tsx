"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  sellerName?: string;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, sellerName }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#151922] border border-[#242938] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-amber-400 font-semibold text-sm flex items-center gap-2">
            <Star size={16} fill="#FFB020" /> Leave a Review
          </div>
          <button onClick={onClose} disabled={submitting} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {sellerName && (
            <p className="text-xs text-[#8A93A3] text-center">
              How was your experience with <strong className="text-[#EDEFF2]">{sellerName}</strong>?
            </p>
          )}

          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  fill={(hoverRating || rating) >= star ? "#FFB020" : "none"}
                  stroke={(hoverRating || rating) >= star ? "#FFB020" : "#8A93A3"}
                  className={star <= (hoverRating || rating) ? "text-[#FFB020]" : "text-[#8A93A3]"}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your trade experience..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-[11px] text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
