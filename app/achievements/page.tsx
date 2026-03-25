'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, GraduationCap, Users, ArrowUpRight, Palette } from 'lucide-react';
import { useSharedData } from '@/hooks/useSharedData';
import Image from 'next/image';

// Helper to determine the top-right icon based on category
const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('academic') || cat.includes('student')) return <GraduationCap className="w-4 h-4 text-yellow-500/50" />;
    if (cat.includes('community') || cat.includes('leader')) return <Users className="w-4 h-4 text-yellow-500/50" />;
    if (cat.includes('sport') || cat.includes('athlet')) return <ArrowUpRight className="w-4 h-4 text-yellow-500/50" />;
    if (cat.includes('art') || cat.includes('culture') || cat.includes('innovat')) return <Palette className="w-4 h-4 text-yellow-500/50" />;
    return <Sparkles className="w-4 h-4 text-yellow-500/50" />;
};

export default function AchievementsPage() {
    const { achievements } = useSharedData();

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 relative overflow-hidden selection:bg-yellow-500/30">
            {/* Subtle Dot Pattern Background */}
            <div 
                className="absolute inset-0 z-0 opacity-[0.15]" 
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4"
                    >
                        Hall of Fame
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg"
                    >
                        Celebrating excellence and glory within our community.
                    </motion.p>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {achievements.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-[#0b1324]/80 backdrop-blur-sm border-yellow-500/20 overflow-hidden hover:border-yellow-500/50 transition-all duration-500 group h-full hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)] rounded-2xl">
                                <CardContent className="p-8 flex flex-col items-center text-center h-full relative">
                                    
                                    {/* Top Right Icon */}
                                    <div className="absolute top-4 right-4 transition-transform duration-500 group-hover:scale-125 group-hover:text-yellow-400">
                                        {getCategoryIcon(item.category)}
                                    </div>

                                    {/* Avatar Section */}
                                    <div className="relative mb-6 mt-4">
                                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-transform duration-500 group-hover:scale-105">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.student || 'Student'}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover rounded-full border-4 border-[#0b1324]"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#1a2333] rounded-full border-4 border-[#0b1324] flex items-center justify-center">
                                                    <span className="text-3xl font-black text-slate-600">
                                                        {(item.student || 'S').charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Tier Badge */}
                                        {item.tier && (
                                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg border-2 border-[#0b1324] whitespace-nowrap ${
                                                item.tier === 'Gold' ? 'bg-yellow-400 text-black' :
                                                item.tier === 'Silver' ? 'bg-slate-300 text-black' :
                                                item.tier === 'Bronze' ? 'bg-orange-600 text-white' :
                                                item.tier === 'Finalist' ? 'bg-cyan-500 text-white' :
                                                'bg-slate-500 text-white'
                                            }`}>
                                                {item.tier} Tier
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col flex-grow w-full mt-2">
                                        <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                                            {item.student || 'Achievement'}
                                        </h2>
                                        <h3 className="text-[11px] font-black text-yellow-500 tracking-widest uppercase mb-6 leading-tight">
                                            {item.category}
                                        </h3>
                                        
                                        <div className="mt-auto pt-2">
                                            <p className="text-slate-400 italic text-xs leading-relaxed max-w-[240px] mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
                                                &quot;{item.description || "Recognized for outstanding contributions and commitment to excellence within the NSGC community."}&quot;
                                            </p>
                                        </div>
                                    </div>
                                    
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
