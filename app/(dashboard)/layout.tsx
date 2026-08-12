"use client";

import { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#EDEFF2] font-[var(--font-body)] flex">
      {/* Sidebar (Desktop persistent + Mobile overlay) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
    
  );
}