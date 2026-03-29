'use client';

import { motion } from 'framer-motion';
import { TiltCard } from '@/components/ui/TiltCard';

export function PresidentSection() {
    return (
        <section id="meet-president" className="py-20 md:py-32 relative overflow-visible bg-black/40 z-10" style={{ clipPath: "polygon(0 0, 100% 5%, 100% 100%, 0 95%)" }}>
            {/* Ambient Background Elements */}
            <div className="absolute top-1/2 left-0 w-1/3 h-[150%] bg-blue-900/10 blur-[150px] -translate-y-1/2 pointer-events-none z-[-1]" />
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-cyan-900/5 blur-[120px] pointer-events-none z-[-1]" />

            {/* Skewed Divider Line Top/Bottom overlay equivalent */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-blue-500/50 via-transparent to-transparent hidden md:block" />
            <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-cyan-500/50 via-transparent to-transparent hidden md:block" />

            <div className="container mx-auto px-4 lg:px-12 relative z-10">
                <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 px-2 sm:px-0">

                    {/* Text Side - Left Heavy */}
                    <motion.div
                        className="w-full md:w-3/5 relative text-left"
                        initial={{ opacity: 0, x: -60, rotateY: 10 }}
                        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="text-[10px] text-cyan-500 font-mono tracking-[0.3em] uppercase mb-4 border-l-[2px] border-cyan-500 pl-4">
                            [ PROFILE // COMMANDER ]
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold uppercase text-white mb-6 md:mb-8 tracking-widest leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] text-balance">
                            Meet the <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">President</span>
                        </h2>

                        <div className="glass-panel p-5 sm:p-8 mb-8 relative group">
                            {/* Inner Bracket Accents */}
                            <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/20" />
                            <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/20" />

                            <p className="text-gray-400 font-mono text-xs sm:text-sm leading-7 sm:leading-8 uppercase text-pretty">
                                "Our mission is to bridge the gap between students and administration, fostering a campus environment where every voice is heard and every idea has the potential to spark change. Together, we are building a legacy of transparency, innovation, and unity."
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-4 mb-10">
                            {['Leadership', 'Transparency', 'Student Welfare', 'Innovation'].map((tag, index) => (
                                <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + index * 0.15 }}
                                    className="px-2 sm:px-3 py-1 bg-black border border-white/10 border-l-[2px] border-l-cyan-500 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-crosshair animate-float-3 whitespace-nowrap"
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                >
                                    {tag}
                                </motion.span>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 group">
                            <span className="text-cyan-500/80 font-signature text-2xl lg:text-3xl tracking-widest group-hover:text-cyan-400 transition-colors whitespace-nowrap">Sadu Vinil</span>
                            <div className="h-[2px] w-24 bg-gradient-to-r from-cyan-500/50 to-transparent group-hover:w-48 transition-all duration-700" />
                        </div>
                    </motion.div>

                    {/* Image Side - Floating Center Right */}
                    <motion.div
                        className="w-full md:w-2/5 flex justify-center md:justify-end pr-0 md:pr-4"
                        initial={{ opacity: 0, x: 60, y: 30 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    >
                        <TiltCard className="w-full max-w-[320px] lg:max-w-sm relative animate-float-2 z-20" tiltIntensity={15}>
                            <div className="relative aspect-[4/5] w-full bg-black/80 border border-blue-500/30 p-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,1)] group">
                                <div className="absolute -inset-2 bg-cyan-500/10 blur border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition duration-700" />

                                <div className="relative w-full h-full overflow-hidden border border-white/10 filter grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700 z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-20" />

                                    <img
                                        src="/images/president.jpg"
                                        alt="Sadu Vinil"
                                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                                    />

                                    <div className="absolute bottom-6 left-6 z-30 transform transition-transform duration-500 group-hover:-translate-y-2">
                                        <div className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mb-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-slow" />
                                            ONLINE
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-1">Sadu Vinil</h3>
                                        <p className="text-cyan-500/80 font-mono text-[10px] tracking-widest uppercase">President / 25-26</p>
                                    </div>

                                    {/* Overlay Scanline for the image alone */}
                                    <div className="absolute inset-x-0 h-1 bg-white/10 top-0 shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-scanline z-30 mix-blend-overlay pointer-events-none" />
                                </div>
                            </div>
                        </TiltCard>

                        {/* Decorative background circle behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-96 lg:h-96 border border-white/5 rounded-full z-10 pointer-events-none hidden md:block" />
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
