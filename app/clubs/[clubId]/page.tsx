'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Calendar, Users, Mail, Globe, ExternalLink } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useSharedData } from '@/hooks/useSharedData';
import Link from 'next/link';

export default function ClubProfilePage() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.clubId as string;

    const { clubs, isLoaded } = useSharedData();
    
    const club = clubs.find(c => c.id === clubId);
    const loading = !isLoaded;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030616] text-white flex items-center justify-center pt-24 pb-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-[#030616] text-white flex flex-col items-center justify-center pt-24 pb-20">
                <h1 className="text-4xl font-bold mb-4">Club Not Found</h1>
                <p className="text-slate-400 mb-8">The club you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => router.push('/clubs')} variant="outline" className="border-white/10 hover:bg-white/5">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clubs
                </Button>
            </div>
        );
    }

    // Since useSharedData's Club type is slightly different, we map or use what we have
    // Note: members count is already in the mapped Club type
    const membersCount = (club as any).members || 0;

    return (
        <div className="min-h-screen bg-[#030616] text-white pt-24 pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Back Button */}
                <button 
                    onClick={() => router.push('/clubs')}
                    className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 mb-8 transition-colors text-sm font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                    Back to All Clubs
                </button>

                {/* Header Section */}
                <div className="relative">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl -z-10 rounded-[3rem]" />
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-[#0B1224]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                        {club.image ? (
                            <img src={club.image} alt={club.name} className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-white/10 shrink-0 shadow-2xl" />
                        ) : (
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center bg-white/5 border-2 border-white/10 shrink-0 shadow-2xl">
                                <Users className="w-16 h-16 text-slate-500" />
                            </div>
                        )}

                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                                {club.category && (
                                    <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full">
                                        {club.category}
                                    </Badge>
                                )}
                                <span className="text-slate-500 text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4" /> {membersCount} Members
                                </span>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                                {club.name}
                            </h1>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                {club.lead && (
                                    <div className="flex items-center gap-2 bg-[#030616] px-3 py-1.5 rounded-full border border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                                            {club.lead.charAt(0) || 'L'}
                                        </div>
                                        <span>Led by <span className="text-slate-200 font-medium">{club.lead}</span></span>
                                    </div>
                                )}
                                {(club as any).club_email && (
                                    <a href={`mailto:${(club as any).club_email}`} className="flex items-center gap-2 bg-[#030616] px-3 py-1.5 rounded-full border border-white/5 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                        <span>{(club as any).club_email}</span>
                                    </a>
                                )}
                                {club.website && (
                                    <a href={club.website.startsWith('http') ? club.website : `https://${club.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#030616] px-3 py-1.5 rounded-full border border-white/5 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors">
                                        <Globe className="w-4 h-4" />
                                        <span>Website</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 w-full md:w-auto mt-4 md:mt-0">
                            <Button className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all">
                                Join Club
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Left Column (About & Members) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About Section */}
                        <Card className="bg-[#0B1224]/80 border-white/5 backdrop-blur-md">
                            <CardContent className="p-8">
                                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {club.description || 'No description provided.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Recent Events Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white px-2">Upcoming Events</h2>
                            {club.club_events?.length === 0 ? (
                                <Card className="bg-[#0B1224]/50 border-white/5 border-dashed">
                                    <CardContent className="p-8 text-center">
                                        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">No upcoming events right now.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {club.club_events?.map((event: any) => (
                                        <Card key={event.id} className="bg-[#0B1224]/80 border-white/5 hover:border-white/10 transition-colors group">
                                            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                {event.image_url ? (
                                                    <img src={event.image_url} alt={event.title} className="w-24 h-24 rounded-xl object-cover border border-white/10 shrink-0" />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-2xl font-black">{new Date(event.event_date).getDate()}</span>
                                                        <span className="text-xs font-bold uppercase tracking-widest">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex-grow">
                                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                                                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mb-3">
                                                        {event.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Button variant="outline" className="w-full md:w-auto shrink-0 border-white/10 hover:bg-white/5 text-white">
                                                    Details <ExternalLink className="w-3 h-3 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-8">
                        <Card className="bg-[#0B1224]/80 border-white/5 backdrop-blur-md">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-400" />
                                    Leadership
                                </h3>
                                
                                {club.lead ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-white/10">
                                                {club.lead.charAt(0) || 'L'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{club.lead}</p>
                                                <p className="text-xs text-cyan-400 font-medium">Club Lead</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No listed leadership.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
