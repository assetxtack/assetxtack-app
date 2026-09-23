"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  MessageSquare,
  ShieldCheck,
  Package,
  Bell,
  Ticket,
  CreditCard,
  Wallet,
  ShieldAlert,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";

interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ADMIN_NAV: AdminNavItem[] = [
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Chats", href: "/admin/chats", icon: MessageSquare },
  { name: "Escrow Audit", href: "/admin/escrow-audit", icon: ShieldCheck },
  { name: "Listings", href: "/admin/listings", icon: Package },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Support Tickets", href: "/admin/support-tickets", icon: Ticket },
  { name: "Wallet Transactions", href: "/admin/wallet-transactions", icon: CreditCard },
  { name: "Withdrawal Requests", href: "/admin/withdrawal-requests", icon: Wallet },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (!authUser) {
        router.push("/sign-in");
        setLoading(false);
        return;
      }

      const unsubDoc = onSnapshot(doc(db, "users", authUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const admin = data?.role === "admin" || data?.isAdmin === true;
          setIsAdmin(admin);
          if (!admin) {
            router.push("/dashboard");
          }
        } else {
          setIsAdmin(false);
          router.push("/dashboard");
        }
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsubscribe();
  }, [router]);

  const handleNavClick = useCallback(
    (href: string) => {
      router.push(href);
      setMobileSidebarOpen(false);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#FFB020]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <ShieldAlert size={64} className="mx-auto text-rose-400" />
          <h1 className="text-2xl font-bold text-[#EDEFF2]">Access Denied</h1>
          <p className="text-base text-[#8A93A3]">
            You do not have admin privileges to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFB020] text-[#0B0E14] font-bold text-base hover:bg-[#ffa500] transition"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-[#151922] border-r border-[#242938]">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#242938]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#FFB020]" />
            <span className="font-[var(--font-display)] font-extrabold text-lg text-[#EDEFF2]">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden ml-auto text-[#8A93A3] hover:text-[#EDEFF2] p-1.5 rounded-lg bg-[#0B0E14]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 mb-3 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">
            Admin Panel
          </div>
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 shadow-sm"
                    : "text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2]"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#FFB020]" : "text-[#8A93A3]"} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#242938]">
          <div className="text-xs text-[#8A93A3] font-mono">
            {user?.email || user?.displayName || "Admin"}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] z-10 bg-[#151922] border-r border-[#242938] h-full overflow-y-auto">
            <div className="h-20 flex items-center justify-between px-6 border-b border-[#242938]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} className="text-[#FFB020]" />
                <span className="font-[var(--font-display)] font-extrabold text-lg text-[#EDEFF2]">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-[#8A93A3] hover:text-[#EDEFF2] p-1.5 rounded-lg bg-[#0B0E14]"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 shadow-sm"
                        : "text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2]"
                    }`}
                  >
                    <Icon size={20} className={isActive ? "text-[#FFB020]" : "text-[#8A93A3]"} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 flex items-center gap-3 px-4 border-b border-[#242938] bg-[#0B0E14]/90 backdrop-blur-md sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-[#8A93A3] hover:bg-[#151922] transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#FFB020]" />
            <span className="font-[var(--font-display)] font-bold text-sm text-[#EDEFF2]">
              Admin Panel
            </span>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
