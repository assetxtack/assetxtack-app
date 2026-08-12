// "use client";

// import Link from "next/link";
// import { ShieldCheck, Zap, Lock, ArrowRight } from "lucide-react";

// export default function HeroSection() {
//   return (
//     <section id="overview" className="relative min-h-[88vh] flex items-center justify-center overflow-hidden border-b border-[#242938]">
//       {/* Background Image Container with Slow Zoom Effect */}
//       <div className="absolute inset-0 z-0 overflow-hidden">
//         <div 
//           className="w-full h-full bg-cover bg-center animate-zoom opacity-25 filter brightness-75 scale-105"
//           style={{
//             backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')`,
//           }}
//         />
//         {/* Dark Radial Gradients to make text pop */}
//         <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14]/80 via-[#0B0E14]/90 to-[#0B0E14]" />
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_85%)]" />
//       </div>

//       {/* Hero Content */}
//       <div className="relative z-10 max-w-4xl mx-auto px-5 py-16 text-center flex flex-col items-center">
        
//         {/* Gaming Focus Badge */}
//         <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151922] border border-[#242938] text-xs font-semibold text-[#FFB020] mb-6 shadow-md">
//           <Zap size={14} className="animate-pulse" />
//           <span>Nigeria's Dedicated Mobile Legends Marketplace</span>
//         </div>

//         {/* Main Title */}
//         <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#EDEFF2] tracking-tight leading-[1.15] mb-6">
//           Buy & Sell <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB020] via-[#FF8800] to-[#7C5CFC]">MLBB Gaming Accounts</span> Securely
//         </h1>

//         {/* Intro Description */}
//         <p className="text-base sm:text-lg text-[#8A93A3] max-w-2xl mx-auto mb-8 leading-relaxed">
//           AssetXtack connects buyers and sellers in a safe environment. Payment is held in local escrow via Paystack and Flutterwave, releasing funds only after full account handover is confirmed[cite: 1].
//         </p>

//         {/* Main Call to Action Buttons */}
//         <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
//           <Link
//             href="/sign-in?mode=signup"
//             className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-[#FFB020] text-[#0B0E14] hover:bg-[#ffa500] hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-[#FFB020]/10"
//           >
//             <span>Create Free Account</span>
//             <ArrowRight size={16} />
//           </Link>
//           <Link
//             href="/#how"
//             className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-[#EDEFF2] bg-[#151922] border border-[#242938] hover:border-[#FFB020]/60 transition-all duration-200"
//           >
//             <span>How Escrow Works</span>
//           </Link>
//         </div>

//         {/* Trust Value Points */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-8 border-t border-[#242938]/60 text-left">
//           <div className="p-4 rounded-xl bg-[#151922]/40 border border-[#242938]/80 backdrop-blur-sm">
//             <div className="flex items-center gap-2 text-[#FFB020] font-semibold text-sm mb-1">
//               <Lock size={16} /> Escrow Protection
//             </div>
//             <p className="text-xs text-[#8A93A3]">Funds are held securely until you inspect and verify the MLBB account login details[cite: 1].</p>
//           </div>

//           <div className="p-4 rounded-xl bg-[#151922]/40 border border-[#242938]/80 backdrop-blur-sm">
//             <div className="flex items-center gap-2 text-[#7C5CFC] font-semibold text-sm mb-1">
//               <ShieldCheck size={16} /> Local Payment Rails
//             </div>
//             <p className="text-xs text-[#8A93A3]">Seamless deposits and payouts directly with Bank Transfers and Paystack[cite: 1].</p>
//           </div>

//           <div className="p-4 rounded-xl bg-[#151922]/40 border border-[#242938]/80 backdrop-blur-sm">
//             <div className="flex items-center gap-2 text-[#FFB020] font-semibold text-sm mb-1">
//               <Zap size={16} /> Verified MLBB Listings
//             </div>
//             <p className="text-xs text-[#8A93A3]">Detailed account information covering rank, emblems, skins, and win rates[cite: 1].</p>
//           </div>
//         </div>

//       </div>
//     </section>
//   );
// }