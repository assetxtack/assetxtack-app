"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, or, query, where } from "firebase/firestore";
import { ArrowRight, Clock, PackageX, ShieldCheck, Filter } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";
import { db } from "@/lib/firebase";

type EscrowOrder = {
  id: string;
  title?: string;
  amount?: number;
  buyerId?: string;
  sellerId?: string;
  status?: string;
};

type FilterTab = "ALL" | "ACTIVE" | "COMPLETED" | "DISPUTED";

export default function EscrowOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      or(where("buyerId", "==", user.uid), where("sellerId", "==", user.uid))
    );

    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(
          snapshot.docs.map((order) => ({
            id: order.id,
            ...(order.data() as Omit<EscrowOrder, "id">),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Unable to load escrow orders:", error);
        setLoading(false);
      }
    );
  }, [user?.uid]);

  const isLoading = authLoading || (Boolean(user?.uid) && loading);

  // Status badge styling helper
  const getStatusBadge = (status?: string) => {
    const normStatus = (status || "IN_ESCROW").toUpperCase();
    switch (normStatus) {
      case "COMPLETED":
      case "RELEASED":
        return {
          label: "COMPLETED",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "DISPUTED":
        return {
          label: "DISPUTED",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
        };
      case "CANCELLED":
        return {
          label: "CANCELLED",
          className: "bg-slate-800 text-slate-400 border-slate-700",
        };
      case "IN_ESCROW":
      case "PENDING":
      default:
        return {
          label: "IN ESCROW",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    const normStatus = (order.status || "IN_ESCROW").toUpperCase();
    if (activeTab === "ACTIVE") {
      return normStatus === "IN_ESCROW" || normStatus === "PENDING";
    }
    if (activeTab === "COMPLETED") {
      return normStatus === "COMPLETED" || normStatus === "RELEASED";
    }
    if (activeTab === "DISPUTED") {
      return normStatus === "DISPUTED";
    }
    return true; // ALL
  });

  return (
    <AuthGuard>
      <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <header className="bg-[#151922] p-6 rounded-2xl border border-[#242938]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#7C5CFC] bg-[#7C5CFC]/10 px-2.5 py-1 rounded-md border border-[#7C5CFC]/20">
              Vault Secured
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live orders
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] mt-2 font-display flex items-center gap-2">
            <ShieldCheck className="text-[#FFB020]" size={24} /> Escrow Orders & Vault
          </h1>
          <p className="text-xs text-[#8A93A3] mt-1">
            Open an order to deliver credentials, inspect them, raise a dispute, or release escrow funds.
          </p>
        </header>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#242938]">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-[#FFB020] text-slate-950 shadow-md shadow-[#FFB020]/10"
                : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2] border border-[#242938]"
            }`}
          >
            <Filter size={12} /> All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "ACTIVE"
                ? "bg-[#FFB020] text-slate-950 shadow-md shadow-[#FFB020]/10"
                : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2] border border-[#242938]"
            }`}
          >
            Active Escrow (
            {
              orders.filter((o) => {
                const s = (o.status || "IN_ESCROW").toUpperCase();
                return s === "IN_ESCROW" || s === "PENDING";
              }).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "COMPLETED"
                ? "bg-[#FFB020] text-slate-950 shadow-md shadow-[#FFB020]/10"
                : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2] border border-[#242938]"
            }`}
          >
            Completed (
            {
              orders.filter((o) => {
                const s = (o.status || "").toUpperCase();
                return s === "COMPLETED" || s === "RELEASED";
              }).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("DISPUTED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "DISPUTED"
                ? "bg-[#FFB020] text-slate-950 shadow-md shadow-[#FFB020]/10"
                : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2] border border-[#242938]"
            }`}
          >
            Disputes (
            {
              orders.filter((o) => (o.status || "").toUpperCase() === "DISPUTED").length
            }
            )
          </button>
        </div>

        {/* Orders Content Area */}
        {isLoading ? (
          <section className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-[#151922] border border-[#242938] rounded-2xl animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[#242938] rounded" />
                  <div className="h-5 w-64 bg-[#242938] rounded" />
                  <div className="h-3 w-40 bg-[#242938] rounded" />
                </div>
                <div className="h-4 w-20 bg-[#242938] rounded" />
              </div>
            ))}
          </section>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-[#151922] border border-[#242938] rounded-2xl">
            <PackageX className="mx-auto text-[#8A93A3] mb-3" size={32} />
            <h2 className="text-sm font-bold text-[#EDEFF2]">No orders found</h2>
            <p className="text-xs text-[#8A93A3] mt-1">
              {activeTab === "ALL"
                ? "You don't have any active or previous escrow orders."
                : `No orders match the "${activeTab}" status.`}
            </p>
            <Link
              href="/marketplace"
              className="inline-block mt-3 text-xs font-bold text-[#FFB020] hover:underline"
            >
              Browse marketplace →
            </Link>
          </div>
        ) : (
          <section className="space-y-3">
            {filteredOrders.map((order) => {
              const isSeller = order.sellerId === user?.uid;
              const statusBadge = getStatusBadge(order.status);

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block bg-[#151922] border border-[#242938] hover:border-[#FFB020]/50 rounded-2xl p-5 transition-all hover:translate-x-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Shield Icon Container */}
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0E14] border border-[#242938] text-[#FFB020]">
                        <ShieldCheck size={20} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-0.5 rounded border border-[#FFB020]/20">
                            #{order.id}
                          </span>
                          <span className="text-[10px] font-bold text-[#EDEFF2] bg-[#0B0E14] px-2 py-0.5 rounded border border-[#242938]">
                            {isSeller ? "SELLER" : "BUYER"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <h2 className="mt-2 text-sm font-bold text-[#EDEFF2] group-hover:text-amber-400 transition-colors">
                          {order.title || "Escrow account trade"}
                        </h2>
                        <p className="mt-1 text-xs text-[#8A93A3] flex items-center gap-1 font-mono">
                          <Clock size={12} /> ₦
                          {Number(order.amount || 0).toLocaleString()} secured in escrow
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FFB020] group-hover:translate-x-1 transition-transform">
                      Open order <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </AuthGuard>
  );
}