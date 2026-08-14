// Types for AssetXtack Marketplace & Dashboard

export interface EscrowOrder {
  id: string;
  title: string;
  sellerName: string;
  buyerName: string;
  price: number;
  status: "action_needed" | "in_escrow" | "completed" | "disputed";
  type: "buy" | "sell";
  timerRemaining: string;
  accountDetails: {
    heroCount: number;
    skinCount: number;
    highestRank: string;
    loginMethod: string;
  };
}

export interface MLBBListing {
  id: string;
  title: string;
  rank: string;
  skinsCount: number;
  heroesCount: number;
  price: number;
  status: "active" | "sold" | "pending_transfer";
  views: number;
  featuredSkin: string;
  sellerVerified: boolean;
}

export interface WalletTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "escrow_payout" | "escrow_lock";
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  description: string;
}

// Mock Data Sets

export const mockEscrowOrders: EscrowOrder[] = [
  {
    id: "AX-9821",
    title: "Mythical Glory — 72 Skins, All Heroes",
    sellerName: "DragonSlayer99",
    buyerName: "Iyere Godspower",
    price: 45000,
    status: "action_needed",
    type: "buy",
    timerRemaining: "18h 40m",
    accountDetails: {
      heroCount: 124,
      skinCount: 72,
      highestRank: "Mythical Glory 1200+ pts",
      loginMethod: "Clean Moonton Unbind Ready",
    },
  },
  {
    id: "AX-4412",
    title: "Mythic Immortal — Collector & Prime Skins",
    sellerName: "Iyere Godspower",
    buyerName: "ViperKing",
    price: 85000,
    status: "in_escrow",
    type: "sell",
    timerRemaining: "06h 15m",
    accountDetails: {
      heroCount: 124,
      skinCount: 145,
      highestRank: "Mythic Immortal",
      loginMethod: "Moonton Account Transfer",
    },
  },
];

export const mockListings: MLBBListing[] = [
  {
    id: "AX-3301",
    title: "Epic Rank — Collector Skins Pack",
    rank: "Epic I",
    skinsCount: 48,
    heroesCount: 95,
    price: 32000,
    status: "active",
    views: 48,
    featuredSkin: "Gusion Collector",
    sellerVerified: true,
  },
  {
    id: "AX-3302",
    title: "Mythic Honor — M-World & Aspirant Sets",
    rank: "Mythic Honor",
    skinsCount: 98,
    heroesCount: 118,
    price: 65000,
    status: "active",
    views: 112,
    featuredSkin: "Fanny Aspirant",
    sellerVerified: true,
  },
  {
    id: "AX-3303",
    title: "Legend Rank — Starter Smurf Account",
    rank: "Legend III",
    skinsCount: 22,
    heroesCount: 60,
    price: 15000,
    status: "sold",
    views: 230,
    featuredSkin: "Chou Legend",
    sellerVerified: false,
  },
];

export const mockTransactions: WalletTransaction[] = [
  {
    id: "TX-1001",
    type: "escrow_payout",
    amount: 32000,
    date: "Aug 12, 2026",
    status: "completed",
    description: "Payout for Order #AX-3301 (Collector Pack)",
  },
  {
    id: "TX-1002",
    type: "escrow_lock",
    amount: 45000,
    date: "Aug 14, 2026",
    status: "pending",
    description: "Locked in Escrow for Order #AX-9821",
  },
  {
    id: "TX-1003",
    type: "withdrawal",
    amount: 20000,
    date: "Aug 08, 2026",
    status: "completed",
    description: "Bank Transfer to Kuda Microfinance Bank",
  },
];

export interface GrowthDataPoint {
  month: string;
  volume: number;
  trades: number;
}

export const mockGrowthData: GrowthDataPoint[] = [
  { month: "Mar", volume: 25000, trades: 1 },
  { month: "Apr", volume: 42000, trades: 2 },
  { month: "May", volume: 80000, trades: 4 },
  { month: "Jun", volume: 65000, trades: 3 },
  { month: "Jul", volume: 110000, trades: 5 },
  { month: "Aug", volume: 165500, trades: 7 },
];

export const mockUserStats = {
  walletBalance: 120500,
  escrowLocked: 45000,
  activeBuyingOrdersCount: 1,
  activeListingsCount: 2,
  totalViews: 128,
};