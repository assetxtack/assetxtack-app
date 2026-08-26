"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes where public Navbar and Footer should be hidden
  const isDashboardRoute = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/my-listings") ||
    pathname.startsWith("/escrow") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/seller");

  if (isDashboardRoute) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}