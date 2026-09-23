export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  processing: "Processing",
};

export const WITHDRAWAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "processing", label: "Processing" },
];

export const WALLET_TRANSACTION_TYPES: Record<string, string> = {
  ESCROW_LOCK: "Escrow Locked",
  ESCROW_RELEASE: "Escrow Released",
  ESCROW_CANCELLED: "Escrow Cancelled",
  WITHDRAWAL_INITIATED: "Withdrawal Requested",
  WITHDRAWAL_COMPLETED: "Withdrawal Paid",
  WITHDRAWAL_FAILED: "Withdrawal Failed",
  LISTING_SALE: "Listing Sale",
  PLATFORM_FEE: "Platform Fee",
  REFUND: "Refund",
  CREDIT: "Credit",
};

export const WALLET_TRANSACTION_STATUSES: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
};

export const WALLET_TRANSACTION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ESCROW_LOCKED: "Escrow Locked",
  ESCROW_DELIVERED: "Escrow Delivered",
  NEW_MESSAGE: "New Message",
  CHAT: "Chat",
  DISPUTE_RAISED: "Dispute Raised",
  DISPUTE: "Dispute",
  ORDER_COMPLETED: "Order Completed",
  CREDENTIALS_DELIVERED: "Credentials Delivered",
  REVIEW_RECEIVED: "Review Received",
  TAMPERING_REPORT: "Tampering Report",
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  ESCROW_LOCKED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ESCROW_DELIVERED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  NEW_MESSAGE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CHAT: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  DISPUTE_RAISED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DISPUTE: "bg-red-500/10 text-red-400 border-red-500/20",
  ORDER_COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CREDENTIALS_DELIVERED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  REVIEW_RECEIVED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  TAMPERING_REPORT: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  action_required: "Action Required",
};

export const SUPPORT_TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const SUPPORT_TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  action_required: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const SUPPORT_TICKET_PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const ESCROW_AUDIT_EVENT_TYPES: Record<string, string> = {
  ESCROW_LOCK: "Escrow Locked",
  ESCROW_RELEASE: "Escrow Released",
  ESCROW_CANCELLED: "Escrow Cancelled",
  DISPUTE_CREATED: "Dispute Created",
  DISPUTE_RESOLVED: "Dispute Resolved",
  DISPUTE_ESCALATED: "Dispute Escalated",
  ORDER_COMPLETED: "Order Completed",
  CREDENTIALS_DELIVERED: "Credentials Delivered",
};

export function getStatusColor(
  status: string,
  colorMap: Record<string, string>
): string {
  return colorMap[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export function getStatusLabel(
  status: string,
  labelMap: Record<string, string>
): string {
  return labelMap[status] || status;
}

export function formatNaira(amount: number): string {
  if (!amount || amount === 0) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const WALLET_TRANSACTION_TYPE_COLORS: Record<string, string> = {
  ESCROW_LOCK: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ESCROW_RELEASE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ESCROW_CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  WITHDRAWAL_INITIATED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  WITHDRAWAL_COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  WITHDRAWAL_FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  LISTING_SALE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PLATFORM_FEE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  REFUND: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CREDIT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
