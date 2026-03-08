import type { Metadata } from "next";
import { Orbitron, DM_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlobalDashboards } from "@/components/layout/GlobalDashboards";
import { CustomCursor } from "@/components/ui/custom-cursor";

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
          {children}
          <Footer />
        </main>
        {/* Persistent Designer Credit */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1.5 pointer-events-auto cursor-default hover:border-cyan-500/50 transition-colors group">
            <span className="text-[9px] md:text-[10px] font-mono text-gray-400 group-hover:text-gray-300 transition-colors uppercase tracking-wider">
              Designed by
            </span>
            <span className="text-[10px] md:text-xs font-display font-bold text-cyan-500 tracking-[0.2em] uppercase group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              V_Mach
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}
