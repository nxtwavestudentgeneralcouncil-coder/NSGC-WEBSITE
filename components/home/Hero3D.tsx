'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load the heavy Three.js 3D solar system to avoid blocking initial render
const CyberSolarSystem = dynamic(
    () => import('@/components/solar/CyberSolarSystem').then(mod => ({ default: mod.CyberSolarSystem })),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }
);

export function Hero3D() {
    return (
        <section className="relative w-full h-[85vh] md:h-[100vh] flex items-center justify-center overflow-hidden bg-transparent perspective-1000">
            {/* 3D Solar System Scene - DO NOT TOUCH */}
            <div className="absolute inset-0 z-0">
                <CyberSolarSystem />
            </div>

            {/* Background floating grid / lines already set in layout */}



            {/* Launch Console - Center Low */}
            <div className="absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 flex flex-col items-center">

                {/* Orbital Rings around console - Slowed down for better performance */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] max-w-[100vw] h-[300%] border border-blue-500/10 rounded-[50%] animate-[spin_25s_linear_infinite] pointer-events-none z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-[100vw] h-[250%] border-t border-b border-blue-500/5 rounded-[50%] animate-[spin_40s_linear_infinite_reverse] pointer-events-none z-0" />

                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 30 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                    className="w-full flex flex-col items-center gap-4 md:gap-6 glass-panel p-5 sm:p-8 relative z-10 animate-float-1"
                >
                    {/* Console Tag */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 text-[10px] font-mono text-blue-500 tracking-[0.3em] uppercase border border-blue-500/30">
                        [ COMMAND UPLINK ]
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black text-white tracking-[0.15em] sm:tracking-[0.2em] text-center uppercase mix-blend-overlay opacity-90 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-2 mt-4 text-balance">
                        NSGC <span className="text-transparent border-b-2 border-b-blue-500/50 bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-700">NEXUS</span>
                    </h1>

                    <div className="w-full flex flex-col sm:flex-row items-stretch gap-3 md:gap-4">
                        <div className="flex-1 relative w-full group">
                            {/* Terminal Brackets */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500/70" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-500/70" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-500/70" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500/70" />

                            <input
                                type="text"
                                placeholder="AWAITING INITIALIZATION..."
                                className="w-full h-full min-h-[44px] md:min-h-[48px] bg-black/50 border border-blue-500/10 px-4 font-mono text-xs md:text-sm text-blue-400 focus:outline-none placeholder:text-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)] uppercase"
                                readOnly
                            />
                            {/* Blinking Block Cursor */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-[180px] md:left-[240px] w-1.5 md:w-2 h-4 md:h-5 bg-blue-500 animate-pulse-slow pointer-events-none hidden xs:block sm:block" />
                        </div>

                        <Button
                            size="lg"
                            className="w-full sm:w-auto mt-0 py-5 md:py-6"
                            onClick={() => {
                                document.getElementById('meet-president')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="mr-2 tracking-widest text-xs md:text-sm">TRANSMIT</span>
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-6 right-8 text-blue-500/50 pointer-events-none z-10 glass-panel p-2 flex flex-col items-center hidden md:flex"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
                <div className="text-[9px] uppercase font-mono tracking-widest mb-1 [-webkit-writing-mode:vertical-rl] rotate-180">DESCEND</div>
                <ChevronDown className="w-4 h-4" />
            </motion.div>
        </section>
    );
}
