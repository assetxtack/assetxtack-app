"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, User, ChevronDown, ShieldCheck, ShieldAlert, Star, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

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
    <Link
      href="/"
      className="inline-flex items-center gap-1 font-[var(--font-display)] font-bold text-[#EDEFF2] hover:opacity-90 transition-opacity shrink-0"
      style={{ fontSize: size }}
    >
      Asset
      <span className="inline-flex translate-y-[2px]">
        <XMark size={size * 0.95} />
      </span>
      tack
    </Link>
  );
}

// PUBLIC HOMEPAGE LINKS
const PUBLIC_NAV_LINKS = [
  { label: "Overview", href: "/#overview", isAnchor: true, sectionId: "overview" },
  { label: "How It Works", href: "/#how", isAnchor: true, sectionId: "how" },
  { label: "Escrow Protection", href: "/#escrow", isAnchor: true, sectionId: "escrow" },
  { label: "FAQ", href: "/#faq", isAnchor: true, sectionId: "faq" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ fullName?: string; sellerVerified?: boolean; kycStatus?: string } | null>(null);
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as { fullName?: string; sellerVerified?: boolean; kycStatus?: string });
      }
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId?: string) => {
    if (!sectionId) return;

    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = sectionId;
      }
    }
  };

  const isVerified = Boolean(userData?.sellerVerified === true || userData?.kycStatus === "VERIFIED");
  const displayName = userData?.fullName || user?.displayName || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#242938] transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Wordmark size={22} />

        {/* AUTHENTICATED USER NAV */}
        {!loading && user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#EDEFF2] px-4 py-2.5 rounded-xl border border-[#242938] bg-[#151922]/60 hover:bg-[#151922] transition-all"
            >
              <LayoutDashboard className="w-5 h-5 text-[#FFB020]" />
              Dashboard
            </Link>

            {/* Real-time Notification Component */}
            <NotificationDropdown userId={user.uid} />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#242938] bg-[#151922]/60 hover:bg-[#151922] hover:border-[#FFB020]/30 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] font-bold text-sm flex items-center justify-center">
                  {userInitial}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-[#EDEFF2] max-w-[100px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={16} className={`text-[#8A93A3] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#151922] border border-[#242938] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-[#242938] bg-[#0B0E14]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] font-bold text-lg flex items-center justify-center">
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
                      href="/dashboard/profile"
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
        ) : (
          /* PUBLIC VISITOR NAV */
          <>
            <nav className="hidden md:flex items-center gap-3 text-sm">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => link.isAnchor && handleAnchorClick(e, link.sectionId)}
                  className="text-[#8A93A3] hover:text-[#EDEFF2] px-3.5 py-2 rounded-xl border border-transparent hover:border-[#242938] hover:bg-[#151922]/60 transition-all duration-200 font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-[#EDEFF2] px-4.5 py-2.5 rounded-xl border border-[#242938] bg-[#151922]/40 hover:bg-[#151922] hover:border-[#FFB020]/50 transition-all duration-200"
              >
                Sign in
              </Link>

              <Link
                href="/sign-in?mode=signup"
                className="text-sm font-semibold text-[#0B0E14] bg-[#FFB020] hover:bg-[#ffa500] px-4.5 py-2.5 rounded-xl border border-transparent hover:border-[#EDEFF2] shadow-sm transition-all duration-200"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden p-2 text-[#EDEFF2] hover:text-white rounded-xl border border-[#242938] bg-[#151922]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}
      </div>

      {/* MOBILE MENU (Public Visitors Only) */}
      {!user && menuOpen && (
        <div className="md:hidden px-6 pb-6 pt-3 flex flex-col gap-2.5 border-t border-[#242938] bg-[#0B0E14]">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (link.isAnchor) handleAnchorClick(e, link.sectionId);
                setMenuOpen(false);
              }}
              className="text-sm font-medium text-[#8A93A3] hover:text-[#EDEFF2] px-3.5 py-2.5 rounded-xl border border-transparent hover:border-[#242938] hover:bg-[#151922] transition-all"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-[#242938] mt-2 grid grid-cols-2 gap-3">
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#EDEFF2] bg-[#151922] border border-[#242938] hover:border-[#FFB020] text-center transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/sign-in?mode=signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#FFB020] text-[#0B0E14] text-center transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}