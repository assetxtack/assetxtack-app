"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthGuard from "../../../components/AuthGuard";
import { mockMarketListings } from "@/lib/mockData";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Star, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  Lock, 
  Layers, 
  Award, 
  UserCheck, 
  Smartphone,
  Check,
  FileText,
  Image as ImageIcon,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const listing = mockMarketListings.find((item) => item.id === resolvedParams.id);
  
  const [activeTab, setActiveTab] = useState<"overview" | "binds" | "gallery">("overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!listing) {
    notFound();
  }

  // Ensure listing.images has fallback array if empty
  const screenshots = listing.images && listing.images.length > 0 ? listing.images : [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
    "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
    "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&q=80",
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80"
  ];

  const isProtected = listing.sellerVerified;

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <AuthGuard>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8A93A3] hover:text-[#EDEFF2] transition-colors bg-[#151922] px-3.5 py-2 rounded-xl border border-[#242938]"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>

          <span className="text-xs font-semibold text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
            Listing ID: <strong className="text-[#EDEFF2]">{listing.id}</strong>
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Account Title Banner */}
            <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                {isProtected ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020]">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      AssetXtack Shield Protected
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8A93A3]/10 border border-[#8A93A3]/20 text-[#8A93A3]">
                    <ShieldAlert size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Standard Listing
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-[#0B0E14] px-3 py-1.5 rounded-xl border border-[#242938]">
                  <span className="text-xs font-bold text-[#EDEFF2]">{listing.sellerName}</span>
                  {listing.sellerVerified && <CheckCircle2 size={14} className="text-emerald-400" />}
                  <span className="text-xs text-[#8A93A3]">|</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#FFB020]">
                    <Star size={12} fill="#FFB020" /> {listing.sellerRating}
                  </div>
                </div>
              </div>

              <h1 className="font-extrabold text-xl md:text-2xl text-[#EDEFF2] leading-snug">
                {listing.title}
              </h1>

              {/* Quick Specs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
                  <Smartphone size={14} className="text-[#FFB020]" />
                  <span>Platform: <strong className="text-[#EDEFF2]">{listing.platform}</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3] bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938]">
                  <KeyRound size={14} className="text-emerald-400" />
                  <span>Credentials Status: <strong className="text-emerald-400">Vault Verified & Ready</strong></span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#242938] pb-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <FileText size={14} /> Overview & Specs
              </button>
              <button
                onClick={() => setActiveTab("binds")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "binds"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <KeyRound size={14} /> Binds & Security Info
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "gallery"
                    ? "bg-[#FFB020] text-[#0B0E14]"
                    : "bg-[#151922] text-[#8A93A3] hover:text-[#EDEFF2]"
                }`}
              >
                <ImageIcon size={14} /> Screenshots ({screenshots.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Rank</span>
                    <strong className="text-sm md:text-base font-extrabold text-[#EDEFF2] block mt-1">{listing.rank}</strong>
                  </div>
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Skins Count</span>
                    <strong className="text-sm md:text-base font-extrabold text-[#FFB020] block mt-1">{listing.skinsCount}</strong>
                  </div>
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Win Rate</span>
                    <strong className="text-sm md:text-base font-extrabold text-emerald-400 block mt-1">{listing.winRate}</strong>
                  </div>
                  <div className="bg-[#151922] border border-[#242938] p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] block">Max Emblems</span>
                    <strong className="text-sm md:text-base font-extrabold text-[#EDEFF2] block mt-1">{listing.emblemsMax} / 7</strong>
                  </div>
                </div>

                {/* Featured Rare Skins */}
                <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FFB020]" /> Featured Rare Skins & Items
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {listing.featuredSkins.map((skin, idx) => (
                      <div
                        key={idx}
                        className="bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 text-[#9d85fc] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                      >
                        <Award size={14} className="text-[#FFB020]" /> {skin}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller Description */}
                <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-[#EDEFF2]">Seller Notes</h3>
                  <p className="text-xs text-[#8A93A3] leading-relaxed">
                    Maintained account with full event skins, high win-rate, clean email transfer, and zero sanctions. Complete login control (Moonton account + dedicated Gmail) handed over immediately upon Escrow deposit lock.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "binds" && (
              <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-[#EDEFF2]">Account Bind & Security Checklist</h3>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl border border-[#242938]">
                    <span className="text-xs text-[#EDEFF2]">Moonton Account Unbind / Transferable</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} /> Available
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl border border-[#242938]">
                    <span className="text-xs text-[#EDEFF2]">Associated Gmail / Recovery Included</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} /> Yes (Full Access)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl border border-[#242938]">
                    <span className="text-xs text-[#EDEFF2]">TikTok / Facebook Binds</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} /> Clean / Disconnected
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-xl border border-[#242938]">
                    <span className="text-xs text-[#EDEFF2]">Rebind Cooldown</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={14} /> 0 Days (Instant Change)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#FFB020]" /> Verified Screenshots ({screenshots.length})
                  </h3>
                  <span className="text-xs font-semibold text-[#8A93A3]">
                    Showing {activeImageIndex + 1} of {screenshots.length}
                  </span>
                </div>

                {/* Main Large Image Viewer */}
                <div className="relative w-full h-[320px] md:h-[420px] bg-[#0B0E14] rounded-2xl border border-[#242938] overflow-hidden group">
                  {/* Image */}
                  <img 
                    src={screenshots[activeImageIndex]} 
                    alt={`Screenshot ${activeImageIndex + 1}`} 
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Previous / Next Controls */}
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 hover:bg-[#FFB020] hover:text-[#0B0E14] text-white p-2 rounded-xl transition-all border border-[#242938]"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 hover:bg-[#FFB020] hover:text-[#0B0E14] text-white p-2 rounded-xl transition-all border border-[#242938]"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Watermark Protection */}
                  <div className="absolute top-3 left-3 bg-[#0B0E14]/70 backdrop-blur-md text-[10px] text-[#FFB020] font-extrabold px-2.5 py-1 rounded-lg border border-[#FFB020]/20 flex items-center gap-1">
                    <ShieldCheck size={12} /> AssetXtack Verified
                  </div>
                </div>

                {/* 8-Image Scrollable Thumbnail Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#FFB020]">
                  {screenshots.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-20 h-14 rounded-xl border-2 overflow-hidden transition-all ${
                        activeImageIndex === idx
                          ? "border-[#FFB020] scale-105 shadow-md shadow-[#FFB020]/20"
                          : "border-[#242938] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold bg-[#0B0E14]/80 px-1 rounded text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Escrow Guarantee Banner */}
            <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
              <h3 className="font-bold text-sm text-[#EDEFF2] flex items-center gap-2">
                <Lock size={16} className="text-emerald-400" /> AssetXtack Vault Protection
              </h3>
              <p className="text-xs text-[#8A93A3]">
                Credentials (Email and Password) are released securely in the Escrow dashboard immediately after payment is held in the vault. If the credentials don't match the listing description, your funds are refunded 100%.
              </p>
            </div>

          </div>

          {/* Right Column: Checkout Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-6">
              
              <div>
                <span className="text-xs text-[#8A93A3] font-bold uppercase tracking-wider block">Escrow Price</span>
                <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
                  {formatNaira(listing.price)}
                </div>
                <p className="text-[11px] text-[#8A93A3] mt-1">
                  Funds held securely in vault until credential transfer is verified by you.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => alert(`Initiating Escrow Vault lock for ${listing.id}...`)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FFB020] to-[#ffa500] text-[#0B0E14] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFB020]/10"
                >
                  <Zap size={16} fill="#0B0E14" /> Proceed to Escrow Vault
                </button>

                <p className="text-[10px] text-center text-[#8A93A3]">
                  🔒 Credentials revealed after deposit is locked in Vault.
                </p>
              </div>

              <div className="border-t border-[#242938] pt-4 space-y-3">
                <span className="text-[11px] font-bold text-[#EDEFF2] block">Seller Trust Info</span>
                <div className="flex items-center justify-between text-xs text-[#8A93A3]">
                  <span className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-[#FFB020]" /> Rating
                  </span>
                  <strong className="text-[#EDEFF2]">{listing.sellerRating} / 5.0</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8A93A3]">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-[#FFB020]" /> Escrow Trades
                  </span>
                  <strong className="text-[#EDEFF2]">48+ Trades</strong>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </AuthGuard>
  );
}