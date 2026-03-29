'use client';

import { ShieldAlert, Lock, AlertTriangle, Info, ArrowUpRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LockdownPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-radial-at-t from-red-900/10 via-black to-black opacity-60"></div>
            
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-[120px] rounded-full animate-pulse transition-all duration-[4s]"></div>

            {/* Glowing Hexagon Pattern Mock-up Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }}></div>

            <main className="w-full max-w-xl relative">
                
                {/* Status Indicator */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        System Lockdown Active
                    </div>
                </motion.div>

                {/* Main Content Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.5)] relative group"
                >
                    {/* Glowing Accent Corner */}
                    <div className="absolute -top-px -left-px w-24 h-24 bg-gradient-to-br from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-tl-[40px]"></div>

                    <div className="flex flex-col items-center text-center space-y-8">
                        
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-600/20 to-red-400/10 flex items-center justify-center text-red-500 shadow-2xl backdrop-blur-md border border-red-500/20">
                                <ShieldAlert size={48} strokeWidth={1.5} />
                            </div>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                                className="absolute -inset-4 border border-red-500/5 rounded-full pointer-events-none"
                            ></motion.div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
                                PROTOC<span className="text-red-600">OL</span> RED
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-sm mx-auto font-medium">
                                The system is currently in a high-security lockdown state for maintenance or critical updates.
                            </p>
                        </div>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                                    <AlertTriangle size={14} /> Impact
                                </div>
                                <p className="text-gray-500 text-[11px] leading-relaxed">
                                    All standard application functions, dashboards, and API services are temporarily suspended.
                                </p>
                            </div>
                            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    <Info size={14} /> Duration
                                </div>
                                <p className="text-gray-500 text-[11px] leading-relaxed">
                                    This is a temporary measure. Access will be restored once the security protocols are cleared.
                                </p>
                            </div>
                        </div>

                        <div className="w-full pt-4 space-y-4">
                            <Link href="/login" className="flex items-center justify-between w-full h-14 bg-white text-black rounded-2xl px-6 font-bold hover:bg-gray-200 transition-all group/btn shadow-[0_4px_20px_rgba(255,255,255,0.1)]">
                                Administration Login
                                <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" size={20} />
                            </Link>
                            
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                Contact system administrator for emergency overrides
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Links */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex justify-center gap-8 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]"
                >
                    <div className="flex items-center gap-2 hover:text-gray-400 cursor-pointer transition-colors">
                         Security Center
                    </div>
                    <div className="flex items-center gap-2 hover:text-gray-400 cursor-pointer transition-colors">
                        Status Page
                    </div>
                </motion.div>

            </main>

            {/* Corner Decorative Elements */}
            <div className="fixed bottom-0 left-0 p-8 opacity-20 hidden md:block">
                 <div className="flex flex-col gap-1">
                    <div className="flex gap-1 h-3">
                        <div className="w-3 h-3 bg-red-600"></div>
                        <div className="w-3 h-3 bg-red-600/50"></div>
                        <div className="w-3 h-3 bg-red-600/20"></div>
                    </div>
                    <div className="font-mono text-[8px] uppercase tracking-tighter">Emergency-Auth-v4.1.0</div>
                 </div>
            </div>
        </div>
    );
}
