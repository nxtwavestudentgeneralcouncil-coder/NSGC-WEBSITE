import type { Metadata } from "next";
import { Orbitron, DM_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlobalDashboards } from "@/components/layout/GlobalDashboards";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { Providers } from "./providers";

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
  title: "NSGC NEXUS COMMAND",
  description: "Space-grade terminal for the Student Council.",
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
          <div className="bg-particles absolute inset-0 z-[-3]" />
          <div className="bg-scanlines pointer-events-none fixed inset-0 z-[100]" />
          
          <Navbar />
          <GlobalDashboards />
          <CustomCursor />

          {/* The main content area now sits next to the vertical Navbar */}
          <main className="flex-1 flex flex-col relative ml-0 md:ml-20 lg:ml-64 transition-all duration-300">
            {/* Top Navigation Bar / Search */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-cyan-900/30 supports-[backdrop-filter]:bg-zinc-950/60 transition-colors">
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
          </main>
        </Providers>
      </body>
    </html>
  );
}
