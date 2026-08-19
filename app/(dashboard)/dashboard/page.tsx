"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import AssetGrowthChart from "../../components/AssetGrowthChart";
import RecentTransactions from "../../components/RecentTransactions";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  or, 
  onSnapshot,
  doc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { 
  Wallet, 
  ShieldCheck, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Store,
  ChevronRight,
  TrendingUp,
  Loader2,
  PackageX
} from "lucide-react";

interface FirestoreOrder {
  id: string;
  title: string;
  amount: number;
  buyerId: string;
  sellerId: string;
  sellerName?: string;
  status: "IN_ESCROW" | "AWAITING_DELIVERY" | "DELIVERED" | "DISPUTED" | "COMPLETED" | string;
  createdAt?: Timestamp | Date | string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Filter tab state ('all' | 'buying' | 'selling')
  const [activeTab, setActiveTab] = useState<"all" | "buying" | "selling">("all");

  // Dynamic metrics computed directly from Firestore state
  const [escrowLockedTotal, setEscrowLockedTotal] = useState(0);
  const [buyingOrdersCount, setBuyingOrdersCount] = useState(0);
  const [sellingOrdersCount, setSellingOrdersCount] = useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setLoadingOrders(false);
      return;
    }

    // Fetch user KYC verification status from Firestore
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsVerified(Boolean(userData?.sellerVerified || userData?.isVerified));
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
        setIsVerified(false);
      }
    };

    fetchUserData();

    // Dynamic Firestore query: fetch orders where user is buyer OR seller
    const ordersQuery = query(
      collection(db, "orders"),
      or(
        where("buyerId", "==", currentUser.uid),
        where("sellerId", "==", currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders: FirestoreOrder[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FirestoreOrder, "id">),
        }));

        setOrders(fetchedOrders);

        let lockedSum = 0;
        let buyingCount = 0;
        let sellingCount = 0;

        const activeStatuses = new Set([
          "IN_ESCROW",
          "DISPUTED",
          "AWAITING_DELIVERY",
          "DELIVERED"
        ]);

        fetchedOrders.forEach((order) => {
          const orderAmount = Number(order.amount) || 0;

          // Count active order participation by role
          if (order.buyerId === currentUser.uid) {
            buyingCount++;
            // Sum locked funds paid into escrow by the user as a buyer
            if (activeStatuses.has(order.status)) {
              lockedSum += orderAmount;
            }
          }

          if (order.sellerId === currentUser.uid) {
            sellingCount++;
          }
        });

        setEscrowLockedTotal(lockedSum);
        setBuyingOrdersCount(buyingCount);
        setSellingOrdersCount(sellingCount);
        setLoadingOrders(false);
      },
      (error) => {
        console.error("Error fetching live orders:", error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle routing rule for "List Account" action based on KYC verification
  const handleListAccountClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isVerified) {
        router.push("/my-listings");
      } else {
        router.push("/my-listings");
      }
    },
    [isVerified, router]
  );

  // Tab Filtering logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "buying") return order.buyerId === currentUser?.uid;
      if (activeTab === "selling") return order.sellerId === currentUser?.uid;
      return true;
    });
  }, [orders, activeTab, currentUser]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
              Dashboard Overview
            </h1>
            <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
              Track your escrow orders, active listings, and wallet balance in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/marketplace" 
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#151922] border border-[#242938] text-[#EDEFF2] hover:border-[#FFB020]/40 transition-colors"
            >
              <Store size={16} className="text-[#FFB020] shrink-0" />
              <span>Browse Market</span>
            </Link>

            {/* List Account Button with KYC Guard */}
            <button
              type="button"
              onClick={handleListAccountClick}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle size={16} className="shrink-0" />
              <span>List Account</span>
            </button>
          </div>
        </div>

        {/* Dynamic Financial & Trade Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Wallet Balance */}
          <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3]">Available Wallet</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Wallet size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#EDEFF2]">
                {formatNaira(0)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[#8A93A3]">Ready for payout</span>
                <Link href="/wallet" className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1">
                  Withdraw <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic Escrow Vault Total */}
          <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3]">In Escrow Vault</span>
              <div className="p-2 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] shrink-0">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#EDEFF2]">
                {formatNaira(escrowLockedTotal)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[#8A93A3]">
                  {orders.length} Active {orders.length === 1 ? "Order" : "Orders"}
                </span>
                <Link href="/escrow" className="text-xs font-bold text-[#7C5CFC] hover:underline flex items-center gap-1">
                  View Escrow <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic Buying Orders Metric */}
          <div 
            onClick={() => setActiveTab("buying")}
            className={`p-5 bg-[#151922] border rounded-2xl flex flex-col justify-between cursor-pointer transition-colors ${
              activeTab === "buying" ? "border-[#7C5CFC]" : "border-[#242938] hover:border-[#7C5CFC]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3]">Buying Orders</span>
              <div className="p-2 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] shrink-0">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#EDEFF2]">
                {buyingOrdersCount} Active
              </div>
              <p className="text-[11px] text-[#8A93A3] mt-2">Click to filter buying trades</p>
            </div>
          </div>

          {/* Dynamic Selling Orders Metric */}
          <div 
            onClick={() => setActiveTab("selling")}
            className={`p-5 bg-[#151922] border rounded-2xl flex flex-col justify-between cursor-pointer transition-colors ${
              activeTab === "selling" ? "border-[#FFB020]" : "border-[#242938] hover:border-[#FFB020]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3]">Sales Orders</span>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#EDEFF2]">
                {sellingOrdersCount} Active
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[#8A93A3]">
                  Click to filter sales
                </span>
                <Link href="/my-listings" className="text-xs font-bold text-[#FFB020] hover:underline flex items-center gap-1">
                  Listings <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Asset Growth / Escrow Trade Volume Chart */}
        <div className="w-full">
          <AssetGrowthChart />
        </div>

        {/* Active Escrow Trades Section with Tab Toggles */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#242938] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-[var(--font-display)] font-bold text-base text-[#EDEFF2]">
                Active Escrow Transactions
              </h2>
              <p className="text-xs text-[#8A93A3]">Live Firestore trades requiring buyer or seller action.</p>
            </div>

            {/* Toggle Switch Pills */}
            <div className="flex items-center bg-[#0B0E14] p-1 rounded-xl border border-[#242938]">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-[#242938] text-[#EDEFF2] shadow-sm"
                    : "text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buying")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "buying"
                    ? "bg-[#7C5CFC] text-white shadow-sm"
                    : "text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                Buying ({buyingOrdersCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("selling")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "selling"
                    ? "bg-[#FFB020] text-[#0B0E14] shadow-sm"
                    : "text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                Selling ({sellingOrdersCount})
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-[#8A93A3]">
              <Loader2 size={24} className="animate-spin text-[#FFB020]" />
              <p className="text-xs">Fetching live escrow orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <PackageX size={32} className="text-[#8A93A3] mb-1" />
              <h3 className="text-sm font-bold text-[#EDEFF2]">
                No {activeTab !== "all" ? activeTab : ""} orders found
              </h3>
              <p className="text-xs text-[#8A93A3]">
                {activeTab === "buying" 
                  ? "You haven't bought any accounts yet." 
                  : activeTab === "selling"
                  ? "You don't have any sales in escrow."
                  : "Buy an account from the marketplace or create a listing to see trades here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#242938]">
              {filteredOrders.map((order) => {
                const isBuyer = currentUser?.uid === order.buyerId;
                const roleType = isBuyer ? "BUY" : "SELL";

                return (
                  <div 
                    key={order.id} 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#0B0E14]/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Badge identifying BUY vs SELL */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                        isBuyer
                          ? "bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC]" 
                          : "bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020]"
                      }`}>
                        {roleType}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#EDEFF2]">{order.title || "Untitled Order"}</span>

                          {/* Dynamic Status Badges */}
                          {(order.status === "IN_ESCROW" || order.status === "AWAITING_DELIVERY") && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              In Escrow
                            </span>
                          )}
                          {order.status === "DELIVERED" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Credentials Delivered
                            </span>
                          )}
                          {order.status === "DISPUTED" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Disputed
                            </span>
                          )}
                          {order.status === "COMPLETED" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#8A93A3] mt-1 flex flex-wrap items-center gap-3">
                          <span>Order ID: <strong className="text-[#EDEFF2]">#{order.id}</strong></span>
                          <span>•</span>
                          <span>Amount: <strong className="text-emerald-400">{formatNaira(order.amount || 0)}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#FFB020]">
                            <Clock size={12} /> 24-Hour Hold Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Context-Aware Dynamic Navigation Button */}
                    <div className="flex items-center gap-3 justify-end">
                      <Link 
                        href={`/orders/${order.id}`} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                          order.status === "DISPUTED"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-[#7C5CFC] hover:bg-[#6847ec]"
                        }`}
                      >
                        {isBuyer ? (
                          order.status === "DELIVERED" ? "Inspect Credentials" :
                          order.status === "DISPUTED" ? "View Dispute Room" : "View Order Room"
                        ) : (
                          order.status === "AWAITING_DELIVERY" || order.status === "IN_ESCROW" ? "Submit Credentials" :
                          order.status === "DISPUTED" ? "View Dispute Room" : "View Order Room"
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Wallet Activity Table */}
        <RecentTransactions />

      </div>
    </AuthGuard>
  );
}