'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassModal } from '@/components/ui/glass-modal';
import { 
    AlertTriangle, CheckCircle, LogOut, MessageSquare, 
    ThumbsUp, Calendar, Users, Eye, FileText, Home, Clock,
    BarChart3, PieChart as PieChartIcon, Filter, CheckSquare, Square, Trash2,
    UtensilsCrossed, X
} from 'lucide-react';
import { useTickets, TicketStatus } from '@/lib/ticket-context';
import { useAuthenticationStatus, useUserData, useSignOut } from '@nhost/react';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { useSharedData } from '@/hooks/useSharedData';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

// SLA Timer Component
const SLATimer = ({ dueAt }: { dueAt?: string | null }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        if (!dueAt) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const due = new Date(dueAt).getTime();
            const diff = due - now;

            if (diff < 0) {
                setIsOverdue(true);
                const absDiff = Math.abs(diff);
                const hours = Math.floor(absDiff / (1000 * 60 * 60));
                const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${mins}m overdue`);
            } else {
                setIsOverdue(false);
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${mins}m left`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [dueAt]);

    if (!dueAt) return null;

    return (
        <Badge variant="outline" className={`${
            isOverdue ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
        } rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse`}>
            <Clock className="w-3 h-3" />
            {timeLeft}
        </Badge>
    );
};

export default function HostelComplaintsDashboard() {
    const router = useRouter();
    const { tickets, updateTicketStatus, assignTicket, setDeadline } = useTickets();
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>('All');
    const [filterDate, setFilterDate] = useState<string>('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    
    const [reopenTicketId, setReopenTicketId] = useState<string | null>(null);
    const [reopenReason, setReopenReason] = useState<string>('');
    const [deadlineTicketId, setDeadlineTicketId] = useState<string | null>(null);
    const [deadlineValue, setDeadlineValue] = useState<string>('');

    const { signOut } = useSignOut();

    // Nhost Integration
    const { isAuthorized, isLoading, user } = useDashboardAuth({
        allowedRoles: ['hostel-complaints', 'hostel_complaints', 'admin', 'developer', 'president']
    });

    const { refetchTickets } = useSharedData();

    // Filter tickets to only show Hostel and Mess complaints
    const hostelTicketsRaw = useMemo(() => tickets.filter(t => 
        t.type === 'Hostel' || t.department === 'Hostel' || 
        t.type === 'Mess' || t.department === 'Mess' || 
        (t.hostelType && t.hostelType.length > 0)
    ), [tickets]);

    const filteredTickets = useMemo(() => {
        return hostelTicketsRaw.filter(ticket => {
            const matchesType = filterType === 'All' 
                ? true 
                : (filterType === 'Boys Hostel' || filterType === 'Male') ? ticket.hostelType === 'Boys Hostel'
                : (filterType === 'Girls Hostel' || filterType === 'Female') ? ticket.hostelType === 'Girls Hostel'
                : filterType === 'Mess' ? (ticket.type === 'Mess' || ticket.department === 'Mess')
                : true;
            const matchesDate = !filterDate ? true : ticket.createdAt.startsWith(filterDate);
            
            return matchesType && matchesDate;
        });
    }, [hostelTicketsRaw, filterType, filterDate]);

    // Analytics Data
    const analyticsData = useMemo(() => {
        const categories: Record<string, number> = {};
        const statusCount: Record<string, number> = { Pending: 0, 'In Progress': 0, Completed: 0 };

        hostelTicketsRaw.forEach(t => {
            const subject = t.subject || 'Other';
            categories[subject] = (categories[subject] || 0) + 1;
            
            if (statusCount[t.status] !== undefined) {
                statusCount[t.status]++;
            }
        });

        const categoryChart = Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
        const statusChart = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

        return { categoryChart, statusChart, statusCount };
    }, [hostelTicketsRaw]);

    const COLORS = ['#0ea5e9', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    const handleBulkAction = async (action: 'Resolve') => {
        if (selectedTickets.length === 0) return;
        
        const ticketsToUpdate = [...selectedTickets];
        setSelectedTickets([]); // Optimistically clear selection
        
        if (action === 'Resolve') {
            await Promise.all(ticketsToUpdate.map(id => updateTicketStatus(id, 'Completed', 'Bulk resolved by admin')));
        }
    };

    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0B0B14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0ea5e9]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B14] text-white pt-24 md:pt-16 pb-20 font-sans">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#0ea5e9] uppercase leading-none font-mono flex items-center gap-3 text-balance">
                                <Home className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> Hostel Manager Dashboard
                            </h1>
                            <Badge variant="outline" className="border-[#0ea5e9]/50 text-[#0ea5e9] bg-transparent rounded-full px-4 py-1 text-[10px] font-bold tracking-[0.2em] uppercase w-fit">
                                Advanced Management
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className={`border-white/10 hover:bg-white/5 text-xs font-bold tracking-widest uppercase h-10 px-4 ${showAnalytics ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/50' : 'text-[#64748B]'}`}
                            onClick={() => setShowAnalytics(!showAnalytics)}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-[#64748B] hover:text-white hover:bg-white/5 text-xs font-bold tracking-widest uppercase h-10 px-3"
                            onClick={async () => {
                                await signOut();
                                router.push('/login');
                            }}
                        >
                            Sign Out <LogOut className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Main Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    <div className="p-6 bg-[#111625] border border-white/5 rounded-2xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-1">Total Active</p>
                            <h3 className="text-3xl font-bold">{hostelTicketsRaw.filter(t => t.status !== 'Completed').length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9]">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="p-6 bg-[#111625] border border-white/5 rounded-2xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-1">High Priority</p>
                            <h3 className="text-3xl font-bold text-red-500">{hostelTicketsRaw.filter(t => t.priority === 'High' && t.status !== 'Completed').length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-6 bg-[#111625] border border-white/5 rounded-2xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-1">Resolved Today</p>
                            <h3 className="text-3xl font-bold text-green-500">{hostelTicketsRaw.filter(t => t.status === 'Completed').length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Analytics View */}
                <AnimatePresence>
                    {showAnalytics && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-[#111625] border-white/5 shadow-2xl p-6">
                                    <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <PieChartIcon className="w-4 h-4 text-[#0ea5e9]" /> Top Complaint Categories
                                    </h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.categoryChart} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                                                <Tooltip 
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#111625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                />
                                                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                                <Card className="bg-[#111625] border-white/5 shadow-2xl p-6 text-center">
                                    <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-2">
                                        <Filter className="w-4 h-4 text-[#ec4899]" /> Status Distribution
                                    </h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData.statusChart}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {analyticsData.statusChart.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={
                                                            entry.name === 'Pending' ? '#ef4444' :
                                                            entry.name === 'In Progress' ? '#0ea5e9' :
                                                            '#10b981'
                                                        } />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#111625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                                            {analyticsData.statusChart.map((entry, index) => (
                                                <div key={entry.name} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 
                                                        entry.name === 'Pending' ? '#ef4444' :
                                                        entry.name === 'In Progress' ? '#0ea5e9' :
                                                        '#10b981'
                                                     }} />
                                                    <span className="text-[10px] text-[#94a3b8]">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List Section */}
                <div className="space-y-6">
                    {/* Advanced Filters */}
                    <div className="bg-[#111625] border border-white/5 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full lg:w-auto">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mr-2">Filters:</span>
                                {['All', 'Male', 'Female', 'Boys Hostel', 'Girls Hostel', 'Mess'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterType(filter)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                                            filterType === filter 
                                                ? 'bg-[#0ea5e9] text-black' 
                                                : 'bg-white/5 text-[#64748B] hover:text-white'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mr-2">Submit Date:</span>
                                <div className="relative group">
                                    <input 
                                        type="date" 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-[#94a3b8] focus:outline-none focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/20 transition-all hover:text-white cursor-pointer"
                                    />
                                    {filterDate && (
                                        <button 
                                            onClick={() => setFilterDate('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-red-400 transition-colors p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedTickets.length > 0 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 mr-4">
                                    <span className="text-xs font-bold text-[#0ea5e9] mr-2">{selectedTickets.length} Selected</span>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-3 text-xs" onClick={() => handleBulkAction('Resolve')}>
                                        Bulk Resolve
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8 px-2" onClick={() => setSelectedTickets([])}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs font-bold text-[#64748B] uppercase tracking-widest h-8"
                                onClick={() => {
                                    if (selectedTickets.length === filteredTickets.length) setSelectedTickets([]);
                                    else setSelectedTickets(filteredTickets.map(t => t.id));
                                }}
                            >
                                {selectedTickets.length === filteredTickets.length && filteredTickets.length > 0 ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </div>

                    {filteredTickets.length === 0 ? (
                        <div className="border border-dashed border-white/5 rounded-[32px] p-24 flex flex-col items-center justify-center text-center bg-[#111625]/20">
                            <MessageSquare className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                            <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Matching Complaints</h3>
                            <p className="text-[#64748B] italic max-w-sm">Try adjusting your filters to see more results.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {filteredTickets.map((ticket) => (
                                    <motion.div 
                                        key={ticket.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                    >
                                        <Card className={`bg-white/5 border-white/10 hover:border-[#0ea5e9]/30 transition-all group overflow-hidden ${selectedTickets.includes(ticket.id) ? 'border-[#0ea5e9]/50 bg-[#0ea5e9]/5' : ''}`}>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Selection Sidebar */}
                                                    <div 
                                                        className={`w-12 md:w-1 flex items-center justify-center cursor-pointer transition-colors ${selectedTickets.includes(ticket.id) ? 'bg-[#0ea5e9]' : 'bg-white/5 hover:bg-white/10'}`}
                                                        onClick={() => {
                                                            setSelectedTickets(prev => 
                                                                prev.includes(ticket.id) ? prev.filter(id => id !== ticket.id) : [...prev, ticket.id]
                                                            );
                                                        }}
                                                    >
                                                        <div className="md:hidden">
                                                            {selectedTickets.includes(ticket.id) ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5 text-[#64748B]" />}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-mono text-[10px] text-[#64748B] bg-white/5 px-2 py-0.5 rounded tracking-tighter">#{ticket.id.split('-')[0]}</span>
                                                                <Badge className={`${
                                                                    ticket.priority === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/10' : 
                                                                    ticket.priority === 'Medium' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/10' : 
                                                                    'bg-emerald-500/20 text-emerald-500 border-emerald-500/10'
                                                                } border text-[10px] font-bold uppercase tracking-widest px-2`}>
                                                                    {ticket.priority}
                                                                </Badge>
                                                                <SLATimer dueAt={ticket.dueAt} />
                                                                
                                                                <Badge variant="outline" className={`${ticket.type === 'Mess' || ticket.department === 'Mess' ? 'border-[#10b981]/30 text-[#10b981] bg-[#10b981]/5' : 'border-[#0ea5e9]/30 text-[#0ea5e9] bg-[#0ea5e9]/5'} rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1`}>
                                                                    {ticket.type === 'Mess' || ticket.department === 'Mess' ? (
                                                                        <>
                                                                            <UtensilsCrossed className="w-3 h-3" />
                                                                            Mess Complaint • {ticket.subject.includes('Mess') ? 'Service' : 'Mess Area'}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Home className="w-3 h-3" />
                                                                            {ticket.hostelType} {ticket.floor ? `• Floor ${ticket.floor}` : ''} • Rm {ticket.roomNumber}
                                                                        </>
                                                                    )}
                                                                </Badge>

                                                                {ticket.isEscalated && (
                                                                    <Badge className="bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest px-2 animate-bounce">
                                                                        Escalated
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">{ticket.subject}</h3>
                                                                <p className="text-[#94a3b8] text-sm leading-relaxed line-clamp-2 italic">"{ticket.description}"</p>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-6 text-[10px] text-[#64748B] pt-4 font-bold tracking-widest uppercase">
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-3.5 h-3.5 text-[#0ea5e9]" />
                                                                    <span className="text-white">{ticket.studentName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <ThumbsUp className="w-3.5 h-3.5 text-pink-500" />
                                                                    <span>{ticket.votes || 0} Votes</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions Column */}
                                                        <div className="lg:w-48 space-y-4">
                                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                                    <Button 
                                                                        size="sm" 
                                                                        className={`h-9 font-bold text-[10px] uppercase tracking-wider ${ticket.status === 'In Progress' ? 'bg-[#0ea5e9] text-black' : 'bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'}`}
                                                                        onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                                                                    >
                                                                        In Progress
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        className={`h-9 font-bold text-[10px] uppercase tracking-wider ${ticket.status === 'Completed' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'}`}
                                                                        onClick={() => updateTicketStatus(ticket.id, 'Completed')}
                                                                    >
                                                                        Resolve
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="h-9 font-bold text-[10px] uppercase tracking-wider bg-white/5 text-[#f59e0b] hover:bg-[#f59e0b]/10 border border-[#f59e0b]/20"
                                                                        onClick={() => {
                                                                            setDeadlineTicketId(ticket.id);
                                                                            setDeadlineValue(ticket.dueAt ? new Date(ticket.dueAt).toISOString().slice(0, 10) : '');
                                                                        }}
                                                                    >
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                        {ticket.dueAt ? 'Edit Deadline' : 'Set Deadline'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            
                                                            {ticket.image && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="w-full h-8 text-[10px] text-[#0ea5e9] hover:bg-[#0ea5e9]/10"
                                                                    onClick={() => setViewingImage(ticket.image!)}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 mr-2" /> View Attachment
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <GlassModal
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                title="Evidence Review"
                footer={
                    <Button onClick={() => setViewingImage(null)} className="w-full bg-[#1a1f2e] text-white border border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-xs h-12">
                        Close Preview
                    </Button>
                }
            >
                <div className="flex justify-center items-center bg-black/40 rounded-2xl overflow-hidden border border-white/5 p-1">
                    {viewingImage && (
                        <img 
                            src={viewingImage || undefined} 
                            alt="Evidence" 
                            className="max-w-full max-h-[75vh] object-contain" 
                        />
                    )}
                </div>
            </GlassModal>

            {/* Reopen Modal */}
            <GlassModal
                isOpen={!!reopenTicketId}
                onClose={() => { setReopenTicketId(null); setReopenReason(''); }}
                title="Reopen Case File"
                footer={
                    <div className="flex justify-end gap-3 w-full p-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => { setReopenTicketId(null); setReopenReason(''); }}
                            className="text-[#64748B] hover:text-white font-bold uppercase tracking-widest text-[10px]"
                        >
                            Abort
                        </Button>
                        <Button 
                            className="bg-red-600 text-white hover:bg-red-500 font-bold uppercase tracking-widest text-[10px] px-6"
                            onClick={() => {
                                if (!reopenReason.trim() || !reopenTicketId) return;
                                updateTicketStatus(reopenTicketId, 'Pending', `Reopened: ${reopenReason}`);
                                setReopenTicketId(null);
                                setReopenReason('');
                            }}
                            disabled={!reopenReason.trim()}
                        >
                            Confirm Reopen
                        </Button>
                    </div>
                }
            >
                <div className="py-2 space-y-4">
                    <p className="text-xs text-[#94a3b8] font-medium leading-relaxed">
                        Security Protokol: Provide a detailed justification for reopening this case. This audit trail is visible to the student.
                    </p>
                    <textarea 
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        className="w-full bg-[#0B0B14] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#0ea5e9]/50 transition-all resize-none shadow-inner"
                        rows={5}
                        placeholder="Technical reason for reopening..."
                        autoFocus
                    />
                </div>
            </GlassModal>

            {/* Set Deadline Modal */}
            <GlassModal
                isOpen={!!deadlineTicketId}
                onClose={() => { setDeadlineTicketId(null); setDeadlineValue(''); }}
                title="Set Resolution Deadline"
                footer={
                    <div className="flex justify-end gap-3 w-full p-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => { setDeadlineTicketId(null); setDeadlineValue(''); }}
                            className="text-[#64748B] hover:text-white font-bold uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-[#f59e0b] text-black hover:bg-[#f59e0b]/90 font-bold uppercase tracking-widest text-[10px] px-6"
                            onClick={() => {
                                if (!deadlineValue || !deadlineTicketId) return;
                                setDeadline(deadlineTicketId, new Date(deadlineValue).toISOString());
                                setDeadlineTicketId(null);
                                setDeadlineValue('');
                            }}
                            disabled={!deadlineValue}
                        >
                            Confirm Deadline
                        </Button>
                    </div>
                }
            >
                <div className="py-2 space-y-4">
                    <p className="text-xs text-[#94a3b8] font-medium leading-relaxed">
                        Set a target date and time by which this complaint should be resolved. The countdown will be visible on the ticket.
                    </p>
                    <input 
                        type="date"
                        value={deadlineValue}
                        onChange={(e) => setDeadlineValue(e.target.value)}
                        className="w-full bg-[#0B0B14] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#f59e0b]/50 transition-all"
                        min={new Date().toISOString().slice(0, 10)}
                        autoFocus
                    />
                </div>
            </GlassModal>
        </div>
    );
}
