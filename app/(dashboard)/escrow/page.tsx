"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, or, query, where } from "firebase/firestore";
import { ArrowRight, Clock, PackageX, ShieldCheck } from "lucide-react";
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

export default function EscrowOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
        setOrders(snapshot.docs.map((order) => ({
          id: order.id,
          ...(order.data() as Omit<EscrowOrder, "id">),
        })));
        setLoading(false);
      },
      (error) => {
        console.error("Unable to load escrow orders:", error);
        setLoading(false);
      }
    );
  }, [user?.uid]);

  const isLoading = authLoading || (Boolean(user?.uid) && loading);

  return (
    <AuthGuard>
      <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <header className="bg-[#151922] p-6 rounded-2xl border border-[#242938]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#7C5CFC] bg-[#7C5CFC]/10 px-2.5 py-1 rounded-md border border-[#7C5CFC]/20">Vault Secured</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live orders</span>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEFF2] mt-2 font-display flex items-center gap-2"><ShieldCheck className="text-[#FFB020]" size={24} /> Escrow Orders & Vault</h1>
          <p className="text-xs text-[#8A93A3] mt-1">Open an order to deliver credentials, inspect them, raise a dispute, or release escrow funds.</p>
        </header>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#8A93A3] bg-[#151922] border border-[#242938] rounded-2xl">Loading your escrow orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center bg-[#151922] border border-[#242938] rounded-2xl">
            <PackageX className="mx-auto text-[#8A93A3] mb-3" size={32} />
            <h2 className="text-sm font-bold text-[#EDEFF2]">No escrow orders yet</h2>
            <Link href="/marketplace" className="inline-block mt-2 text-xs font-bold text-[#FFB020] hover:underline">Browse marketplace</Link>
          </div>
        ) : (
          <section className="space-y-3">
            {orders.map((order) => {
              const isSeller = order.sellerId === user?.uid;
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="block bg-[#151922] border border-[#242938] hover:border-[#FFB020]/50 rounded-2xl p-5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-1 rounded border border-[#FFB020]/20">#{order.id}</span>
                        <span className="text-[10px] font-bold text-[#EDEFF2] bg-[#0B0E14] px-2 py-1 rounded border border-[#242938]">{isSeller ? "SELLER" : "BUYER"}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{order.status || "IN_ESCROW"}</span>
                      </div>
                      <h2 className="mt-2 text-sm font-bold text-[#EDEFF2]">{order.title || "Escrow account trade"}</h2>
                      <p className="mt-1 text-xs text-[#8A93A3] flex items-center gap-1"><Clock size={12} /> ₦{Number(order.amount || 0).toLocaleString()} secured in escrow</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FFB020]">Open order <ArrowRight size={14} /></span>
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
