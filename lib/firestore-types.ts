export interface UserProfile {
  uid: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  location?: string;
  website?: string;
  bio?: string;
  storeTagline?: string;
  sellerVerified?: boolean;
  kycStatus?: "unverified" | "pending" | "VERIFIED" | "rejected";
  lifetimeSales?: number;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string | Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  price: number;
  rank?: string;
  platform?: string;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  featuredSkins?: string[];
  images?: string[];
  description?: string;
  status?: "Active" | "Sold" | "Expired" | "Draft";
  sellerRating?: number | string;
  isFeatured?: boolean;
  hasShieldProtection?: boolean;
  listingPlan?: "shield" | "standard" | "featured";
  emblemsMax?: number;
  skins?: number;
  heroes?: number;
  createdAt?: string | Date;
}

export interface Order {
  id: string;
  listingId: string;
  title: string;
  amount: number;
  sellerId: string;
  sellerName?: string;
  sellerVerified?: boolean;
  hasShieldProtection?: boolean;
  listingPlan?: "shield" | "standard" | "featured";
  buyerId: string;
  status: "IN_ESCROW" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "CANCELLED";
  rank?: string;
  skinsCount?: number;
  paymentReference?: string;
  credentials?: string;
  credentialsSubmitted?: string;
  deliveryNotes?: string;
  paidAt?: string | Date;
  createdAt?: string | Date;
  completedAt?: string | Date;
  disputedAt?: string | Date;
}

export interface Review {
  id: string;
  orderId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystemMessage?: boolean;
  isRedacted?: boolean;
  createdAt: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type: "ESCROW_LOCKED" | "ESCROW_DELIVERED" | "NEW_MESSAGE" | "CHAT" | "DISPUTE_RAISED" | "DISPUTE" | "ORDER_COMPLETED" | "CREDENTIALS_DELIVERED" | "REVIEW_RECEIVED" | "PAYMENT_RECEIVED";
  read: boolean;
  createdAt: string | Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  updatedAt?: string | Date;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  orderId: string;
  type: "ESCROW_LOCK" | "ESCROW_RELEASE" | "WITHDRAWAL_INITIATED" | "PLATFORM_FEE" | "REFUND";
  amount: number;
  escrowAmount?: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  reference?: string;
  failureReason?: string;
  createdAt: string | Date;
  processedAt?: string | Date;
}

export interface KycRecord {
  id: string;
  userId: string;
  status: "unverified" | "pending" | "VERIFIED" | "rejected";
  documents?: Record<string, unknown>;
  rejectionReason?: string;
  submittedAt: string | Date;
  reviewedAt?: string | Date;
}

export interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  status: "open" | "under_review" | "resolved" | "closed";
  resolution?: string;
  initiatorId: string;
  createdAt: string | Date;
  resolvedAt?: string | Date;
}

export interface EscrowRecord {
  id: string;
  orderId: string;
  amount: number;
  status: "locked" | "delivered" | "released" | "refunded" | "frozen";
  lockedAt: string | Date;
  deliveredAt?: string | Date;
  releasedAt?: string | Date;
  refundedAt?: string | Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  resolvedAt?: string | Date;
}

export interface Transfer {
  id: string;
  orderId: string;
  sellerId: string;
  amount: number;
  status: "pending" | "success" | "failed" | "reversed";
  reference: string;
  paystackResponse?: Record<string, unknown>;
  createdAt: string | Date;
  updatedAt: string | Date;
}
