"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck, Timer, Lock } from "lucide-react";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type CountdownStatus = "AWAITING_CREDENTIALS" | "INSPECTION_PERIOD" | "DISPUTED" | "RETURNED_CREDENTIALS";

interface OrderCountdownProps {
  status: CountdownStatus;
  paymentVerifiedAt?: string | Date | null;
  credentialsDeliveredAt?: string | Date | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
  disputedAt?: string | Date | null;
  returnedCredentialsAt?: string | Date | null;
  deadline?: string | Date | null;
  timerFrozenRemainingMs?: number | null;
  isTimerFrozen?: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  orderId: string;
  onExpireChange?: (expired: boolean) => void;
  onExpire?: () => Promise<void> | void;
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

function getPhaseStartedAt(
  status: CountdownStatus,
  paymentVerifiedAt: string | Date | null | undefined,
  credentialsDeliveredAt: string | Date | null | undefined,
  createdAt: string | Date | null | undefined,
  paidAt: string | Date | null | undefined,
  disputedAt: string | Date | null | undefined,
  returnedCredentialsAt: string | Date | null | undefined
): number | null {
  const rawStartedAt =
    status === "AWAITING_CREDENTIALS"
      ? paymentVerifiedAt || paidAt || createdAt
      : status === "INSPECTION_PERIOD"
        ? credentialsDeliveredAt
        : status === "DISPUTED"
          ? disputedAt
          : returnedCredentialsAt;

  return parseTimestamp(rawStartedAt);
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
  disputedAt,
  returnedCredentialsAt,
  deadline: persistedDeadline,
  timerFrozenRemainingMs,
  isTimerFrozen = false,
  isBuyer,
  isSeller,
  orderId,
  onExpireChange,
  onExpire,
}: OrderCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const wasExpiredRef = useRef(false);
  const hasFiredExpireRef = useRef(false);

  const startedAt = getPhaseStartedAt(
    status,
    paymentVerifiedAt,
    credentialsDeliveredAt,
    createdAt,
    paidAt,
    disputedAt,
    returnedCredentialsAt
  );
  const persistedDeadlineMs = parseTimestamp(persistedDeadline);
  const deadlineMs = persistedDeadlineMs ?? (startedAt === null ? null : startedAt + TWENTY_FOUR_HOURS_MS);
  const frozenRemainingMs =
    isTimerFrozen && typeof timerFrozenRemainingMs === "number" && timerFrozenRemainingMs >= 0
      ? timerFrozenRemainingMs
      : null;
  const effectiveNow = isTimerFrozen && frozenRemainingMs !== null ? deadlineMs === null ? now : deadlineMs - frozenRemainingMs : now;
  const timeRemaining = deadlineMs === null ? 0 : Math.max(0, deadlineMs - effectiveNow);
  const isExpired = deadlineMs !== null && timeRemaining <= 0;
  const isReady = deadlineMs !== null;

  useEffect(() => {
    if (!deadlineMs || isTimerFrozen) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [deadlineMs, isTimerFrozen]);

  useEffect(() => {
    if (isExpired !== wasExpiredRef.current) {
      wasExpiredRef.current = isExpired;
      onExpireChange?.(isExpired);
    }
    if (isExpired && !hasFiredExpireRef.current && (status === "DISPUTED" || status === "RETURNED_CREDENTIALS") && onExpire) {
      hasFiredExpireRef.current = true;
      onExpire();
    }
  }, [isExpired, onExpireChange, onExpire, status]);

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
          {isTimerFrozen && <Lock size={10} className="text-blue-400" />}
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
        {isTimerFrozen && (
          <p className="text-xs text-blue-300 mt-2">Timer has been frozen by an admin. No automated actions will occur while frozen.</p>
        )}
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
          {isTimerFrozen && <Lock size={10} className="text-blue-400" />}
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
        {isTimerFrozen && (
          <p className="text-xs text-blue-300 mt-2">Timer has been frozen by an admin. No automated actions will occur while frozen.</p>
        )}
      </div>
    );
  }

  if (status === "DISPUTED") {
    return (
      <div className={`p-4 rounded-2xl border ${isExpired ? "bg-rose-500/10 border-rose-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
        <div className="flex items-center gap-2 mb-2">
          {isExpired ? (
            <AlertTriangle size={16} className="text-rose-400" />
          ) : (
            <Timer size={16} className="text-amber-400" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${isExpired ? "text-rose-400" : "text-amber-400"}`}>
            Phase 1: Return Credentials
          </span>
          {isTimerFrozen && <Lock size={10} className="text-blue-400" />}
        </div>
        <div className={`text-2xl font-mono font-bold ${isExpired ? "text-rose-400" : "text-[#EDEFF2]"}`}>
          {formatTimeRemaining(timeRemaining)}
        </div>
        <p className="text-xs text-[#8A93A3] mt-2">
          {isBuyer && !isExpired && "Return the account credentials within this window to proceed with dispute resolution. If you do not return credentials, funds will be automatically released to the seller."}
          {isBuyer && isExpired && "Return window expired. Funds will be automatically released to the seller."}
          {isSeller && !isExpired && "The buyer has 24 hours to return credentials. If they do not return credentials, funds will be released to you automatically."}
          {isSeller && isExpired && "The buyer did not return credentials in time. Funds will be released to you."}
        </p>
        {isTimerFrozen && (
          <p className="text-xs text-blue-300 mt-2">Timer has been frozen by an admin. No automated actions will occur while frozen.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border ${isExpired ? "bg-rose-500/10 border-rose-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
      <div className="flex items-center gap-2 mb-2">
        {isExpired ? (
          <AlertTriangle size={16} className="text-rose-400" />
        ) : (
          <Clock size={16} className="text-blue-400" />
        )}
        <span className={`text-xs font-bold uppercase tracking-wider ${isExpired ? "text-rose-400" : "text-blue-400"}`}>
          Phase 2: Seller Verification
        </span>
        {isTimerFrozen && <Lock size={10} className="text-blue-400" />}
      </div>
      <div className={`text-2xl font-mono font-bold ${isExpired ? "text-rose-400" : "text-[#EDEFF2]"}`}>
        {formatTimeRemaining(timeRemaining)}
      </div>
      <p className="text-xs text-[#8A93A3] mt-2">
        {isBuyer && !isExpired && "The seller has 24 hours to verify account security and confirm. If the seller does not confirm, a full refund will be processed automatically."}
        {isBuyer && isExpired && "Seller verification window expired. A full refund will be processed automatically."}
        {isSeller && !isExpired && "You have 24 hours to verify account security and confirm. If you do not confirm, a full refund will be processed automatically."}
        {isSeller && isExpired && "Verification window expired. A full refund has been processed."}
      </p>
      {isTimerFrozen && (
        <p className="text-xs text-blue-300 mt-2">Timer has been frozen by an admin. No automated actions will occur while frozen.</p>
      )}
    </div>
  );
}
