"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck, Timer } from "lucide-react";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface OrderCountdownProps {
  status: "AWAITING_CREDENTIALS" | "INSPECTION_PERIOD";
  paymentVerifiedAt?: string | Date | null;
  credentialsDeliveredAt?: string | Date | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
  isBuyer: boolean;
  isSeller: boolean;
  orderId: string;
}

function parseTimestamp(ts: unknown): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "object" && ts !== null && "toMillis" in ts && typeof (ts as { toMillis: () => number }).toMillis === "function") {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === "object" && ts !== null && "toDate" in ts && typeof (ts as { toDate: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof ts === "string" || typeof ts === "number") {
    const parsed = new Date(ts as string | number).getTime();
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00h 00m 00s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function OrderCountdown({
  status,
  paymentVerifiedAt,
  credentialsDeliveredAt,
  createdAt,
  paidAt,
  isBuyer,
  isSeller,
  orderId,
}: OrderCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const referenceTimeRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== statusRef.current) {
      statusRef.current = status;
      referenceTimeRef.current = null;
      setIsReady(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [status]);

  useEffect(() => {
    let rawReferenceTime =
      status === "AWAITING_CREDENTIALS"
        ? paymentVerifiedAt || paidAt || createdAt
        : credentialsDeliveredAt;

    let parsed = parseTimestamp(rawReferenceTime);

    // Fallback safety: if still null, default to current time so the UI renders immediately instead of hanging
    if (!parsed) {
      try {
        const stored = localStorage.getItem(`countdown-${orderId}-${status}`);
        if (stored) {
          parsed = Number(stored);
        }
      } catch {
        // localStorage fallback
      }
    }

    if (!parsed) {
      parsed = Date.now(); // Ultimate fallback so it never stays stuck on loading
    }

    referenceTimeRef.current = parsed;
    try {
      localStorage.setItem(`countdown-${orderId}-${status}`, String(parsed));
    } catch {
      // localStorage may be unavailable
    }
    setIsReady(true);
  }, [status, paymentVerifiedAt, credentialsDeliveredAt, createdAt, paidAt, orderId]);

  useEffect(() => {
    if (!isReady || referenceTimeRef.current === null) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const elapsed = now - referenceTimeRef.current!;
      const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
      setTimeRemaining(remaining);
      setIsExpired(remaining <= 0);
    };

    calculateRemaining();
    intervalRef.current = setInterval(calculateRemaining, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="p-4 rounded-2xl border border-[#242938] bg-[#151922]">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Loading timer...</span>
        </div>
      </div>
    );
  }

  if (status === "AWAITING_CREDENTIALS") {
    return (
      <div className={`p-4 rounded-2xl border ${isExpired ? "bg-rose-500/10 border-rose-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
        <div className="flex items-center gap-2 mb-2">
          {isExpired ? (
            <AlertTriangle size={16} className="text-rose-400" />
          ) : (
            <Timer size={16} className="text-amber-400" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isExpired ? "text-rose-400" : "text-amber-400"}`}>
            Phase 1: Awaiting Credentials
          </span>
        </div>
        <div className={`text-2xl font-mono font-bold ${isExpired ? "text-rose-400" : "text-[#EDEFF2]"}`}>
          {formatTimeRemaining(timeRemaining)}
        </div>
        <p className="text-xs text-[#8A93A3] mt-2">
          {isSeller && !isExpired && "You have this time to deliver credentials before this order auto-cancels."}
          {isSeller && isExpired && "Delivery window expired. Order will auto-cancel and refund the buyer."}
          {isBuyer && !isExpired && "Awaiting seller delivery. Order auto-cancels and refunds when timer ends."}
          {isBuyer && isExpired && "Seller did not deliver in time. A refund will be processed."}
        </p>
      </div>
    );
  }

  if (status === "INSPECTION_PERIOD") {
    return (
      <div className={`p-4 rounded-2xl border ${isExpired ? "bg-emerald-500/10 border-emerald-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
        <div className="flex items-center gap-2 mb-2">
          {isExpired ? (
            <ShieldCheck size={16} className="text-emerald-400" />
          ) : (
            <Clock size={16} className="text-blue-400" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isExpired ? "text-emerald-400" : "text-blue-400"}`}>
            Phase 2: Inspection Period
          </span>
        </div>
        <div className={`text-2xl font-mono font-bold ${isExpired ? "text-emerald-400" : "text-[#EDEFF2]"}`}>
          {formatTimeRemaining(timeRemaining)}
        </div>
        <p className="text-xs text-[#8A93A3] mt-2">
          {isBuyer && !isExpired && "You have this time to verify the account. Funds auto-release to seller when timer ends."}
          {isBuyer && isExpired && "Inspection period ended. Funds will be released to the seller."}
          {isSeller && !isExpired && "Buyer is inspecting the account. Funds auto-release when timer ends."}
          {isSeller && isExpired && "Inspection complete. Funds will be released to your wallet."}
        </p>
      </div>
    );
  }

  return null;
}