'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassModal } from '@/components/ui/glass-modal';
import { 
    AlertTriangle, CheckCircle, LogOut, MessageSquare, 
    ThumbsUp, Calendar, Users, Eye, FileText, Home, ArrowLeft
} from 'lucide-react';
import { useTickets, TicketStatus } from '@/lib/ticket-context';
import { useAuthenticationStatus, useUserData, useSignOut } from '@nhost/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostelComplaintsDashboard() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const { tickets, updateTicketStatus } = useTickets();
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();
    const { signOut } = useSignOut();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.push('/login');
                return;
            }
            
            const roles = (user as any).roles || [];
            const defaultRole = user.defaultRole || '';
            
            // Authorization for hostel-complaints / hostel_complaints role, plus admin/president
            if (
                roles.includes('hostel-complaints') || 
                roles.includes('hostel_complaints') || 
                defaultRole === 'hostel-complaints' || 
                defaultRole === 'hostel_complaints' || 
                roles.includes('admin') || 
                roles.includes('president') || 
                roles.includes('developer') ||
                defaultRole === 'admin' || 
                defaultRole === 'president' ||
                defaultRole === 'developer'
            ) {
                setIsAuthorized(true);
            } else {
                router.push('/dashboard/student');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Filter tickets to only show Hostel complaints
    // Check type, department, OR hostelType (for older complaints saved before the schema fix)
    const hostelTickets = tickets.filter(t => 
        t.type === 'Hostel' || 
        t.department === 'Hostel' || 
        (t.hostelType && t.hostelType.length > 0)
    );

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
                        <Link href="/dashboard/student" className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors text-sm font-medium mb-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Student Portal
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <h1 className="text-3xl font-extrabold tracking-widest text-[#0ea5e9] uppercase leading-none font-mono flex items-center gap-3">
                                <Home className="w-8 h-8" /> Hostel Complaints
                            </h1>
                            <Badge variant="outline" className="border-[#0ea5e9]/50 text-[#0ea5e9] bg-transparent rounded-full px-4 py-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                                Warden Office Access
                            </Badge>
                        </div>
                        <p className="text-sm text-[#94a3b8] mt-1">Management portal for all hostel-related grievance redressal.</p>
                    </div>

                    <div className="flex items-center gap-4">
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

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-[#111625] border-white/5 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Total Received</p>
                                    <h3 className="text-3xl font-bold">{hostelTickets.length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9]">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#111625] border-white/5 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Pending Action</p>
                                    <h3 className="text-3xl font-bold text-yellow-500">{hostelTickets.filter(t => t.status === 'Pending').length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#111625] border-white/5 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1">Resolved Today</p>
                                    <h3 className="text-3xl font-bold text-green-500">{hostelTickets.filter(t => t.status === 'Completed').length}</h3>
                                </div>
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-mono uppercase tracking-widest text-[#94a3b8]">Recent Hostel Complaints</h2>
                    </div>

                    {hostelTickets.length === 0 ? (
                        <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 min-h-[400px]">
                            <MessageSquare className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                            <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Complaints Found</h3>
                            <p className="text-[#64748B] italic max-w-sm">There are no hostel category complaints registered in the system yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {hostelTickets.map((ticket) => (
                                    <motion.div 
                                        key={ticket.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                    >
                                        <Card className="bg-white/5 border-white/10 hover:border-[#0ea5e9]/30 transition-all group">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row justify-between gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-xs text-[#64748B] bg-white/5 px-2 py-0.5 rounded">{ticket.id}</span>
                                                            <Badge className={`${
                                                                ticket.priority === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/10' : 
                                                                ticket.priority === 'Medium' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/10' : 
                                                                'bg-blue-500/20 text-blue-500 border-blue-500/10'
                                                            } border`}>
                                                                {ticket.priority} Priority
                                                            </Badge>
                                                            {(ticket.hostelType || ticket.roomNumber) && (
                                                                <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                    <Home className="w-3 h-3" />
                                                                    {ticket.hostelType} {ticket.roomNumber ? `• Room ${ticket.roomNumber}` : ''}
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs text-[#64748B] flex items-center gap-1 ml-2">
                                                                <ThumbsUp className="w-3 h-3 text-[#0ea5e9]" />
                                                                {ticket.votes || 0} Votes
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-xl font-bold text-white mb-2">{ticket.subject}</h3>
                                                            <p className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                                        </div>

                                                        {ticket.image && (
                                                            <div className="pt-2">
                                                                <div 
                                                                    className="relative h-24 w-36 rounded-lg overflow-hidden border border-white/10 cursor-pointer group/img bg-black/40"
                                                                    onClick={() => setViewingImage(ticket.image!)}
                                                                >
                                                                    <img 
                                                                        src={ticket.image} 
                                                                        alt="Attachment" 
                                                                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <Eye className="w-5 h-5 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-3.5 h-3.5" />
                                                                <span className="text-white font-medium">{ticket.studentName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="lg:w-64 space-y-4">
                                                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-1">Status Control</span>
                                                                <Badge className={`w-full justify-center py-1.5 text-xs font-bold uppercase tracking-wider ${
                                                                    ticket.status === 'Completed' ? 'bg-green-500 text-black' : 
                                                                    ticket.status === 'In Progress' ? 'bg-blue-500 text-white' : 
                                                                    ticket.status === 'In Review' ? 'bg-[#0ea5e9] text-black' : 
                                                                    'bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/20'
                                                                }`}>
                                                                    {ticket.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-2">
                                                                {ticket.status === 'Pending' && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-9"
                                                                        onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                                                                    >
                                                                        Mark In Progress
                                                                    </Button>
                                                                )}
                                                                {ticket.status !== 'Completed' && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-9"
                                                                        onClick={() => updateTicketStatus(ticket.id, 'Completed')}
                                                                    >
                                                                        Mark Resolved
                                                                    </Button>
                                                                )}
                                                                {ticket.status === 'Completed' && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        className="w-full border-white/10 hover:bg-white/5 text-white h-9"
                                                                        onClick={() => updateTicketStatus(ticket.id, 'Pending', 'Complaint reopened by Hostel Warden')}
                                                                    >
                                                                        Reopen Case
                                                                    </Button>
                                                                )}
                                                            </div>
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
                title="Attachment Preview"
                footer={
                    <Button onClick={() => setViewingImage(null)} className="bg-white text-black hover:bg-gray-200">
                        Close
                    </Button>
                }
            >
                <div className="flex justify-center items-center bg-black/20 rounded-lg p-2 min-h-[200px]">
                    {viewingImage && (
                        <img 
                            src={viewingImage} 
                            alt="Full size attachment" 
                            className="max-w-full max-h-[70vh] object-contain rounded-md shadow-2xl" 
                        />
                    )}
                </div>
            </GlassModal>
        </div>
    );
}
