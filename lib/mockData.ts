// --- TYPES ---

export interface MarketListing {
  id: string;
  title: string;
  game: string;
  sellerName: string;
  sellerRating: number;
  sellerVerified: boolean;
  price: number;
  rank: string;
  winRate: string;
  heroesCount: number;
  skinsCount: number;
  emblemsMax: number;
  featuredSkins: string[];
  platform: string;
  status: "available" | "sold" | "reserved";
  images: string[];
}

export interface UserStats {
  walletBalance: number;
  escrowLocked: number;
  activeBuyingOrdersCount: number;
  activeListingsCount: number;
  totalViews: number;
}

export interface EscrowOrder {
  id: string;
  title: string;
  type: "buy" | "sell";
  price: number;
  status: "action_needed" | "in_escrow" | "completed" | "disputed";
  timerRemaining: string;
}

export interface GrowthDataPoint {
  month: string;
  volume: number;
}

export interface Transaction {
  id: string;
  type: "escrow_payout" | "escrow_lock" | "withdrawal";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

// --- DATA ---

export const mockUserStats: UserStats = {
  walletBalance: 245000,
  escrowLocked: 185000,
  activeBuyingOrdersCount: 1,
  activeListingsCount: 3,
  totalViews: 1420,
};

export const mockEscrowOrders: EscrowOrder[] = [
  {
    id: "ESC-9042",
    title: "Mythical Glory 1200+ Stars | All Collector Skins",
    type: "buy",
    price: 185000,
    status: "action_needed",
    timerRemaining: "18h 42m",
  },
  {
    id: "ESC-8810",
    title: "Mythic Immortal | Aspirants Set",
    type: "sell",
    price: 650000,
    status: "in_escrow",
    timerRemaining: "41h 10m",
  },
];

export const mockGrowthData: GrowthDataPoint[] = [
  { month: "Jan", volume: 450000 },
  { month: "Feb", volume: 520000 },
  { month: "Mar", volume: 610000 },
  { month: "Apr", volume: 780000 },
  { month: "May", volume: 950000 },
  { month: "Jun", volume: 1200000 },
];

export const mockTransactions: Transaction[] = [
  {
    id: "TX-9012",
    type: "escrow_payout",
    description: "Payout for ML-7430 Account Sale",
    amount: 185000,
    date: "Aug 14, 2026",
    status: "completed",
  },
  {
    id: "TX-8831",
    type: "escrow_lock",
    description: "Escrow Deposit - ML-9921",
    amount: 1200000,
    date: "Aug 13, 2026",
    status: "pending",
  },
  {
    id: "TX-7102",
    type: "withdrawal",
    description: "Bank Withdrawal (GTBank)",
    amount: 150000,
    date: "Aug 10, 2026",
    status: "completed",
  },
];

export const mockMarketListings: MarketListing[] = [
  {
    id: "ML-9921",
    title: "Mythical Glory 1200+ Stars | All Collector & Legend Skins | Collector Main",
    game: "Mobile Legends",
    sellerName: "RexxTrades",
    sellerRating: 4.9,
    sellerVerified: true,
    price: 1200000,
    rank: "Mythical Glory",
    winRate: "71.4%",
    heroesCount: 124,
    skinsCount: 480,
    emblemsMax: 7,
    featuredSkins: ["Gusion Legend", "Granger Legend", "Ling Collector", "Hayabusa 11.11"],
    platform: "Moonton (Clean Bind)",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
      "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
    ],
  },
  {
    id: "ML-8812",
    title: "Mythic Immortal | Prime Aspirants & KOF Complete Set",
    game: "Mobile Legends",
    sellerName: "CyberVault_NG",
    sellerRating: 4.8,
    sellerVerified: true,
    price: 650000,
    rank: "Mythic Immortal",
    winRate: "68.2%",
    heroesCount: 120,
    skinsCount: 310,
    emblemsMax: 7,
    featuredSkins: ["Chou KOF", "Fanny Aspirant", "Lesley Legend"],
    platform: "Moonton (Clean Bind)",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80",
      "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80"
    ],
  },
  {
    id: "ML-7430",
    title: "Mythical Honor | 118 Heroes | 190 Skins | 9 Max Emblems",
    game: "Mobile Legends",
    sellerName: "IyereStore",
    sellerRating: 5.0,
    sellerVerified: true,
    price: 185000,
    rank: "Mythical Honor",
    winRate: "61.5%",
    heroesCount: 118,
    skinsCount: 190,
    emblemsMax: 7,
    featuredSkins: ["Alucard Legend", "Lancelot Hero"],
    platform: "Moonton + Gmail",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
    ],
  },
  {
    id: "ML-5109",
    title: "Mythic 25 Stars | Clean Moonton Account | Cheap Starter Stack",
    game: "Mobile Legends",
    sellerName: "GamerPlug_Lagos",
    sellerRating: 4.6,
    sellerVerified: false,
    price: 45000,
    rank: "Mythic",
    winRate: "56.0%",
    heroesCount: 85,
    skinsCount: 92,
    emblemsMax: 6,
    featuredSkins: ["Zilong Epic", "Saber Epic"],
    platform: "Moonton Only",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
      "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
    ],
  },
  {
    id: "ML-3201",
    title: "Legend I Account | Fast Delivery | Ready for Push",
    game: "Mobile Legends",
    sellerName: "Alpha_Trader",
    sellerRating: 4.7,
    sellerVerified: true,
    price: 25000,
    rank: "Legend",
    winRate: "54.2%",
    heroesCount: 60,
    skinsCount: 45,
    emblemsMax: 4,
    featuredSkins: ["Miya Special"],
    platform: "Moonton Only",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
      "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
    ],
  },
];