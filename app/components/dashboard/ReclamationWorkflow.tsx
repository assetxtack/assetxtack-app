"use client";

import { useState } from "react";
import { AlertTriangle, Lock, CheckCircle, Loader2, Shield, Key, Copy, Check } from "lucide-react";
import OrderCountdown from "./OrderCountdown";

interface ReclamationWorkflowProps {
  order: {
    id: string;
    orderId: string;
    status: string;
    amount?: number;
    title?: string;
    buyerId?: string;
    sellerId?: string;
    disputedAt?: string | Date | null;
    disputeStartedAt?: string | Date | null;
    disputePhase?: number | string | null;
    disputeReclamationDeadline?: string | Date | null;
    returnedCredentials?: string | null;
    credentialsReturnedAt?: string | Date | null;
    returnedCredentialsAt?: string | Date | null;
    sellerVerificationDeadline?: string | Date | null;
    accountSecuredAt?: string | Date | null;
    isTimerFrozen?: boolean;
    timerFrozenAt?: string | Date | null;
    timerFrozenRemainingMs?: number | null;
    disputeResolution?: string | null;
    credentials?: string;
  } | null;
  isBuyer: boolean;
  isSeller: boolean;
  onAccountSecured: (checklist: { assetIntegrity: boolean; credentialSecurity: boolean; noUnauthorizedBinding: boolean }) => void;
  isProcessing: boolean;
  onExpire?: () => Promise<void> | void;
}

function parseCredentialLine(line: string) {
  const [key, ...valueParts] = line.split(":");
  if (!key || valueParts.length === 0) return null;
  const value = valueParts.join(":").trim();
  if (!value) return null;
  return { key: key.trim(), value };
}

interface CredentialFieldCardProps {
  credentials: string | undefined;
  title: string;
  icon: React.ReactNode;
  isSellerView?: boolean;
  onCredentialCopy?: (key: string, value: string) => void;
  copiedField: string | null;
  onCopyCredential: (key: string, value: string) => void;
}

function CredentialFieldCard({
  credentials,
  title,
  icon,
  onCopyCredential,
  copiedField,
}: CredentialFieldCardProps) {
  const fields = credentials
    ? credentials.split("\n").map(parseCredentialLine).filter(Boolean) as { key: string; value: string }[]
    : [];

  return (
    <section className="p-5 bg-[#151922] border border-[#242938] rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center gap-2 text-amber-400">
        {icon}
        <h2 className="text-xs uppercase font-extrabold tracking-wider">{title}</h2>
      </div>
      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.key}
            className="bg-[#0B0E14] border border-[#242938] rounded-xl p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#8A93A3] block mb-0.5">{field.key}</span>
              <span className="text-xs font-mono font-bold text-[#EDEFF2] break-all">{field.value}</span>
            </div>
            {onCopyCredential && (
              <button
                onClick={() => onCopyCredential(field.key, field.value)}
                className="shrink-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#FFB020] hover:border-[#FFB020]/40 transition-colors"
                title={`Copy ${field.key}`}
              >
                {copiedField === field.key ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SafetyChecklist({
  onChecklistChange,
  isValid,
}: {
  onChecklistChange: (checks: { assetIntegrity: boolean; credentialSecurity: boolean; noUnauthorizedBinding: boolean }) => void;
  isValid: boolean;
}) {
  const [checks, setChecks] = useState({
    assetIntegrity: false,
    credentialSecurity: false,
    noUnauthorizedBinding: false,
  });

  const toggle = (key: keyof typeof checks) => {
    const updated = { ...checks, [key]: !checks[key] };
    setChecks(updated);
    onChecklistChange(updated);
  };

  const items = [
    { key: "assetIntegrity" as const, label: "Asset & Item Integrity — All skins and currencies remain untouched and accounted for" },
    { key: "credentialSecurity" as const, label: "Credential Security — Login credentials and recovery emails successfully reverted" },
    { key: "noUnauthorizedBinding" as const, label: "No Unauthorized Binding — No off-site phone numbers, recovery links, or social accounts added" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label key={item.key} className="flex items-start gap-2.5 p-3 bg-[#0B0E14] border border-[#242938] rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={checks[item.key]}
            onChange={() => toggle(item.key)}
            className="mt-0.5 h-4 w-4 rounded border-[#242938] bg-[#151922] text-[#FFB020] focus:ring-[#FFB020]"
          />
          <span className="text-xs text-[#EDEFF2] leading-relaxed">{item.label}</span>
        </label>
      ))}
      {!isValid && (
        <p className="text-[10px] text-rose-300 flex items-center gap-1.5">
          <AlertTriangle size={10} />
          All 3 security checks must be confirmed to proceed.
        </p>
      )}
    </div>
  );
}

export default function ReclamationWorkflow({
  order,
  isBuyer,
  isSeller,
  onAccountSecured,
  isProcessing,
  onExpire,
}: ReclamationWorkflowProps) {
  const [checklist, setChecklist] = useState({
    assetIntegrity: false,
    credentialSecurity: false,
    noUnauthorizedBinding: false,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

  const isDisputed = order.status === "DISPUTED";
  const isReturnedCreds = order.status === "RETURNED_CREDENTIALS";
  const isTimerFrozen = Boolean(order.isTimerFrozen);
  const hasAccountBeenSecured = Boolean(order.accountSecuredAt);

  const isSellerViewOfReturned = isSeller && isReturnedCreds && Boolean(order.returnedCredentials);

  const handleVerifySubmit = () => {
    if (!checklist.assetIntegrity || !checklist.credentialSecurity || !checklist.noUnauthorizedBinding) return;
    onAccountSecured(checklist);
  };

  return (
    <section className="p-5 bg-[#151922] border border-[#242938] rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#FFB020]">
          <Shield size={16} />
          <h2 className="text-xs uppercase font-extrabold tracking-wider">Dispute Reclamation Workflow</h2>
        </div>
        {isTimerFrozen && (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300 flex items-center gap-1">
            <Lock size={10} /> Timer Frozen
          </span>
        )}
      </div>

      {isTimerFrozen && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
          <Lock size={12} className="shrink-0 mt-0.5" />
          <span>
            The dispute timer has been frozen by an admin. No automated actions will occur while frozen.
            Experiencing an emergency? Contact support to freeze or resume this timer.
          </span>
        </div>
      )}

      {/* Phase 1: Buyer returns credentials */}
      {isDisputed && (
        <div className="space-y-4">
          <OrderCountdown
            status="DISPUTED"
            deadline={order.disputeReclamationDeadline}
            disputedAt={order.disputeStartedAt || order.disputedAt}
            timerFrozenRemainingMs={order.timerFrozenRemainingMs}
            isTimerFrozen={isTimerFrozen}
            isBuyer={isBuyer}
            isSeller={isSeller}
            orderId={order.id}
            onExpire={onExpire}
          />

          {isBuyer && (
            <div className="text-xs text-[#8A93A3] leading-relaxed">
              You have 24 hours to return the account credentials to the seller. If you do not
              return credentials within this window, the escrow funds will be automatically
              released to the seller.
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Seller verifies account security */}
      {isReturnedCreds && (
        <div className="space-y-4">
          <OrderCountdown
            status="RETURNED_CREDENTIALS"
            returnedCredentialsAt={order.returnedCredentialsAt}
            isTimerFrozen={isTimerFrozen}
            isBuyer={isBuyer}
            isSeller={isSeller}
            orderId={order.id}
            onExpire={onExpire}
          />
        </div>
      )}

      {/* Buyer: Show returned credentials card only when in RETURNED_CREDENTIALS state */}
      {isReturnedCreds && isBuyer && order.returnedCredentials && (
        <CredentialFieldCard
          credentials={order.returnedCredentials || undefined}
          title="Your Returned Credentials"
          icon={<Key size={16} className="text-amber-400" />}
          onCopyCredential={(key, value) => {
            if (typeof window !== "undefined") {
              navigator.clipboard.writeText(value);
              setCopiedField(key);
              setTimeout(() => setCopiedField(null), 2000);
            }
          }}
          copiedField={copiedField}
        />
      )}

      {/* Seller: Show returned credentials card for review */}
      {isSellerViewOfReturned && (
        <CredentialFieldCard
          credentials={order.returnedCredentials || undefined}
          title="Returned Account Credentials"
          icon={<Key size={16} className="text-amber-400" />}
          onCopyCredential={(key, value) => {
            if (typeof window !== "undefined") {
              navigator.clipboard.writeText(value);
              setCopiedField(key);
              setTimeout(() => setCopiedField(null), 2000);
            }
          }}
          copiedField={copiedField}
        />
      )}

      {/* Phase 2: Seller verification form */}
      {isReturnedCreds && isSeller && !hasAccountBeenSecured && (
        <div className="space-y-4">
          <p className="text-xs text-[#8A93A3] leading-relaxed">
            You have 24 hours to verify that the returned account is secure. Before
            confirming, review the returned credentials above and complete the 3-point
            safety checklist below.
          </p>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>
              If you confirm without verifying, you forfeit the right to reclaim funds.
              If the timer expires without confirmation, a full refund will be processed
              automatically.
            </span>
          </div>

          <div>
            <p className="text-xs font-bold text-[#EDEFF2] uppercase tracking-wider mb-2">
              3-Point Safety Checklist
            </p>
            <SafetyChecklist
              onChecklistChange={setChecklist}
              isValid={checklist.assetIntegrity && checklist.credentialSecurity && checklist.noUnauthorizedBinding}
            />
          </div>

          <button
            onClick={handleVerifySubmit}
            disabled={
              isProcessing ||
              isTimerFrozen ||
              !checklist.assetIntegrity ||
              !checklist.credentialSecurity ||
              !checklist.noUnauthorizedBinding
            }
            className="w-full py-2.5 rounded-xl bg-amber-500 text-[#0B0E14] font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Confirm Account Secured &amp; Authorize Buyer Refund
          </button>
        </div>
      )}

      {hasAccountBeenSecured && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle size={12} />
          You confirmed account security. The buyer refund has been processed.
        </div>
      )}

      {!isDisputed && !isReturnedCreds && order.disputeResolution && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
          <Lock size={12} className="shrink-0 mt-0.5" />
          <span>
            This dispute has been resolved. All credentials have been archived and purged.
            The chat is now read-only for security compliance.
          </span>
        </div>
      )}
    </section>
  );
}
