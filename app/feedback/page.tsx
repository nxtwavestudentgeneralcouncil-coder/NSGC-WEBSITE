'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, MessageSquareText, Vote, ArrowRight, CheckCircle2, Circle, Clock, Info, FileText, Utensils, GraduationCap, Dumbbell } from 'lucide-react';
import { useSharedData } from '@/hooks/useSharedData';

export default function FeedbackPage() {
    const { polls, setPolls, surveys } = useSharedData();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleVote = (pollId: string, optionId: string) => {
        setPolls(currentPolls =>
            currentPolls.map(poll => {
                if (poll.id === pollId) {
                    const updatedOptions = poll.options.map(opt =>
                        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                    );
                    return { ...poll, options: updatedOptions, totalVotes: poll.totalVotes + 1, userVoted: true, userChoice: optionId };
                }
                return poll;
            })
        );
    };

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold tracking-tight text-white"
                    >
                        Your Voice Matters
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Participate in polls and surveys to shape the campus experience.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Active Polls Section */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-widest text-slate-200 flex items-center gap-2">
                                <span className="w-1 h-4 bg-cyan-500 rounded-full" />
                                ACTIVE POLLS
                            </h2>
                        </div>

                        <div className="space-y-8">
                            {polls.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                    <p className="text-slate-400">No active polls at the moment.</p>
                                </div>
                            ) : (
                                polls.map((poll, index) => (
                                    <motion.div
                                        key={poll.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + (index * 0.1) }}
                                    >
                                        <Card className="bg-[#0B1224] border-white/5 overflow-hidden group">
                                            <CardContent className="p-8 space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-xl font-bold text-white leading-snug max-w-[80%]">
                                                        {poll.question}
                                                    </h3>
                                                    <Badge className="bg-cyan-500/20 text-cyan-400 border-none px-2 py-0.5 text-[10px] font-bold tracking-wider rounded">
                                                        {poll.status?.toUpperCase() || 'UNKNOWN'}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    {poll.options.map((option) => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleVote(poll.id, option.id)}
                                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group/opt ${
                                                                poll.userChoice === option.id 
                                                                ? 'bg-cyan-500/5 border-cyan-500/40' 
                                                                : 'bg-black/20 border-white/5 hover:border-white/10'
                                                            }`}
                                                        >
                                                            <span className={`text-sm font-medium ${poll.userChoice === option.id ? 'text-cyan-400' : 'text-slate-300 group-hover/opt:text-white'}`}>
                                                                {option.text}
                                                            </span>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                poll.userChoice === option.id ? 'border-cyan-500 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'border-white/10'
                                                            }`}>
                                                                {poll.userChoice === option.id && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="pt-4 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                                                    {poll.dueDate ? `POLL ENDS: ${poll.dueDate}` : 'NO DUE DATE'} • {poll.totalVotes} VOTES CAST
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Feedback Forms Section */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <MessageSquareText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-widest text-slate-200 flex items-center gap-2">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                                FEEDBACK FORMS
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {surveys.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                    <p className="text-slate-400">No active feedback forms at the moment.</p>
                                </div>
                            ) : (
                                surveys.map((survey, index) => (
                                    <motion.div
                                        key={survey.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (index * 0.1) }}
                                    >
                                        <Card className="bg-[#0B1224] border-white/5 hover:border-cyan-500/20 transition-all group/card">
                                            <CardContent className="p-6">
                                                <div className="flex gap-6">
                                                    <div className="w-14 h-14 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform">
                                                        <FileText className="w-6 h-6 text-cyan-400" />
                                                    </div>
                                                    <div className="flex-grow space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-base font-bold text-white group-hover/card:text-cyan-400 transition-colors">
                                                                {survey.title}
                                                            </h3>
                                                            <span className="text-[10px] font-mono text-slate-500 tracking-tighter">{survey.time}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 leading-relaxed">
                                                            {survey.description}
                                                        </p>
                                                        <div className="flex items-center gap-4 pt-2">
                                                            <Badge className="bg-slate-800 text-slate-400 border-none px-2 py-0.5 text-[10px] font-bold tracking-wider rounded h-5">
                                                                {survey.status?.toUpperCase() || 'UNKNOWN'}
                                                            </Badge>
                                                            {survey.link && (
                                                                <button 
                                                                    onClick={() => window.open(survey.link, '_blank')}
                                                                    className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold tracking-widest hover:text-cyan-300 transition-colors uppercase"
                                                                >
                                                                    Start Survey <ArrowRight className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
