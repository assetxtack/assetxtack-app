import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import "./globals.css";

const spaceGrotesk = localFont({
  src: [
    { path: "../public/fonts/SpaceGrotesk-Medium.ttf", weight: "500" },
    { path: "../public/fonts/SpaceGrotesk-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/SpaceGrotesk-Bold.ttf", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400" },
    { path: "../public/fonts/Inter-Medium.ttf", weight: "500" },
    { path: "../public/fonts/Inter-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    { path: "../public/fonts/JetBrainsMono-Regular.ttf", weight: "400" },
    { path: "../public/fonts/JetBrainsMono-Medium.ttf", weight: "500" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AssetXtack - Turn your publisher account into cash",
  description: "A safe marketplace to buy and sell publisher accounts in Nigeria.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full bg-[#0B0E14] text-[#EDEFF2] flex flex-col">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}