'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingBag, BarChart2, Bell, Clock, Flag, Users, BellOff, Edit2, ListX, ChevronRight, PieChart, TerminalSquare, UtensilsCrossed, X, ChevronDown, Send, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { useTickets } from '@/lib/ticket-context';
import { useSharedData } from '@/hooks/useSharedData';
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useClubData } from '@/hooks/useClubData';
import { Star } from 'lucide-react';

const RatingStars = ({ rating, setRating, disabled }: { rating: number, setRating: (r: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => setRating(star)}
                    className={`p-0.5 transition-all ${disabled ? 'cursor-default' : 'hover:scale-110 active:scale-95 cursor-pointer'}`}
                >
                    <Star
                        className={`w-4 h-4 ${
                            star <= rating
                                ? 'fill-[#f59e0b] text-[#f59e0b]'
                                : 'text-[#475569] hover:text-[#64748B]'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

function StudentDashboardContent() {
    const router = useRouter();
    const [messMenuOpen, setMessMenuOpen] = useState(false);
    const [selectedMenuDay, setSelectedMenuDay] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('breakfast');
    const [messMenuData, setMessMenuData] = useState<{day: string; meals: Record<string, { items: string, image_url?: string, items_json?: any[] }>}[]>([]);
    const [messMenuLoading, setMessMenuLoading] = useState(false);
    const [changeRequestOpen, setChangeRequestOpen] = useState(false);
    const [changeRequestDay, setChangeRequestDay] = useState('');
    const [changeRequestMeal, setChangeRequestMeal] = useState('');
    const [changeRequestSuggestion, setChangeRequestSuggestion] = useState('');
    const [changeRequestSubmitted, setChangeRequestSubmitted] = useState(false);
    const [changeRequestSubmitting, setChangeRequestSubmitting] = useState(false);
    const [myMenuRequests, setMyMenuRequests] = useState<any[]>([]);
    const [menuRequestsLoading, setMenuRequestsLoading] = useState(false);
    const [submittingRating, setSubmittingRating] = useState<string | null>(null);
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [pendingRatings, setPendingRatings] = useState<Record<string, { rating: number, remark: string }>>({});

    // Fetch mess menu from DB
    const fetchMessMenu = async () => {
        setMessMenuLoading(true);
        try {
            const res = await fetch('/api/v1/nhost/get-mess-menu');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Transform flat DB rows into grouped day format
                    const dayMap: Record<string, Record<string, { items: string, image_url?: string, items_json?: any[] }>> = {};
                    data.forEach((item: any) => {
                        if (!dayMap[item.day]) dayMap[item.day] = {};
                        dayMap[item.day][item.meal_type] = {
                            items: item.items,
                            image_url: item.image_url,
                            items_json: item.items_json
                        };
                    });
                    const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    setMessMenuData(DAYS_ORDER.map(d => ({ day: d, meals: dayMap[d] || {} })));
                }
            }
        } catch (err) {
            console.error('Failed to fetch mess menu:', err);
        } finally {
            setMessMenuLoading(false);
        }
    };

    useEffect(() => {
        if (messMenuOpen) {
            fetchMessMenu();
            fetchMyRatings();
            setSelectedMenuDay(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
        }
    }, [messMenuOpen]);

    const getExistingItem = () => {
        if (!changeRequestDay || !changeRequestMeal) return '';
        const dayData = messMenuData.find(d => d.day === changeRequestDay);
        if (!dayData) return '';
        return dayData.meals[changeRequestMeal]?.items || '';
    };

    const handleChangeRequestSubmit = async () => {
        if (!changeRequestDay || !changeRequestMeal || !changeRequestSuggestion.trim()) return;
        setChangeRequestSubmitting(true);
        try {
            await fetch('/api/v1/nhost/insert-mess-change-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: user?.id,
                    student_name: user?.displayName,
                    student_email: user?.email,
                    day: changeRequestDay,
                    meal_type: changeRequestMeal,
                    current_item: getExistingItem(),
                    suggested_item: changeRequestSuggestion.trim()
                })
            });
            setChangeRequestSubmitted(true);
            fetchMyMenuRequests(); // Refresh the requests list
            setTimeout(() => {
                setChangeRequestSubmitted(false);
                setChangeRequestOpen(false);
                setChangeRequestDay('');
                setChangeRequestMeal('');
                setChangeRequestSuggestion('');
            }, 2000);
        } catch (err) {
            console.error('Failed to submit change request:', err);
        } finally {
            setChangeRequestSubmitting(false);
        }
    };

    // Fetch student's own menu change requests
    const fetchMyMenuRequests = async () => {
        if (!user?.email) return;
        setMenuRequestsLoading(true);
        try {
            const res = await fetch('/api/v1/nhost/get-mess-change-requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                const userEmailLower = user.email.toLowerCase();
                setMyMenuRequests(data.filter((r: any) => 
                    (r.student_email || '').toLowerCase() === userEmailLower
                ));
            }
        } catch (err) {
            console.error('Failed to fetch menu requests:', err);
        } finally {
            setMenuRequestsLoading(false);
        }
    };

    const fetchMyRatings = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-my-meal-ratings');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    const ratingMap: Record<string, number> = {};
                    data.data.forEach((r: any) => {
                        ratingMap[`${r.day}-${r.meal_type}`] = r.rating;
                    });
                    setRatings(ratingMap);
                }
            }
        } catch (err) {
            console.error('Failed to fetch my ratings:', err);
        }
    };

    const handleRateMeal = async (day: string, mealType: string) => {
        const pending = pendingRatings[`${day}-${mealType}`];
        if (!user?.id || !pending?.rating) return;
        
        setSubmittingRating(`${day}-${mealType}`);
        try {
            const res = await fetch('/api/v1/nhost/insert-meal-rating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: user.id,
                    student_name: user.displayName || 'Anonymous',
                    day,
                    meal_type: mealType,
                    rating: pending.rating,
                    feedback: pending.remark.trim()
                })
            });
            if (res.ok) {
                // For UI feedback, we can store locally that this meal was rated
                setRatings(prev => ({ ...prev, [`${day}-${mealType}`]: pending.rating }));
                setPendingRatings(prev => {
                    const newPending = { ...prev };
                    delete newPending[`${day}-${mealType}`];
                    return newPending;
                });
            }
        } catch (err) {
            console.error('Failed to submit rating:', err);
        } finally {
            setSubmittingRating(null);
        }
    };


    // Nhost Integration — allow ANY authenticated user to view the student dashboard.
    // Multi-role users (e.g. mess_admin + student) should be able to access this page
    // without being forcibly redirected. The login page handles initial routing.
    const { isAuthorized, isLoading, user } = useDashboardAuth({
        allowedRoles: [
            'student', 'user', 'me_user',
            'admin', 'developer', 'president',
            'council', 'council_member',
            'club_head', 'club_manager',
            'mess_admin', 'mess-admin',
            'hostel_complaints', 'hostel-complaints'
        ]
    });

    // Student dashboard specific data fetching
    useEffect(() => {
        if (isAuthorized && user?.email) {
            fetchMyMenuRequests();
            fetchMyRatings();
        }
    }, [isAuthorized, user]);
    const { tickets } = useTickets();
    const { announcements: sharedAnnouncements, events: sharedEvents, clubs, members, isLoaded } = useSharedData();
    const { myClubByEmail } = useClubData();

    // Filter tickets to only show the current student's own complaints
    const userEmail = user?.email?.toLowerCase() || '';
    const userName = (user?.displayName || '').toLowerCase();
    
    const myFilteredTickets = (tickets || []).filter(t => {
        const ticketEmail = (t.email || '').toLowerCase();
        const ticketStudent = (t.studentName || '').toLowerCase();
        
        if (userEmail && ticketEmail === userEmail) return true;
        if (userName && ticketStudent && (ticketStudent === userName || userName.includes(ticketStudent) || ticketStudent.includes(userName))) return true;
        return false;
    });
    const myTickets = myFilteredTickets.slice(0, 3); // Just show the recent 3 for dashboard overview

    // Debug: Log current user and ticket data to help diagnose per-user filtering
    console.log('[StudentDashboard] Current user:', { email: user?.email, displayName: user?.displayName, id: user?.id });
    console.log('[StudentDashboard] Total tickets:', tickets.length, '| My filtered tickets:', myFilteredTickets.length);
    console.log('[StudentDashboard] Ticket emails:', tickets.map(t => ({ id: t.id, email: t.email, studentName: t.studentName })));

    // Sort Announcements (newest first)
    const allAnnouncements = ([...sharedAnnouncements] as any[]).sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
    });

    // Sort Events (upcoming first)
    const allEvents = [...sharedEvents].sort((a, b) => {
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
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Welcome back, {user?.displayName || 'Student'}</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                            <p className="text-[#94a3b8] text-sm">Logged in as: {user?.email || 'unknown'} • Live feed: Everything that&apos;s happening on campus today.</p>
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
                                <h3 className="text-[32px] font-bold leading-none">{myFilteredTickets.length}</h3>
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
                                <h3 className="text-[32px] font-bold leading-none">0</h3>
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
                                <h3 className="text-[32px] font-bold leading-none">0</h3>
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
                                                        <span className="text-[11px] text-[#64748B] font-mono whitespace-nowrap">{(item as any).date ? new Date((item as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date((item as any).createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                                {myFilteredTickets.length > 0 && (
                                    <Link href="/complaints/history" className="text-sm font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
                                        View All
                                    </Link>
                                )}
                            </div>

                            <div className={`min-h-[220px] rounded-[24px] overflow-hidden ${myTickets.length > 0 ? 'bg-[#111625]' : 'bg-[#111625]/50 border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-8'}`}>
                                {myTickets.length > 0 ? (
                                    <div className="p-6 space-y-4">
                                        {myTickets.map((item) => {
                                            const reopenedEvent = Array.isArray(item.timeline)
                                                ? item.timeline.slice().reverse().find((t: any) => t.description?.startsWith('Reopened:'))
                                                : null;

                                            let incidentDate = null;
                                            if (item.description) {
                                                const dateMatch = item.description.match(/^\[Date of Incident: (.*?)\]\n\n/);
                                                if (dateMatch) incidentDate = dateMatch[1];
                                            }
                                                
                                            return (
                                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-[#1A2133] hover:bg-[#1f2937] transition-colors border border-white/5 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-white leading-tight mb-1">{item.subject}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                                                        <span>{item.id}</span>
                                                        <span>•</span>
                                                        <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        {incidentDate && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:inline text-cyan-500 font-bold whitespace-nowrap overflow-hidden text-ellipsis">Incident: {incidentDate}</span>
                                                            </>
                                                        )}
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline font-sans">{item.type}</span>
                                                    </div>
                                                    {reopenedEvent?.description && (
                                                        <div className="mt-2 text-[11px] text-amber-500/90 font-medium bg-amber-500/10 px-2 py-1 rounded inline-block">
                                                            <span className="font-bold">Reopen Reason:</span> {reopenedEvent.description.replace('Reopened:', '').trim()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold tracking-widest text-[10px] uppercase border ${item.status === 'Completed' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30'}`}>
                                                        {item.status}
                                                    </Badge>
                                                    {item.dueAt && item.status !== 'Completed' && (
                                                        <Badge variant="outline" className={`rounded-full px-2 py-0.5 font-bold tracking-widest text-[9px] uppercase border flex items-center gap-1 ${
                                                            new Date(item.dueAt).getTime() < Date.now() 
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' 
                                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        }`}>
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {new Date(item.dueAt).getTime() < Date.now() ? 'Overdue' : 'Due ' + new Date(item.dueAt).toLocaleDateString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <div className="text-center text-[#64748B] space-y-3">
                                        <ListX className="w-8 h-8 mx-auto opacity-50" />
                                        <p className="italic text-[15px]">No recent complaints found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Your Menu Change Requests */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <UtensilsCrossed className="w-6 h-6 text-[#10b981]" />
                                    <h2 className="text-[22px] font-bold tracking-tight">Your Menu Requests</h2>
                                </div>
                            </div>

                            <div className={`min-h-[160px] rounded-[24px] overflow-hidden ${myMenuRequests.length > 0 ? 'bg-[#111625]' : 'bg-[#111625]/50 border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-8'}`}>
                                {menuRequestsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                                        <span className="ml-3 text-sm text-slate-400">Loading...</span>
                                    </div>
                                ) : myMenuRequests.length > 0 ? (
                                    <div className="p-6 space-y-4">
                                        {myMenuRequests.slice(0, 5).map((req: any) => (
                                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-[#1A2133] hover:bg-[#1f2937] transition-colors border border-white/5 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-white leading-tight mb-1">
                                                        {req.day} — <span className="capitalize">{req.meal_type}</span>
                                                    </h4>
                                                    <div className="text-xs text-[#94a3b8] mb-1">
                                                        <span className="text-[#64748B]">Current:</span> {req.current_item || '—'}
                                                    </div>
                                                    <div className="text-xs text-white">
                                                        <span className="text-[#10b981] font-bold">Suggested:</span> {req.suggested_item}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-mono mt-1.5">
                                                        <span>{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold tracking-widest text-[10px] uppercase border flex-shrink-0 ${
                                                    req.status === 'approved' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' :
                                                    req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                    'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                                                }`}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-[#64748B] space-y-3">
                                        <UtensilsCrossed className="w-8 h-8 mx-auto opacity-50" />
                                        <p className="italic text-[15px]">No menu change requests submitted yet.</p>
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
                                {/* Club Manager Link (Dynamic) */}
                                {myClubByEmail && (
                                    <Link href={`/dashboard/club/${myClubByEmail.slug}`} className="block">
                                        <div className="group bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-[16px] p-4 transition-all duration-300 flex items-center gap-5 cursor-pointer">
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/25 transition-colors">
                                                <TerminalSquare className="w-5 h-5 text-cyan-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-[15px] tracking-wide mb-1">MANAGE {myClubByEmail.name.toUpperCase()}</h4>
                                                <p className="text-[11px] text-cyan-500/70 font-bold tracking-wider uppercase">Club Dashboard Access</p>
                                            </div>
                                        </div>
                                    </Link>
                                )}

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

                                {/* Action 4: Mess Menu */}
                                <div onClick={() => setMessMenuOpen(true)} className="block cursor-pointer">
                                    <div className="group bg-[#1A2133] hover:bg-[#1f2937] border border-white/5 rounded-[16px] p-4 transition-all duration-300 flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#10b981]/25 transition-colors">
                                            <UtensilsCrossed className="w-5 h-5 text-[#10b981]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-[15px] tracking-wide mb-1">MESS MENU</h4>
                                            <p className="text-[11px] text-[#64748B] font-bold tracking-wider uppercase">Weekly meal schedule</p>
                                        </div>
                                    </div>
                                </div>
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

            {/* Mess Menu Modal */}
            {messMenuOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setMessMenuOpen(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-white/10 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 flex items-center justify-center flex-shrink-0">
                                    <UtensilsCrossed className="w-5 h-5 text-[#10b981]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">Weekly Mess Menu</h2>
                                    <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-widest truncate">Sunday — Saturday</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => { setChangeRequestOpen(!changeRequestOpen); setChangeRequestSubmitted(false); }}
                                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border border-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Request Change
                                </button>
                                <button onClick={() => setMessMenuOpen(false)} className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Day Selector Navigation */}
                        <div className="px-6 py-3 border-b border-white/5 bg-[#1E293B]/30 overflow-x-auto flex items-center gap-2 scrollbar-hide">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                                const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                const isSelected = day === selectedMenuDay;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedMenuDay(day)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-1 min-w-[90px] border ${
                                            isSelected 
                                                ? 'bg-[#10b981] text-black border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                                : isToday
                                                    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20'
                                                    : 'bg-white/5 text-[#64748B] border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {day}
                                        {isToday && <span className={`text-[8px] ${isSelected ? 'text-black/70' : 'text-[#10b981]/70'}`}>TODAY</span>}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Meal Category Tab Bar (The "Line") */}
                        <div className="px-6 py-2 border-b border-white/5 bg-black/20 flex items-center gap-1">
                            {['breakfast', 'lunch', 'snacks', 'dinner'].map((type) => {
                                const isActive = selectedMealType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedMealType(type)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg border ${
                                            isActive 
                                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                                                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Change Request Form */}
                        {changeRequestOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="border-b border-white/10 overflow-hidden"
                            >
                                {changeRequestSubmitted ? (
                                    <div className="p-6 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#10b981]/15 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
                                        </div>
                                        <p className="text-sm font-bold text-[#10b981]">Request Submitted Successfully!</p>
                                        <p className="text-xs text-[#64748B]">Your suggestion has been sent to the mess committee.</p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Edit2 className="w-4 h-4 text-[#f59e0b]" />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Request Menu Change</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Day Dropdown */}
                                            <div>
                                                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Select Day</label>
                                                <div className="relative">
                                                    <select
                                                        value={changeRequestDay}
                                                        onChange={e => { setChangeRequestDay(e.target.value); setChangeRequestMeal(''); }}
                                                        className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#f59e0b]/50 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all"
                                                    >
                                                        <option value="" className="bg-[#1A2133]">— Choose a day —</option>
                                                        {messMenuData.map((d: {day: string; meals: Record<string, { items: string, image_url?: string }>}) => (
                                                            <option key={d.day} value={d.day} className="bg-[#1A2133]">{d.day}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Meal Type Dropdown */}
                                            <div>
                                                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Select Meal</label>
                                                <div className="relative">
                                                    <select
                                                        value={changeRequestMeal}
                                                        onChange={e => setChangeRequestMeal(e.target.value)}
                                                        disabled={!changeRequestDay}
                                                        className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#f59e0b]/50 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="" className="bg-[#1A2133]">— Choose meal type —</option>
                                                        <option value="breakfast" className="bg-[#1A2133]">Breakfast</option>
                                                        <option value="lunch" className="bg-[#1A2133]">Lunch</option>
                                                        <option value="snacks" className="bg-[#1A2133]">Snacks</option>
                                                        <option value="dinner" className="bg-[#1A2133]">Dinner</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Existing Item Display */}
                                        {changeRequestDay && changeRequestMeal && (
                                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-1.5">Current Item — {changeRequestDay}, {changeRequestMeal}</p>
                                                <p className="text-sm text-[#94a3b8]">{getExistingItem()}</p>
                                            </div>
                                        )}

                                        {/* Suggested Item Input */}
                                        {changeRequestDay && changeRequestMeal && (
                                            <div>
                                                <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Your Suggested Item</label>
                                                <textarea
                                                    value={changeRequestSuggestion}
                                                    onChange={e => setChangeRequestSuggestion(e.target.value)}
                                                    placeholder="E.g., Replace Poori with Paratha..."
                                                    rows={2}
                                                    className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#f59e0b]/50 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all resize-none"
                                                />
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        {changeRequestDay && changeRequestMeal && (
                                            <button
                                                onClick={handleChangeRequestSubmit}
                                                disabled={!changeRequestSuggestion.trim()}
                                                className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Submit Request
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Menu Content */}
                        <div className="overflow-y-auto flex-1 p-6 scrollbar-hide">
                            {messMenuLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                                    <span className="ml-3 text-sm text-slate-400">Loading menu...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messMenuData.filter(d => d.day === selectedMenuDay).map((item) => {
                                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                        const isToday = item.day === today;
                                        const mealData = item.meals[selectedMealType];
                                        const ratingKey = `${item.day}-${selectedMealType}`;
                                        const userRating = ratings[ratingKey];
                                        const isSubmitting = submittingRating === ratingKey;

                                        return (
                                            <div key={item.day} className="animate-in fade-in slide-in-from-bottom-2 duration-300">


                                                {/* Items List View */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Included Items
                                                        </h4>
                                                        {!mealData && <Badge variant="outline" className="text-[8px] text-slate-600 border-white/5 uppercase">Pending Entry</Badge>}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2.5">
                                                        {mealData?.items_json && Array.isArray(mealData.items_json) && mealData.items_json.length > 0 ? (
                                                            mealData.items_json.map((sub: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] p-4 rounded-2xl border border-white/5 transition-all group">
                                                                    <div className="flex items-center gap-4">
                                                                        {sub.image_url ? (
                                                                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-xl">
                                                                                <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                                                                <UtensilsCrossed className="w-5 h-5 text-slate-700" />
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">{sub.name}</span>
                                                                            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mt-0.5">Chef's Choice</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-cyan-500 transition-colors" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 text-center">
                                                                <p className={`text-xs leading-relaxed font-medium ${!mealData ? 'text-[#475569] italic' : 'text-[#E2E8F0]'}`}>
                                                                    {mealData?.items || 'No menu entries found for this meal category.'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Rating Section - Focused */}
                                                {isToday && mealData && (
                                                    <div className="mt-8 p-6 bg-cyan-500/[0.02] rounded-[2rem] border border-cyan-500/10 backdrop-blur-sm shadow-2xl">
                                                        {userRating ? (
                                                            <div className="flex flex-col items-center gap-3 py-2 text-center">
                                                                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-1">
                                                                    <CheckCircle2 className="w-6 h-6 text-cyan-500" />
                                                                </div>
                                                                <h5 className="text-xs font-bold text-white uppercase tracking-widest">Review Collected</h5>
                                                                <div className="flex items-center gap-3">
                                                                    <RatingStars rating={userRating} setRating={() => {}} disabled />
                                                                    <span className="text-[10px] text-cyan-500/60 font-mono">#{ratingKey.replace(' ', '_')}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                                            How was the <span className="text-cyan-500">{selectedMealType}</span>?
                                                                        </h4>
                                                                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-1">Your feedback helps improve meal quality.</p>
                                                                    </div>
                                                                    {isSubmitting && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex justify-center py-2">
                                                                        <RatingStars 
                                                                            rating={pendingRatings[ratingKey]?.rating || 0} 
                                                                            setRating={(r) => setPendingRatings(prev => ({ 
                                                                                ...prev, 
                                                                                [ratingKey]: { rating: r, remark: prev[ratingKey]?.remark || '' } 
                                                                            }))} 
                                                                            disabled={!!submittingRating}
                                                                        />
                                                                    </div>

                                                                    <AnimatePresence>
                                                                        {pendingRatings[ratingKey] && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="space-y-3 overflow-hidden"
                                                                            >
                                                                                <textarea
                                                                                    value={pendingRatings[ratingKey].remark}
                                                                                    onChange={(e) => setPendingRatings(prev => ({
                                                                                        ...prev,
                                                                                        [ratingKey]: { ...prev[ratingKey], remark: e.target.value }
                                                                                    }))}
                                                                                    placeholder="Provide details about taste or quality (optional)..."
                                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-cyan-500/30 transition-all resize-none shadow-inner"
                                                                                    rows={3}
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleRateMeal(item.day, selectedMealType)}
                                                                                    disabled={!!submittingRating}
                                                                                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/10"
                                                                                >
                                                                                    Confirm Review
                                                                                </button>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {/* If the current day has no data, show message */}
                                    {messMenuData.filter(d => d.day === selectedMenuDay).length === 0 && (
                                        <div className="text-center py-12">
                                            <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                            <p className="text-sm text-slate-400">No menu available for {selectedMenuDay}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            <p className="text-center text-[10px] text-[#475569] font-mono mt-6 tracking-widest uppercase">
                Menu subject to change without prior notice
            </p>
        </div>
    );
}

export default function StudentDashboard() {
    return (
        <StudentDashboardContent />
    );
}
