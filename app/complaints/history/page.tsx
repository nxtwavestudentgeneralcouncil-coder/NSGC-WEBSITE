'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Filter, Pencil } from 'lucide-react';
import { useTickets, TicketProvider } from '@/lib/ticket-context';
import { useState } from 'react';
import { useUserData } from '@nhost/react';

function ComplaintsHistoryContent() {
    const { tickets } = useTickets();
    const user = useUserData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Filter tickets to only show the current student's own complaints
    const userEmail = user?.email?.toLowerCase() || '';
    const userName = user?.displayName || '';
    const myTickets = tickets.filter(t => {
        if (t.email && userEmail) return t.email.toLowerCase() === userEmail;
        if (t.studentName && userName) return t.studentName === userName;
        return false;
    });

    const filteredTickets = myTickets.filter(ticket => {
        const matchesSearch = ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-black text-white pt-24 md:pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/dashboard/student">
                        <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Complaints History</h1>
                        <p className="text-gray-400">View and track all your submitted complaints.</p>
                    </div>
                    <Link href="/complaints" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-cyan-500 text-black hover:bg-cyan-400">
                            Submit New Complaint
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-grow md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Type, or Description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {['All', 'Pending', 'In Review', 'In Progress', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${filterStatus === status
                                    ? 'bg-white text-black border-white'
                                    : 'bg-transparent text-gray-400 border-white/20 hover:border-white/50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket, index) => {
                            const reopenedEvent = Array.isArray(ticket.timeline)
                                ? ticket.timeline.slice().reverse().find((t: any) => t.description?.startsWith('Reopened:'))
                                : null;

                            let incidentDate = null;
                            let displayDescription = ticket.description || '';
                            if (displayDescription) {
                                const dateMatch = displayDescription.match(/^\[Date of Incident: (.*?)\]\n\n/);
                                if (dateMatch) {
                                    incidentDate = dateMatch[1];
                                    displayDescription = displayDescription.replace(dateMatch[0], '');
                                }
                            }

                            return (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Badge variant="outline" className="border-white/20 text-gray-300">
                                                        {ticket.id}
                                                    </Badge>
                                                    <Badge className={
                                                        ticket.status === 'Completed' ? 'bg-green-500' :
                                                            ticket.status === 'In Progress' ? 'bg-blue-500' :
                                                                ticket.status === 'In Review' ? 'bg-cyan-500' :
                                                                    'bg-cyan-500 text-black'
                                                    }>
                                                        {ticket.status}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span>{new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {incidentDate && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-cyan-400 font-bold tracking-wide">Incident: {incidentDate}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold break-words">{ticket.type}</h3>
                                                <p className="text-gray-400 text-sm line-clamp-2 lg:line-clamp-none break-words">
                                                    {displayDescription}
                                                </p>
                                                {reopenedEvent?.description && (
                                                    <div className="mt-2 text-sm text-amber-500/90 font-medium bg-amber-500/10 px-3 py-1.5 rounded inline-block">
                                                        <span className="font-bold">Reopen Reason:</span> {reopenedEvent.description.replace('Reopened:', '').trim()}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
                                                    <span>Category: {ticket.department}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>Priority: {ticket.priority}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto mt-2 lg:mt-0 flex-shrink-0">

                                                <Link href={`/complaints?edit=${ticket.id}`} className="w-full sm:w-1/3 lg:w-full">
                                                    <Button variant="outline" size="sm" className="w-full border-white/20 hover:bg-white/20">
                                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                                    </Button>
                                                </Link>

                                                <Link href={`/complaints?view=${ticket.id}`} className="w-full sm:w-1/3 lg:w-full">
                                                    <Button variant="outline" size="sm" className="w-full border-white/20 hover:bg-white/20">
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Link href={`/complaints?track=${ticket.id}`} className="w-full sm:w-1/3 lg:w-full">
                                                    <Button size="sm" className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
                                                        Track Status
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-gray-400 mb-4">No complaints found matching your criteria.</p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}
                                className="border-white/20"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}

            </div>
        </div>
    );
}

export default function ComplaintsHistoryPage() {
    return (
        <ComplaintsHistoryContent />
    );
}
