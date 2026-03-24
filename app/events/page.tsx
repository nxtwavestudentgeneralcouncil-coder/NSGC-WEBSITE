'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { useSharedData } from '@/hooks/useSharedData';

export default function EventsPage() {
    const { events } = useSharedData();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Filter events based on date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const filteredEvents = events.filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        // If date string is invalid, eventDate will be 'Invalid Date'
        if (isNaN(eventDate.getTime())) return false;

        // For comparison, normalize time
        eventDate.setHours(0, 0, 0, 0);

        return activeTab === 'upcoming'
            ? eventDate >= today
            : eventDate < today;
    }).sort((a, b) =>
        activeTab === 'upcoming'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Format date for the Date Block
    const formatDateBlock = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return { month: 'TBD', day: '--' };
        
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = date.toLocaleDateString('en-US', { day: '2-digit' });
        return { month, day };
    };

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-5xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4"
                    >
                        Events Calendar
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Discover what's happening on campus.
                    </motion.p>
                </div>

                {/* Tabs / Segmented Control */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-16"
                >
                    <div className="bg-[#0B1224] p-1.5 flex rounded-lg border border-white/5">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-8 py-3 rounded-md text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                                activeTab === 'upcoming'
                                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Upcoming Events
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-8 py-3 rounded-md text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                                activeTab === 'past'
                                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            Past Events
                        </button>
                    </div>
                </motion.div>

                {/* Events List */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        {filteredEvents.length === 0 ? (
                            <motion.div
                                key={`empty-${activeTab}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-24 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/5"
                            >
                                <p className="text-lg">No {activeTab} events found.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`list-${activeTab}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {filteredEvents.map((event, index) => {
                                    const { month, day } = formatDateBlock(event.date);
                                    
                                    // Generate a stable random number for registered users if not provided
                                    const registeredUsers = event.participants || Math.floor(Math.random() * 200) + 50;

                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="group"
                                        >
                                            <Card className="bg-[#0B1224]/80 border-white/5 backdrop-blur-md overflow-hidden hover:border-cyan-500/30 transition-all duration-500 hover:bg-[#0B1224] hover:shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                                                <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                                                    
                                                    {/* Date Block (Left) */}
                                                    <div className="bg-[#080d1a] border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col items-center justify-center min-w-[120px] md:min-w-[140px] shrink-0 group-hover:bg-[#0f172a] transition-colors">
                                                        <span className="text-cyan-400 font-black tracking-widest text-sm uppercase mb-1">{month}</span>
                                                        <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{day}</span>
                                                    </div>

                                                    {/* Details (Center) */}
                                                    <div className="p-6 md:p-8 flex-grow flex flex-col justify-center gap-3">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest rounded-md uppercase">
                                                                {event.type}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                                                            {event.name}
                                                        </h3>

                                                        <div className="flex items-center gap-6 mt-1 flex-wrap">
                                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                                <MapPin className="w-4 h-4 text-slate-600" />
                                                                <span>{event.location}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action (Right) */}
                                                    <div className="p-6 md:p-8 flex items-center justify-start md:justify-end border-t md:border-t-0 border-white/5 shrink-0">
                                                        {activeTab === 'upcoming' ? (
                                                            <Button 
                                                                className={`w-full md:w-auto px-8 h-12 font-bold tracking-widest text-xs uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all bg-cyan-500 hover:bg-cyan-400 text-black hover:scale-105`}
                                                                onClick={() => {
                                                                    if (event.registrationLink) {
                                                                        window.open(event.registrationLink, '_blank');
                                                                    } else {
                                                                        alert("Registration link not provided for this event.");
                                                                    }
                                                                }}
                                                            >
                                                                REGISTER NOW
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="outline"
                                                                className="w-full md:w-auto px-8 h-12 font-bold tracking-widest text-xs uppercase text-slate-400 border-white/10 hover:bg-white/5 hover:text-white transition-all bg-transparent"
                                                            >
                                                                VIEW RECAP
                                                            </Button>
                                                        )}
                                                    </div>

                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
