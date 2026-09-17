import Link from "next/link";
import Wordmark from "./Wordmark"; // ADDED: shared wordmark component (Task 4)

// REMOVED: local XMark() function — now shared via ./Wordmark.tsx

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse Listings", href: "/listings" },
      { label: "List an Account", href: "/sell" },
      { label: "How It Works", href: "/#how" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Report an Issue", href: "/report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Seller Agreement", href: "/seller-agreement" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#242938] bg-[#0B0E14]">
      <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          {/* CHANGED: shared Wordmark component */}
          <div className="mb-3">
            <Wordmark size={20} />
          </div>
          <p className="text-xs text-[#8A93A3] leading-relaxed max-w-[220px]">
            A safe marketplace to buy and sell publisher accounts in Nigeria.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-semibold text-[#EDEFF2] mb-3">{col.title}</div>
            <div className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-[#8A93A3] hover:text-[#EDEFF2] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#242938]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-[#8A93A3]">© {year} AssetXtack. All rights reserved.</span>
          <span className="text-xs text-[#8A93A3]">A Geypey Web Studio product</span>
        </div>
      </div>
    </footer>
  );
}