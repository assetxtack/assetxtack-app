"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import NotificationDropdown from "../NotificationDropdown";
import { 
  Menu, 
  Search, 
  ChevronDown, 
  ShieldCheck,
  User,
  LogOut
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

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
            placeholder="Search MLBB ranks, heroes, skins, or order ID..."
            className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-9 pr-4 py-2 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 transition-colors"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {user && <NotificationDropdown userId={user.uid} />}

        {/* User Account Menu */}
        <div className="relative group">
          <button className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0B0E14] border border-[#242938] hover:border-[#FFB020]/30 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-xs flex items-center justify-center border border-[#7C5CFC]/30">
              I
            </div>
            <ChevronDown size={14} className="text-[#8A93A3] hidden sm:block" />
          </button>

          <div className="absolute right-0 mt-2 w-48 bg-[#151922] border border-[#242938] rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
            <div className="px-4 py-2 border-b border-[#242938]">
              <div className="text-xs font-bold text-[#EDEFF2]">Iyere</div>
              <div className="text-[10px] text-[#8A93A3]">iyere@example.com</div>
            </div>
            <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14]">
              <User size={14} /> Profile Settings
            </Link>
            <Link href="/wallet" className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#8A93A3] hover:text-[#EDEFF2] hover:bg-[#0B0E14]">
              <ShieldCheck size={14} /> Security & Payouts
            </Link>
            <div className="border-t border-[#242938] my-1" />
            <Link href="/sign-in" className="flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10">
              <LogOut size={14} /> Sign Out
            </Link>
          </div>
        </div>
      </div>

    </header>
  );
}
