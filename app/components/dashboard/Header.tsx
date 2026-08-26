"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import NotificationDropdown from "../NotificationDropdown";
import { 
  Menu, 
  Search, 
  ChevronDown
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
        <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#242938] hover:border-[#FFB020]/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-sm flex items-center justify-center border border-[#7C5CFC]/30">
            I
          </div>
          <span className="text-sm font-semibold text-[#EDEFF2]">Profile</span>
          <ChevronDown size={14} className="text-[#8A93A3]" />
        </Link>
      </div>

    </header>
  );
}
