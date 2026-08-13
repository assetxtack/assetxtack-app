"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Store, 
  PlusCircle, 
  ShieldCheck, 
  Wallet, 
  HelpCircle, 
  X,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

function XMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6L20 18" stroke="#FFB020" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 6L4 18" stroke="#7C5CFC" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 3.5L20 6L16 8.5" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 15.5L4 18L8 20.5" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-[var(--font-display)] font-bold text-[#EDEFF2]"
      style={{ fontSize: size }}
    >
      Asset
      <span className="inline-flex translate-y-[2px]">
        <XMark size={size * 0.9} />
      </span>
      tack
    </span>
  );
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "My Listings", href: "/my-listings", icon: PlusCircle },
  { name: "Escrow Orders", href: "/escrow", icon: ShieldCheck, badge: "Live" },
  { name: "Wallet & Payouts", href: "/wallet", icon: Wallet },
  { name: "Support & Disputes", href: "/support", icon: HelpCircle },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Dynamic user checks
  const isVerifiedSeller = (user as any)?.isVerified || false;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Iyere";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#151922] border-r border-[#242938]">
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-[#242938]">
        <Link href="/dashboard" className="flex items-center">
          <Wordmark size={22} />
        </Link>
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-[#8A93A3] hover:text-[#EDEFF2] p-1.5 rounded-lg bg-[#0B0E14]"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        <div className="px-3 mb-3 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 shadow-sm"
                  : "text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2]"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon size={20} className={isActive ? "text-[#FFB020]" : "text-[#8A93A3]"} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Quick Info & Sign Out Footer */}
      <div className="p-4 border-t border-[#242938] bg-[#0B0E14]/40">
        <div className="p-3.5 bg-[#0B0E14] rounded-xl border border-[#242938] flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] font-bold text-sm flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-sm font-bold text-[#EDEFF2] truncate">{displayName}</div>
              <div className={`text-xs font-medium flex items-center gap-1 ${isVerifiedSeller ? "text-emerald-400" : "text-amber-400"}`}>
                {isVerifiedSeller ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Verified Trader</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} />
                    <span>Unverified Seller</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isVerifiedSeller ? "bg-emerald-400" : "bg-amber-400"}`} />
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}