'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Bot, Palette, Dribbble, Music, Clapperboard, Globe, User } from 'lucide-react';
import { useSharedData } from '@/hooks/useSharedData';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Helper to determine category icon and colors
const getCategoryDetails = (club: any) => {
    const nameStr = (club.name + ' ' + (club.category || '')).toLowerCase();
    if (nameStr.includes('tech') || nameStr.includes('robo') || nameStr.includes('algo') || nameStr.includes('code')) {
        return { icon: Bot, color: 'text-green-400', bg: 'bg-green-500/10', label: 'TECH' };
    }
    if (nameStr.includes('art') || nameStr.includes('canvas') || nameStr.includes('design')) {
        return { icon: Palette, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'ARTS' };
    }
    if (nameStr.includes('sport') || nameStr.includes('striker') || nameStr.includes('athlet')) {
        return { icon: Dribbble, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'SPORTS' };
    }
    if (nameStr.includes('music') || nameStr.includes('sonic') || nameStr.includes('cultur')) {
        return { icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'CULTURAL' };
    }
    if (nameStr.includes('media') || nameStr.includes('cine') || nameStr.includes('film')) {
        return { icon: Clapperboard, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'MEDIA' };
    }
    return { icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'GENERAL' };
};

export default function ClubsPage() {
    const { clubs, isLoaded } = useSharedData();
    const clubsLoading = !isLoaded;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClubs = useMemo(() => {
        return clubs.filter((club: any) => {
            return club.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   club.description?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [clubs, searchQuery]);

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2"
                        >
                            Student Clubs
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-400 text-base"
                        >
                            Join a community. Pursue your passion.
                        </motion.p>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 w-full md:w-auto"
                    >
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                                placeholder="Search clubs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0B1224] border-white/5 pl-10 pr-4 h-11 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                            />
                        </div>
                        <div className="w-11 h-11 shrink-0 bg-[#0B1224] border border-white/5 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                            <User className="w-5 h-5 text-slate-400" />
                        </div>
                    </motion.div>
                </div>

                {/* Grid */}
                {clubsLoading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-[#0B1224]/50 border border-dashed border-white/10 rounded-2xl"
                    >
                        <Search className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No clubs found</h3>
                        <p className="text-slate-400">Try adjusting your filters or search terms.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredClubs.map((club: any, index: number) => {
                                const { icon: Icon, color, bg, label } = getCategoryDetails(club);
                                const mockAvatars = ["bg-slate-700", "bg-slate-600", "bg-slate-500"];
                                const membersCount = club.club_members?.length || 0;
                                const remainingMembers = Math.max(0, membersCount - mockAvatars.length);

                                return (
                                    <motion.div
                                        key={club.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Link href={`/clubs/${club.id}`} className="block h-full">
                                            <Card className="bg-[#0B1224]/80 border-white/5 backdrop-blur-md overflow-hidden hover:border-white/10 transition-all duration-500 group h-full cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                                                <CardContent className="p-6 flex flex-col h-full">
                                                    
                                                    {/* Top Row: Icon/Logo & Badge */}
                                                    <div className="flex justify-between items-start mb-6">
                                                        {club.logo_url ? (
                                                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0 transition-transform duration-500 group-hover:scale-110">
                                                                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} shadow-inner shrink-0 transition-transform duration-500 group-hover:scale-110`}>
                                                                <Icon className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                        <Badge className="bg-white/5 hover:bg-white/10 text-slate-300 border-none px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded-sm shrink-0 ml-2">
                                                            {label}
                                                        </Badge>
                                                    </div>

                                                    {/* Titles & Desc */}
                                                    <div className="flex-grow">
                                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                                                            {club.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed h-[42px]">
                                                            {club.description}
                                                        </p>
                                                    </div>

                                                    {/* Bottom Row: Avatars & Count */}
                                                    <div className="flex justify-between items-end mt-6 pt-6 border-t border-white/5">
                                                        <div className="flex -space-x-3">
                                                            {mockAvatars.map((bgColor, i) => (
                                                                <div 
                                                                    key={bgColor} 
                                                                    className={`w-8 h-8 rounded-full border-2 border-[#0B1224] ${bgColor} relative`}
                                                                    style={{ zIndex: 30 - i * 10 }}
                                                                />
                                                            ))}
                                                            {remainingMembers > 0 && (
                                                                <div className="w-8 h-8 rounded-full border-2 border-[#0B1224] bg-white/10 flex items-center justify-center text-[10px] font-bold text-white relative z-0 backdrop-blur-sm">
                                                                    +{Math.min(remainingMembers, 99)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {membersCount} Members
                                                        </span>
                                                    </div>

                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
