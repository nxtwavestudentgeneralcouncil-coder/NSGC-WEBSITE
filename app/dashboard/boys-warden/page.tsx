'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassModal } from '@/components/ui/glass-modal';
import { 
    AlertTriangle, CheckCircle, Home, Clock, Filter, UtensilsCrossed, FileText
} from 'lucide-react';
import { useTickets, TicketStatus } from '@/lib/ticket-context';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { motion, AnimatePresence } from 'framer-motion';

// Quick SLA Timer purely for visual indicator on ticket card
const SLATimer = ({ dueAt }: { dueAt?: string | null }) => {
    if (!dueAt) return null;
    const isOverdue = new Date(dueAt).getTime() < Date.now();
    return (
        <Badge variant="outline" className={`${
            isOverdue ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
        } rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse`}>
            <Clock className="w-3 h-3" />
            {isOverdue ? 'Overdue' : 'Due ' + new Date(dueAt).toLocaleDateString()}
        </Badge>
    );
};

export default function BoysWardenDashboard() {
    const router = useRouter();
    const { tickets, updateTicketStatus, setDeadline } = useTickets();
    const [filterStatus, setFilterStatus] = useState<string>('All');
    
    // UI state
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [reopenTicketId, setReopenTicketId] = useState<string | null>(null);
    const [reopenReason, setReopenReason] = useState<string>('');
    const [deadlineTicketId, setDeadlineTicketId] = useState<string | null>(null);
    const [deadlineValue, setDeadlineValue] = useState<string>('');

    // Authentication strict validation
    const { isAuthorized, isLoading } = useDashboardAuth({
        allowedRoles: ['boys-warden', 'boys_warden', 'admin', 'developer', 'president']
    });

    // Filtering explicitly for Boys Hostel
    const boysHostelTickets = useMemo(() => tickets.filter(t => t.hostelType === 'Boys Hostel'), [tickets]);

    const displayTickets = useMemo(() => {
        return boysHostelTickets.filter(ticket => filterStatus === 'All' ? true : ticket.status === filterStatus);
    }, [boysHostelTickets, filterStatus]);

    // Simple top stats metrics
    const stats = useMemo(() => {
        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        boysHostelTickets.forEach(t => {
            if (t.status === 'Pending') pending++;
            else if (t.status === 'In Progress') inProgress++;
            else if (t.status === 'Completed') completed++;
        });
        return { pending, inProgress, completed, total: boysHostelTickets.length };
    }, [boysHostelTickets]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0B0B14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0ea5e9]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B14] text-white pt-24 pb-12 font-sans selection:bg-[#0ea5e9]/30">
            <div className="container mx-auto px-4 max-w-6xl">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[#0ea5e9]/20 p-2 rounded-lg border border-[#0ea5e9]/30">
                                <Home className="w-6 h-6 text-[#0ea5e9]" />
                            </div>
                            <Badge variant="outline" className="border-[#0ea5e9]/30 text-[#0ea5e9] bg-[#0ea5e9]/10 rounded-full px-3 py-1 text-xs font-mono">
                                WARDEN PORTAL
                            </Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            Boys Hostel
                        </h1>
                        <p className="text-[#64748B] text-sm mt-3 font-mono">
                            Manage and resolve complaints reported in the Boys Hostel.
                        </p>
                    </div>
                </div>

                {/* Simplified Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#111625] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total</p>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </div>
                    <div className="bg-[#111625] border border-[#ef4444]/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                        <p className="text-[#ef4444] text-xs font-bold uppercase tracking-widest mb-2">Pending</p>
                        <p className="text-3xl font-black text-[#ef4444]">{stats.pending}</p>
                    </div>
                    <div className="bg-[#111625] border border-[#0ea5e9]/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(14,165,233,0.05)]">
                        <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-widest mb-2">In Progress</p>
                        <p className="text-3xl font-black text-[#0ea5e9]">{stats.inProgress}</p>
                    </div>
                    <div className="bg-[#111625] border border-[#10b981]/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                        <p className="text-[#10b981] text-xs font-bold uppercase tracking-widest mb-2">Resolved</p>
                        <p className="text-3xl font-black text-[#10b981]">{stats.completed}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-[#111625] p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 px-3 text-[#64748B]">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Filter:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                    filterStatus === status 
                                    ? 'bg-white text-black shadow-white/20' 
                                    : 'bg-black/40 text-[#94a3b8] hover:bg-black hover:text-white border border-white/5'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Complaints List */}
                <div className="space-y-4">
                    {displayTickets.length === 0 ? (
                        <div className="text-center py-20 bg-[#111625] rounded-3xl border border-white/5 shadow-xl">
                            <CheckCircle className="mx-auto h-12 w-12 text-[#10b981] opacity-50 mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">All clear!</h3>
                            <p className="text-[#64748B]">No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} complaints in the Boys Hostel.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {displayTickets.map((ticket, i) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="bg-[#111625] border border-white/10 hover:border-[#0ea5e9]/30 rounded-2xl overflow-hidden shadow-lg transition-colors p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Details Section */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-[10px] text-[#64748B] bg-white/5 px-2 py-0.5 rounded tracking-tighter">
                                                        #{ticket.id.split('-')[0]}
                                                    </span>
                                                    <Badge className={`${
                                                        ticket.priority === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/10' : 
                                                        ticket.priority === 'Medium' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/10' : 
                                                        'bg-emerald-500/20 text-emerald-500 border-emerald-500/10'
                                                    } border text-[10px] font-bold uppercase tracking-widest px-2`}>
                                                        {ticket.priority} Priority
                                                    </Badge>
                                                    <SLATimer dueAt={ticket.dueAt} />
                                                    {ticket.roomNumber && (
                                                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 bg-cyan-500/5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                            Room {ticket.roomNumber}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-2">{ticket.subject}</h3>
                                                    <p className="text-sm text-[#94a3b8] leading-relaxed">{ticket.description}</p>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs font-mono text-[#64748B] bg-black/40 px-3 py-2 rounded-lg inline-flex">
                                                    <span>By: {ticket.studentName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                {/* Reopen Info */}
                                                {(ticket.timeline || []).slice().reverse().find(t => t.description?.startsWith('Reopened:')) && (
                                                    <div className="text-[11px] text-amber-500/90 font-medium bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 mt-2">
                                                        <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Reopened:</span> 
                                                        {(ticket.timeline || []).slice().reverse().find(t => t.description?.startsWith('Reopened:'))?.description?.replace('Reopened:', '').trim()}
                                                    </div>
                                                )}

                                                {/* Image Attachment */}
                                                {ticket.image && (
                                                    <div className="mt-4">
                                                        <div 
                                                            className="relative h-24 w-36 rounded-lg overflow-hidden border border-white/10 cursor-pointer group hover:border-[#0ea5e9]/50 transition-colors"
                                                            onClick={() => setViewingImage(ticket.image!)}
                                                        >
                                                            <img src={ticket.image} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <FileText className="w-5 h-5 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Sidebar */}
                                            <div className="flex flex-col gap-3 lg:w-48 xl:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                                                <Badge variant="outline" className={`justify-center py-1 border font-bold tracking-widest text-[10px] uppercase w-full ${
                                                    ticket.status === 'Completed' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 
                                                    ticket.status === 'In Progress' ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30' : 
                                                    'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                                                }`}>
                                                    Status: {ticket.status}
                                                </Badge>

                                                <div className="flex flex-col gap-2 mt-auto pt-4">
                                                    {ticket.status !== 'Completed' ? (
                                                        <>
                                                            {ticket.status === 'Pending' && (
                                                                <Button 
                                                                    onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                                                                    className="w-full bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 border border-[#0ea5e9]/30 text-xs shadow-none"
                                                                >
                                                                    Mark In Progress
                                                                </Button>
                                                            )}
                                                            <Button 
                                                                onClick={() => { setDeadlineTicketId(ticket.id); setDeadlineValue(ticket.dueAt ? new Date(ticket.dueAt).toISOString().slice(0, 10) : ''); }}
                                                                variant="outline" 
                                                                className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs"
                                                            >
                                                                Set Deadline
                                                            </Button>
                                                            <Button 
                                                                onClick={() => updateTicketStatus(ticket.id, 'Completed')}
                                                                className="w-full bg-[#10b981] text-black hover:bg-[#059669] text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                            >
                                                                Resolve Ticket
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => setReopenTicketId(ticket.id)}
                                                            variant="outline"
                                                            className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                                                        >
                                                            Reopen Ticket
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {viewingImage && (
                    <GlassModal isOpen={!!viewingImage} onClose={() => setViewingImage(null)} title="Evidential Image">
                        <img src={viewingImage} alt="Enlarged" className="w-full rounded-lg" />
                    </GlassModal>
                )}
                
                {reopenTicketId && (
                    <GlassModal isOpen={!!reopenTicketId} onClose={() => { setReopenTicketId(null); setReopenReason(''); }} title="Reopen Ticket">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-gray-400">Please provide a reason for reopening this ticket.</p>
                            <textarea
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-24"
                                placeholder="E.g., Issue recurred within 24 hours..."
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => { setReopenTicketId(null); setReopenReason(''); }}>Cancel</Button>
                                <Button 
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => {
                                        updateTicketStatus(reopenTicketId, 'In Progress', `Reopened: ${reopenReason}`);
                                        setReopenTicketId(null);
                                        setReopenReason('');
                                    }}
                                    disabled={!reopenReason.trim()}
                                >
                                    Reopen
                                </Button>
                            </div>
                        </div>
                    </GlassModal>
                )}

                {deadlineTicketId && (
                    <GlassModal isOpen={!!deadlineTicketId} onClose={() => { setDeadlineTicketId(null); setDeadlineValue(''); }} title="Set Resolution Deadline">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm text-[#94a3b8]">Select a target date and time to resolve this complaint.</p>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Due Date & Time</label>
                                <input 
                                    type="date" 
                                    value={deadlineValue}
                                    onChange={(e) => setDeadlineValue(e.target.value)}
                                    className="w-full bg-[#0B0B14] border border-[#f59e0b]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b] shadow-inner [color-scheme:dark]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" className="hover:bg-white/5" onClick={() => { setDeadlineTicketId(null); setDeadlineValue(''); }}>Cancel</Button>
                                <Button 
                                    className="bg-[#f59e0b] text-black hover:bg-[#f59e0b]/90 font-bold"
                                    onClick={() => {
                                        if (deadlineValue) {
                                            setDeadline(deadlineTicketId, new Date(deadlineValue).toISOString());
                                            setDeadlineTicketId(null);
                                            setDeadlineValue('');
                                        }
                                    }}
                                    disabled={!deadlineValue}
                                >
                                    Confirm Deadline
                                </Button>
                            </div>
                        </div>
                    </GlassModal>
                )}
            </AnimatePresence>
        </div>
    );
}
