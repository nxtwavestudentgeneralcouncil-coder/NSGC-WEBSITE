'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingBag, BarChart2, Bell, Clock, Flag, Users, BellOff, Edit2, ListX, ChevronRight, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useTickets, TicketProvider } from '@/lib/ticket-context';
import { useSharedData } from '@/hooks/useSharedData';
import { useCouncil, CouncilProvider } from '@/lib/council-context';

function StudentDashboardContent() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role === 'student') {
            setIsAuthorized(true);
        } else if (role === 'president') {
            router.push('/dashboard/president');
        } else if (role === 'admin') {
            router.push('/dashboard/admin');
        } else if (role === 'clubs') {
            router.push('/dashboard/clubs');
        } else {
            router.push('/login');
        }
    }, [router]);
    const { tickets } = useTickets();
    const { announcements: sharedAnnouncements, events: sharedEvents, clubs, members, isLoaded } = useSharedData();
    const { announcements: councilAnnouncements, events: councilEvents } = useCouncil();

    const myTickets = tickets.slice(0, 3); // Just show the recent 3 for dashboard overview

    // Merge and sort Announcements (newest first)
    const allAnnouncements = ([...sharedAnnouncements, ...councilAnnouncements] as any[]).sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
    });

    // Merge and sort Events (upcoming first)
    const allEvents = [...sharedEvents, ...councilEvents].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
    });

    if (!isLoaded || !isAuthorized) {
        return <div className="min-h-screen bg-black text-white pt-24 md:pt-10 pb-20 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0B0B14] text-white pt-24 md:pt-16 pb-20 font-sans">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Welcome back, Student</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                            <p className="text-[#94a3b8] text-sm">Live feed: Everything that's happening on campus today.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 w-full md:w-auto rounded-full px-6 py-5 text-xs font-bold tracking-widest uppercase">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#111625] rounded-[20px] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            {/* Red Ring */}
                            <div className="relative w-16 h-16 rounded-full border-[3px] border-[#ef4444]/20 flex items-center justify-center flex-shrink-0">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="30" cy="30" r="28" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="175" strokeDashoffset="140" className="opacity-80" />
                                </svg>
                                <div className="bg-[#ef4444]/10 rounded-full p-2">
                                    <svg className="w-4 h-4 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                            </div>
                            <div>
                                <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-1">Complaints Submitted</p>
                                <h3 className="text-[32px] font-bold leading-none">{tickets.length}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111625] rounded-[20px] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            {/* Green Ring */}
                            <div className="relative w-16 h-16 rounded-full border-[3px] border-[#10b981]/20 flex items-center justify-center flex-shrink-0">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="30" cy="30" r="28" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="175" strokeDashoffset="120" className="opacity-80" />
                                </svg>
                                <div className="bg-[#10b981]/10 rounded-full p-2">
                                    <BarChart2 className="w-4 h-4 text-[#10b981]" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-1">Polls / Surveys</p>
                                <h3 className="text-[32px] font-bold leading-none">12</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111625] rounded-[20px] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            {/* Blue Ring */}
                            <div className="relative w-16 h-16 rounded-full border-[3px] border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="30" cy="30" r="28" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="175" strokeDashoffset="160" className="opacity-80" />
                                </svg>
                                <div className="bg-[#0ea5e9]/10 rounded-full p-2">
                                    <ShoppingBag className="w-4 h-4 text-[#0ea5e9]" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-1">Active Listings</p>
                                <h3 className="text-[32px] font-bold leading-none">1</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Feeds (takes 8 cols) */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* 1. Announcements */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Bell className="w-6 h-6 text-[#0ea5e9] fill-current" />
                                <h2 className="text-[22px] font-bold tracking-tight">Campus Announcements</h2>
                            </div>

                            <div className={`min-h-[220px] rounded-[24px] overflow-hidden ${allAnnouncements.length > 0 ? 'bg-[#111625]' : 'bg-[#111625]/50 border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-8'}`}>
                                {allAnnouncements.length > 0 ? (
                                    <div className="p-6 space-y-4">
                                        {allAnnouncements.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex gap-4 items-start p-4 rounded-xl bg-[#1A2133] hover:bg-[#1f2937] transition-colors border border-white/5">
                                                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor] ${item.priority === 'High' ? 'bg-[#ef4444] text-[#ef4444]' : 'bg-[#0ea5e9] text-[#0ea5e9]'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-4 mb-2">
                                                        <h4 className="text-[15px] font-bold text-white leading-tight truncate">{item.title}</h4>
                                                        <span className="text-[11px] text-[#64748B] font-mono whitespace-nowrap">{(item as any).date || new Date((item as any).createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-[#94a3b8] line-clamp-2 leading-relaxed">{item.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-[#64748B] space-y-3">
                                        <BellOff className="w-8 h-8 mx-auto opacity-50" />
                                        <p className="italic text-[15px]">No active announcements at this time.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Recent Complaints */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#ef4444] text-[#ef4444] rounded-full flex-shrink-0 w-6 h-6 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        <div className="w-1 h-3 bg-white rounded-full"></div>
                                    </div>
                                    <h2 className="text-[22px] font-bold tracking-tight">Your Recent Complaints</h2>
                                </div>
                                {tickets.length > 0 && (
                                    <Link href="/complaints/history" className="text-sm font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
                                        View All
                                    </Link>
                                )}
                            </div>

                            <div className={`min-h-[220px] rounded-[24px] overflow-hidden ${myTickets.length > 0 ? 'bg-[#111625]' : 'bg-[#111625]/50 border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-8'}`}>
                                {myTickets.length > 0 ? (
                                    <div className="p-6 space-y-4">
                                        {myTickets.map((item) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-[#1A2133] hover:bg-[#1f2937] transition-colors border border-white/5 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-white leading-tight mb-1">{item.subject}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                                                        <span>{item.id}</span>
                                                        <span>•</span>
                                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline font-sans">{item.type}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold tracking-widest text-[10px] uppercase border ${item.status === 'Completed' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30'}`}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-[#64748B] space-y-3">
                                        <ListX className="w-8 h-8 mx-auto opacity-50" />
                                        <p className="italic text-[15px]">No recent complaints found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Quick Actions & Links (takes 4 cols) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Quick Actions Card */}
                        <div className="bg-[#111625] rounded-[24px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-6 pb-2">
                                <h3 className="text-xs font-bold text-[#64748B] tracking-[0.2em] uppercase">Quick Actions</h3>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Action 1 */}
                                <Link href="/complaints" className="block">
                                    <div className="group bg-[#1A2133] hover:bg-[#1f2937] border border-white/5 rounded-[16px] p-4 transition-all duration-300 flex items-center gap-5 cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-[#ef4444]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ef4444]/25 transition-colors">
                                            <FileText className="w-5 h-5 text-[#ef4444]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] tracking-wide mb-1">SUBMIT COMPLAINT</h4>
                                            <p className="text-[11px] text-[#64748B] font-bold tracking-wider uppercase">Report an issue</p>
                                        </div>
                                    </div>
                                </Link>

                                {/* Action 2 */}
                                <Link href="/marketplace" className="block">
                                    <div className="group bg-[#1A2133] hover:bg-[#1f2937] border border-white/5 rounded-[16px] p-4 transition-all duration-300 flex items-center gap-5 cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0ea5e9]/25 transition-colors">
                                            <ShoppingBag className="w-5 h-5 text-[#0ea5e9]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] tracking-wide mb-1">SELL ITEM</h4>
                                            <p className="text-[11px] text-[#64748B] font-bold tracking-wider uppercase">List a book or gadget</p>
                                        </div>
                                    </div>
                                </Link>

                                {/* Action 3 */}
                                <Link href="/feedback" className="block">
                                    <div className="group bg-[#1A2133] hover:bg-[#1f2937] border border-white/5 rounded-[16px] p-4 transition-all duration-300 flex items-center gap-5 cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8b5cf6]/25 transition-colors">
                                            <PieChart className="w-5 h-5 text-[#8b5cf6]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] tracking-wide mb-1">TAKE SURVEY</h4>
                                            <p className="text-[11px] text-[#64748B] font-bold tracking-wider uppercase">Share your opinion</p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Collapsible Tabs */}
                        <div className="space-y-3">
                            <Link href="/clubs" className="block">
                                <div className="bg-[#111625] hover:bg-[#1a2133] border border-white/5 rounded-[16px] p-5 flex items-center justify-between transition-colors shadow-lg cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <Flag className="w-5 h-5 text-[#0ea5e9]" />
                                        <h4 className="text-[15px] font-bold text-white tracking-wide">Active Clubs</h4>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" />
                                </div>
                            </Link>

                            <Link href="/council" className="block">
                                <div className="bg-[#111625] hover:bg-[#1a2133] border border-white/5 rounded-[16px] p-5 flex items-center justify-between transition-colors shadow-lg cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <Users className="w-5 h-5 text-[#0ea5e9]" />
                                        <h4 className="text-[15px] font-bold text-white tracking-wide">Student Council</h4>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" />
                                </div>
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default function StudentDashboard() {
    return (
        <TicketProvider>
            <CouncilProvider>
                <StudentDashboardContent />
            </CouncilProvider>
        </TicketProvider>
    );
}
