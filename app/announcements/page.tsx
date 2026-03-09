'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Bookmark, ExternalLink } from 'lucide-react';
import { GlassModal } from '@/components/ui/glass-modal';
import { useSharedData, Announcement } from '@/hooks/useSharedData';
import { Input } from '@/components/ui/input';

const CATEGORIES = ["ALL", "ACADEMIC", "EVENTS", "FACILITY", "HOSTEL", "SPORTS", "GENERAL"];

// Helper to determine category colors
const getCategoryColors = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'ACADEMIC': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        case 'SPORTS': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        case 'EVENTS': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        case 'FACILITY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        case 'GENERAL': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
        default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
};

export default function AnnouncementsPage() {
    const { announcements } = useSharedData();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const filteredAnnouncements = useMemo(() => {
        return announcements.map((a: any) => ({
            ...a,
            category: a.category || "General"
        })).filter((a: any) => {
            const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  a.content.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = activeCategory === 'ALL' || a.category.toUpperCase() === activeCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [announcements, searchQuery, activeCategory]);

    // Helper to format date and time mock for visual
    const formatDateTime = (dateString: string) => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "XX OOO XXXX // --:--";
        
        const day = d.toLocaleDateString('en-US', { day: '2-digit' });
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = d.getFullYear();
        
        // Mock time if not present
        const hours = String(Math.floor(Math.random() * 10) + 8).padStart(2, '0');
        const mins = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
        
        return `${day} ${month} ${year} // ${hours}:${mins}`;
    };

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header & Search */}
                <div className="flex flex-col mb-12 items-center text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4"
                    >
                        Announcements
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg mb-10"
                    >
                        Stay updated with the latest news and notices.
                    </motion.p>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                    {/* Categories */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2 rounded-md text-[10px] font-black tracking-widest uppercase transition-all duration-300 border ${
                                    activeCategory === category
                                        ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                        : 'bg-transparent text-slate-300 border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </motion.div>
                    
                    {/* Search */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-full lg:w-80 shrink-0"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="Search announcements..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-white/10 pl-11 pr-4 h-10 text-sm text-white placeholder:text-slate-500 rounded-md focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                        />
                    </motion.div>
                </div>

                {/* Grid */}
                {filteredAnnouncements.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-[#0B1224]/50 border border-dashed border-white/10 rounded-2xl"
                    >
                        <Search className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No announcements found</h3>
                        <p className="text-slate-400">Try adjusting your filters or search terms.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredAnnouncements.map((announcement: any, index: number) => (
                                <motion.div
                                    key={announcement.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="bg-[#0b1324] border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 group h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                                        <CardContent className="p-6 flex flex-col h-full">
                                            
                                            {/* Top Row: Badge & Date */}
                                            <div className="flex justify-between items-center mb-5">
                                                <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${getCategoryColors(announcement.category)}`}>
                                                    {announcement.category}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {formatDateTime(announcement.date)}
                                                </span>
                                            </div>

                                            {/* Titles & Desc */}
                                            <div className="flex-grow mb-6">
                                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors leading-tight">
                                                    {announcement.title}
                                                </h3>
                                                <p className="text-sm text-slate-400 line-clamp-4 leading-relaxed">
                                                    {announcement.content}
                                                </p>
                                            </div>

                                            {/* Bottom Row: Read More & Bookmark */}
                                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                                                <button 
                                                    onClick={() => setSelectedAnnouncement(announcement)}
                                                    className="text-[11px] font-black tracking-widest text-cyan-500 uppercase flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                                >
                                                    READ MORE <span className="text-lg leading-none">&rarr;</span>
                                                </button>
                                                <button className="text-slate-500 hover:text-white transition-colors">
                                                    <Bookmark className="w-4 h-4" />
                                                </button>
                                            </div>

                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <GlassModal
                    isOpen={!!selectedAnnouncement}
                    onClose={() => setSelectedAnnouncement(null)}
                    title={selectedAnnouncement?.title || "Announcement Details"}
                    footer={
                        <>
                            <button 
                                onClick={() => setSelectedAnnouncement(null)} 
                                className="px-6 py-2 rounded-md border border-white/20 text-white hover:bg-white/10 text-sm font-bold tracking-wider uppercase transition-colors"
                            >
                                Close
                            </button>
                            {selectedAnnouncement?.link && (
                                <a href={selectedAnnouncement.link.startsWith('http') ? selectedAnnouncement.link : `https://${selectedAnnouncement.link}`} target="_blank" rel="noopener noreferrer">
                                    <button className="px-6 py-2 rounded-md bg-cyan-500 text-black hover:bg-cyan-400 text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-colors">
                                        <ExternalLink className="w-4 h-4" /> Open Link
                                    </button>
                                </a>
                            )}
                        </>
                    }
                >
                    {selectedAnnouncement && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <div className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${getCategoryColors(selectedAnnouncement.category)}`}>
                                    {selectedAnnouncement.category}
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {formatDateTime(selectedAnnouncement.date)}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-3 text-sm tracking-wider uppercase">Details</h4>
                                <div className="bg-black/40 p-5 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap leading-relaxed text-sm shadow-inner">
                                    {selectedAnnouncement.content}
                                </div>
                            </div>
                        </div>
                    )}
                </GlassModal>

            </div>
        </div>
    );
}
