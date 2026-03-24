import type { Metadata } from "next";
import { Orbitron, DM_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlobalDashboards } from "@/components/layout/GlobalDashboards";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Providers } from "./providers";

// Removed force-dynamic to allow Next.js to statically optimize eligible pages

// Use Orbitron for Display / Headers
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

// Use DM Mono for Body / Labels
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NSGC NEXUS COMMAND | Student General Council",
    template: "%s | NSGC NEXUS"
  },
  description: "The official space-grade terminal for the Student General Council (NSGC). Manage clubs, events, achievements, and more.",
  keywords: ["NSGC", "Student Council", "Nexus Command", "Student Management", "University Portal", "NextJS Council App"],
  authors: [{ name: "V_Mach" }],
  creator: "V_Mach",
  publisher: "NSGC",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NSGC NEXUS",
  },
  icons: {
    icon: "/images/nsgc_logo_transparent.png",
    apple: "/images/nsgc_logo_transparent.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nsgc-sigma.vercel.app/",
    siteName: "NSGC NEXUS COMMAND",
    title: "NSGC NEXUS COMMAND | Student General Council",
    description: "The official space-grade terminal and portal for the Student General Council (NSGC).",
    images: [
      {
        url: "/images/nsgc_logo_transparent.png",
        width: 1200,
        height: 630,
        alt: "NSGC NEXUS COMMAND Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NSGC NEXUS COMMAND | Student General Council",
    description: "The official space-grade terminal and portal for the Student General Council (NSGC).",
    images: ["/images/nsgc_logo_transparent.png"],
    creator: "@vma_ch",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://nsgc-sigma.vercel.app/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${dmMono.variable} flex min-h-screen bg-black text-white antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          {/* Global Atmosphere Elements */}
          <div className="bg-grid absolute inset-0 z-[-6]" />
          <div className="bg-atmosphere absolute inset-0 z-[-5]" />
          <div className="bg-noise absolute inset-0 z-[-4]" />
          <div className="bg-scanlines pointer-events-none fixed inset-0 z-[100]" />
          
          <Navbar />
          <GlobalDashboards />
          <CustomCursor />

          {/* Persistent V_Mach Badge */}
          <div className="hidden md:block fixed bottom-4 right-4 z-[9999] pointer-events-none">
            <div className="bg-black/50 backdrop-blur-md border border-cyan-500/20 px-3 py-1.5 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <p className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Designed by <span className="text-cyan-500 font-bold">V_Mach</span>
              </p>
            </div>
          </div>

          {/* The main content area now sits next to the vertical Navbar */}
          <main className="flex-1 flex flex-col relative ml-0 md:ml-20 lg:ml-64 transition-all duration-300 pb-20 md:pb-0 w-full overflow-hidden">
            <MobileHeader />
            {/* Top Navigation Bar / Search (Desktop Only) */}
            <header className="hidden md:block sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-cyan-900/30 supports-[backdrop-filter]:bg-zinc-950/60 transition-colors">
              <div className="flex h-16 items-center px-4 md:px-8 gap-4 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
                <div className="mr-4 hidden md:flex">
                  <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                    <span className="text-cyan-400">{'//'}</span> NSGC_NEXUS
                  </span>
                </div>
                <div className="flex flex-1 items-center space-x-2">
                </div>
              </div>
            </header>
  
            <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
              <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-700">
                {children}
              </div>
            </div>
            <Footer />
            <MobileBottomNav />
          </main>
        </Providers>
      </body>
    </html>
  );
}
