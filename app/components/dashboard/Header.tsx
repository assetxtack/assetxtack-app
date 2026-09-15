"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import NotificationDropdown from "../NotificationDropdown";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Menu,
  Search,
  ChevronDown,
  User,
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  LogOut,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  // ADDED: dropdown open state + outside-click ref (moved over from Navbar.tsx)
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ADDED: live user data (fullName, verification status) so we show the real name + badge, not a static "Profile" label
  const [userData, setUserData] = useState<{ fullName?: string; sellerVerified?: boolean; kycStatus?: string } | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as { fullName?: string; sellerVerified?: boolean; kycStatus?: string });
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // ADDED: close dropdown on outside click (same pattern as Navbar.tsx)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isVerified = Boolean(userData?.sellerVerified === true || userData?.kycStatus === "VERIFIED");
  const displayName = userData?.fullName || user?.displayName || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-[#151922] border-b border-[#242938] sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4">
      
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#8A93A3] hover:text-[#EDEFF2] rounded-lg hover:bg-[#0B0E14]"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
          <input
            type="text"
            placeholder="Search listings, ranks, or order ID..."
            className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-4 py-2 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {user && <NotificationDropdown userId={user.uid} />}

        {/* CHANGED: static Link replaced with working dropdown (moved from Navbar.tsx) */}
        <div className="relative" ref={dropdownRef}>
                    <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#242938] hover:border-[#FFB020]/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-sm flex items-center justify-center border border-[#7C5CFC]/30 shrink-0">
              {userInitial}
            </div>
            {/* REMOVED: name span — just showing the initial avatar + chevron now, per feedback */}
            <ChevronDown size={14} className={`text-[#8A93A3] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#151922] border border-[#242938] rounded-2xl shadow-2xl overflow-hidden z-50">
              {/* Profile Header */}
              <div className="p-4 border-b border-[#242938] bg-[#0B0E14]/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] font-bold text-lg flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-[#EDEFF2] truncate">{displayName}</div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${isVerified ? "text-emerald-400" : "text-amber-400"}`}>
                      {isVerified ? (
                        <>
                          <ShieldCheck size={14} />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} />
                          <span>Unverified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#EDEFF2] hover:bg-[#0B0E14] transition-colors"
                >
                  <User size={18} className="text-[#FFB020]" />
                  My Profile & Reviews
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#EDEFF2] hover:bg-[#0B0E14] transition-colors"
                >
                  <LayoutDashboard size={18} className="text-[#7C5CFC]" />
                  Dashboard
                </Link>
              </div>

              {/* Sign Out */}
              <div className="p-2 border-t border-[#242938]">
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}