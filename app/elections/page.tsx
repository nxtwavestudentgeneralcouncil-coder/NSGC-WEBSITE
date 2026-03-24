'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassModal } from '@/components/ui/glass-modal';
import { Vote, CheckCircle, Shield, Clock, Users, ArrowRight, User, Info } from 'lucide-react';
import { useSharedData, Election } from '@/hooks/useSharedData';
function getRemainingTime(election: Election) {
    const now = new Date();
    let targetDate: Date;

    if (election.status === 'Upcoming') {
        const start = election.startDate || election.date;
        if (!start) return 'TBD';
        targetDate = new Date(`${start}T${election.startTime || '00:00'}`);
    } else if (election.status === 'Ongoing') {
        const end = election.endDate || election.date;
        if (!end) return 'TBD';
        targetDate = new Date(`${end}T${election.endTime || '23:59'}`);
    } else {
        return 'ENDED';
    }

    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return election.status === 'Upcoming' ? 'STARTING...' : 'ENDING...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 48) {
        return `${Math.floor(hours / 24)} DAYS`;
    }
    
    return `${hours}H ${minutes}M`;
}

export default function ElectionsPage() {
    const { elections, setElections, refetchElections } = useSharedData();
    const [userVotes, setUserVotes] = useState<string[]>([]);
    const [selectedElection, setSelectedElection] = useState<Election | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        const savedVotes = localStorage.getItem('nsgc_user_votes');
        if (savedVotes) {
            try {
                setUserVotes(JSON.parse(savedVotes));
            } catch (e) {
                console.error("Failed to parse saved votes", e);
            }
        }
    }, []);

    const handleVote = async () => {
        if (!selectedElection || !selectedCandidate || isVoting) return;

        setIsVoting(true);
        try {
            const res = await fetch('/api/v1/nhost/cast-vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId: selectedCandidate })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to cast vote');
            }

            // Save user vote locally
            const newVotes = [...userVotes, selectedElection.id];
            setUserVotes(newVotes);
            localStorage.setItem('nsgc_user_votes', JSON.stringify(newVotes));

            // Refetch data to get updated counts
            await refetchElections();

            setSelectedElection(null);
            setSelectedCandidate(null);
        } catch (err) {
            console.error("Voting error:", err);
            alert("Failed to cast vote. Please try again.");
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4"
                    >
                        Student Elections
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Democracy in action. Choose your leaders for the next academic year.
                    </motion.p>
                </div>

                {/* Elections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {elections.map((election, index) => {
                        const hasVoted = userVotes.includes(election.id);
                        const isOngoing = election.status === 'Ongoing';

                        return (
                            <motion.div
                                key={election.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="bg-[#0B1224]/80 border-white/5 backdrop-blur-md overflow-hidden group hover:border-cyan-500/20 transition-all duration-500 h-full flex flex-col">
                                    <CardContent className="p-8 space-y-8 flex-grow flex flex-col">
                                        {/* Top Meta */}
                                        <div className="flex justify-between items-center">
                                            <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-2.5 py-1 text-[10px] font-bold tracking-widest rounded-md uppercase">
                                                {election.title}
                                            </Badge>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    election.status === 'Ongoing' ? 'bg-red-500 animate-pulse' : 
                                                    election.status === 'Upcoming' ? 'bg-cyan-500' : 'bg-slate-500'
                                                }`} />
                                                <span className={`text-[10px] font-bold tracking-widest uppercase ${
                                                    election.status === 'Ongoing' ? 'text-red-500/80 animate-pulse' : 
                                                    election.status === 'Upcoming' ? 'text-cyan-500/80' : 'text-slate-500/80'
                                                }`}>
                                                    {election.status === 'Ongoing' ? 'LIVE' : 
                                                     election.status === 'Upcoming' ? 'UPCOMING' : 'ENDED'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-bold text-white leading-tight group-hover:text-cyan-400 transition-colors">
                                            {election.title}
                                        </h3>

                                        {/* Candidates Preview */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">LEAD CANDIDATES</h4>
                                            <div className="flex -space-x-4 overflow-hidden">
                                                {election.candidates.map((candidate, i) => (
                                                    <div 
                                                        key={candidate.id || `preview-${i}`} 
                                                        className="inline-block h-10 w-10 rounded-full ring-2 ring-[#0B1224] bg-slate-800 overflow-hidden relative"
                                                        style={{ zIndex: 10 - i }}
                                                    >
                                                        {candidate.image ? (
                                                            <img src={candidate.image} alt={candidate.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-slate-700">
                                                                <User className="w-5 h-5 text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {election.candidates.length > 3 && (
                                                    <div className="inline-block h-10 w-10 flex items-center justify-center rounded-full ring-2 ring-[#0B1224] bg-slate-800 text-[10px] font-bold text-white" style={{ zIndex: 1 }}>
                                                        +{election.candidates.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Voting Progress */}
                                        <div className="space-y-3 mt-auto pt-6">
                                            <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                                                <span className="text-slate-500">
                                                    {election.status === 'Upcoming' ? 'VOTING BEGINS IN' :
                                                     election.status === 'Ongoing' ? (hasVoted ? 'LIVE RESULTS' : 'VOTING ENDS IN') : 'ELECTION ENDED'}
                                                </span>
                                                <span className="text-cyan-400">
                                                    {hasVoted && election.status === 'Ongoing' ? (
                                                        (() => {
                                                            const totalVotes = election.candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
                                                            return `${totalVotes} VOTES CAST`;
                                                        })()
                                                    ) : (election.status === 'Completed' || election.status === 'Upcoming') ? '' : getRemainingTime(election)}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                {(() => {
                                                    const totalVotes = election.candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
                                                    const leadingCandidate = [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
                                                    const leadPercentage = totalVotes > 0 ? Math.round(((leadingCandidate?.votes || 0) / totalVotes) * 100) : 0;
                                                    
                                                    return (
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${leadPercentage || 10}%` }}
                                                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                            {(hasVoted && election.status === 'Ongoing') && (
                                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                                                    <span>LEAD PERFORMANCE</span>
                                                    <span className="text-cyan-500/80">
                                                        {(() => {
                                                            const totalVotes = election.candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
                                                            const leadingCandidate = [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
                                                            const leadPercentage = totalVotes > 0 ? Math.round(((leadingCandidate?.votes || 0) / totalVotes) * 100) : 0;
                                                            return `${leadPercentage}% STAKE`;
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <Button 
                                            onClick={() => {
                                                if (election.status !== 'Completed') {
                                                    setSelectedElection(election);
                                                }
                                            }}
                                            disabled={election.status === 'Completed' && !hasVoted}
                                            className={`w-full font-bold h-12 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 group/btn ${
                                                election.status === 'Completed'
                                                ? hasVoted 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                                                    : 'bg-black text-slate-600 border border-white/5 opacity-50 cursor-not-allowed'
                                                : hasVoted 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                                : election.status === 'Upcoming'
                                                ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500/20'
                                                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                            }`}
                                        >
                                            {election.status === 'Completed' ? (
                                                hasVoted ? (
                                                    <><CheckCircle className="w-4 h-4" /> VOTED</>
                                                ) : (
                                                    <><Vote className="w-4 h-4" /> VOTE</>
                                                )
                                            ) : hasVoted ? (
                                                <><CheckCircle className="w-4 h-4" /> VOTED</>
                                            ) : election.status === 'Upcoming' ? (
                                                <><Info className="w-4 h-4" /> VIEW DETAILS</>
                                            ) : (
                                                <><Vote className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> VOTE NOW</>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Secure Voting Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
                    <Card className="bg-[#0B1224]/40 border-dashed border-white/5 backdrop-blur-md relative overflow-hidden group">
                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Shield className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">Secure Digital Voting</h3>
                                    <p className="text-slate-400 text-sm max-w-xl">
                                        All votes are anonymous and end-to-end encrypted for a fair election process.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">DESIGNED BY</p>
                                <p className="text-xl font-black text-white italic tracking-tighter">V_MACH</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Voting Modal */}
                <GlassModal
                    isOpen={!!selectedElection}
                    onClose={() => { setSelectedElection(null); setSelectedCandidate(null); }}
                    title={selectedElection?.status === 'Ongoing' && !userVotes.includes(selectedElection?.id || '') ? `Cast Your Vote: ${selectedElection?.title}` : selectedElection?.title || 'Election Details'}
                    footer={
                        <div className="flex gap-4 w-full justify-end">
                            <Button variant="outline" onClick={() => { setSelectedElection(null); setSelectedCandidate(null); }} className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-11 px-6">Close</Button>
                            {selectedElection?.status === 'Ongoing' && !userVotes.includes(selectedElection.id) && (
                                <Button
                                    onClick={handleVote}
                                    disabled={!selectedCandidate || isVoting}
                                    className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-11 px-8 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isVoting ? (
                                        <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" /> VOTING...</>
                                    ) : (
                                        <><Vote className="w-4 h-4 mr-2" /> CONFIRM VOTE</>
                                    )}
                                </Button>
                            )}
                        </div>
                    }
                >
                    <div className="space-y-6">
                        {selectedElection?.status === 'Ongoing' && !userVotes.includes(selectedElection.id) ? (
                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-3">
                                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-cyan-400/80 text-sm leading-relaxed">
                                    Your choice is confidential. Select a candidate and confirm your vote. This action is final and cannot be undone.
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">
                                {selectedElection?.status === 'Upcoming' 
                                    ? "Voting hasn't started yet. View candidate profiles below." 
                                    : userVotes.includes(selectedElection?.id || '') 
                                        ? "You have already cast your vote. Review the live results below."
                                        : "Election cycle concluded. Review the results below."}
                            </p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedElection?.candidates && selectedElection.candidates.length > 0 ? (
                                selectedElection?.candidates.map((candidate, idx) => {
                                    const totalVotes = selectedElection.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
                                    const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
                                    const showResults = userVotes.includes(selectedElection.id) || selectedElection.status === 'Completed';
                                    const canVote = selectedElection.status === 'Ongoing' && !userVotes.includes(selectedElection.id);
                                    const isSelected = selectedCandidate === candidate.id;

                                    return (
                                        <div
                                            key={candidate.id || `modal-${idx}`}
                                            onClick={() => { if (canVote) setSelectedCandidate(candidate.id); }}
                                            className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-all relative overflow-hidden group ${canVote ? 'cursor-pointer' : ''} ${isSelected
                                                ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                                                : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                                                }`}
                                        >
                                            <div className="mb-4 relative">
                                                <div className={`p-1 rounded-full border-2 transition-colors duration-500 ${isSelected ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-transparent'}`}>
                                                    {candidate.image ? (
                                                        <img src={candidate.image} alt={candidate.name} className="w-24 h-24 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                    ) : (
                                                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                                                            <User className="w-10 h-10 text-slate-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 bg-cyan-500 text-black rounded-full p-1.5 shadow-lg animate-in zoom-in-50 duration-300">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>

                                            <span className={`font-bold text-lg mb-1 transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>{candidate.name}</span>
                                            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-4">CANDIDATE ID: #{candidate.id.slice(0,4)}</span>

                                            {showResults && (
                                                <div className="w-full space-y-2 mt-2">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 tracking-wider">
                                                        <span>{candidate.votes || 0} TOTAL VOTES</span>
                                                        <span className="text-cyan-400">{percentage}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${isSelected ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-600'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 text-center p-12 text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                    <Info className="w-8 h-8 mx-auto mb-4 opacity-30 text-cyan-400" />
                                    <p className="text-sm font-medium">Detailed candidate analytics are being finalized. Check back soon.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassModal>

            </div>
        </div>
    );
}
