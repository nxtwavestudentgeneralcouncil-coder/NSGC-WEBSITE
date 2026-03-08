'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Megaphone, Calendar, Plus, Trash2, LogOut, Star, Flag, Users, Globe, Camera, TrendingUp, AlertTriangle, LayoutGrid, List, X, Upload, Eye, FileText
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useSharedData, Announcement, Event, ClubTeamMember, GalleryImage } from '@/hooks/useSharedData';

export default function ClubsDashboard() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // For demo purposes, we will bypass actual login and assume the user is a club lead
    // Let's pretend they are the lead of a specific club. We'll pick the first available club
    // or create a default context if none exist.
    const [currentClubName, setCurrentClubName] = useState('Tech Club');

    // --- State Management ---
    const {
        announcements, setAnnouncements,
        events, setEvents,
        clubs, setClubs,
        galleryImages, setGalleryImages,
        isLoaded
    } = useSharedData();

    // UI States
    const [activeTab, setActiveTab] = useState('events');

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalType, setAddModalType] = useState<'event' | 'announcement' | 'member' | 'gallery'>('event');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: string } | null>(null);

    // Form States
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Login Access Check
    useEffect(() => {
        const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        if (roles.includes('clubs')) {
            setIsAuthorized(true);
        } else if (roles.includes('president')) {
            router.push('/dashboard/president');
        } else if (roles.includes('admin')) {
            router.push('/dashboard/admin');
        } else if (roles.includes('student')) {
            router.push('/dashboard/student');
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (isLoaded && clubs.length > 0) {
            // We arbitrarily pick the first club to simulate being its lead.
            // In reality, this would come from the user's logged-in profile.
            setCurrentClubName(clubs[0].name);
        }
    }, [isLoaded, clubs]);

    // Filter data to only show items created by THIS club
    const clubEvents = events.filter(e => e.organizer === currentClubName || !e.organizer); // Fallback: show all if none have organizer for demo
    const clubAnnouncements = announcements.filter(a => a.author === currentClubName || !a.author);
    const clubGalleryImages = galleryImages.filter(img => img.addedByRole?.includes(currentClubName));

    // --- Helpers ---
    const openAddModal = (type: 'event' | 'announcement' | 'member' | 'gallery', data?: any) => {
        setAddModalType(type);
        setFormData(data || {}); // Reset form or load existing data
        setIsAddModalOpen(true);
    };

    const confirmDelete = (type: 'event' | 'announcement' | 'member' | 'gallery', id: string) => {
        setItemToDelete({ type, id });
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (!itemToDelete) return;

        const { type, id } = itemToDelete;
        switch (type) {
            case 'event': setEvents(prev => prev.filter(i => i.id !== id)); break;
            case 'announcement': setAnnouncements(prev => prev.filter(i => i.id !== id)); break;
            case 'member':
                setClubs(prev => prev.map(club => {
                    if (club.name === currentClubName) {
                        return { ...club, teamMembers: (club.teamMembers || []).filter(m => m.id !== id) };
                    }
                    return club;
                }));
                break;
            case 'gallery': setGalleryImages(prev => prev.filter(i => i.id !== id)); break;
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!formData.id;
        const itemId = isEditing ? formData.id : Math.random().toString(36).slice(2, 11);
        const newData = { ...formData, id: itemId };

        // Helper to update or add
        const updateState = (prev: any[], newItem: any) => {
            if (isEditing) {
                return prev.map(item => item.id === itemId ? { ...item, ...newItem } : item);
            }
            return [newItem, ...prev]; // Add to top
        };

        switch (addModalType) {
            case 'event':
                setEvents(prev => updateState(prev, {
                    ...newData,
                    organizer: currentClubName, // Stamp the event with this club's name
                    addedByRole: 'Club Manager',
                    type: (newData as Event).type || 'Social', // Default type
                }));
                break;
            case 'announcement':
                setAnnouncements(prev => updateState(prev, {
                    ...newData,
                    date: (newData as Announcement).date || new Date().toISOString().split('T')[0],
                    author: currentClubName, // Stamp the announcement with this club's name
                    addedByRole: 'Club Manager',
                    priority: (newData as Announcement).priority || 'Low',
                    category: (newData as Announcement).category || 'General'
                }));
                break;
            case 'member':
                setClubs(prev => {
                    const clubExists = prev.find(c => c.name === currentClubName);
                    if (clubExists) {
                        return prev.map(club => {
                            if (club.name === currentClubName) {
                                const existingTeam = club.teamMembers || [];
                                let newTeam;
                                if (isEditing) {
                                    newTeam = existingTeam.map(m => m.id === itemId ? { ...m, ...newData as any } : m);
                                } else {
                                    newTeam = [{ ...newData as any }, ...existingTeam];
                                }
                                return { ...club, teamMembers: newTeam };
                            }
                            return club;
                        });
                    } else {
                        // Create shell club if it does not exist
                        return [
                            ...prev,
                            {
                                id: Math.random().toString(36).slice(2, 11),
                                name: currentClubName,
                                description: 'Newly registered club.',
                                lead: 'Club Lead',
                                members: 1,
                                teamMembers: [{ ...newData as any }]
                            }
                        ];
                    }
                });
                break;
            case 'gallery':
                if (!formData.src) {
                    alert("Please upload an image before saving.");
                    return;
                }
                setGalleryImages(prev => updateState(prev, {
                    ...newData,
                    src: formData.src,
                    span: formData.span || 'col-span-1 row-span-1',
                    addedByRole: `Club Manager (${currentClubName})`,
                    dateAdded: formData.dateAdded || new Date().toISOString().split('T')[0]
                }));
                break;
        }
        setIsAddModalOpen(false);
    };

    if (!isAuthorized || !isLoaded) {
        return <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>;
    }

    const currentClubDetails = clubs.find(c => c.name === currentClubName);

    return (
        <div className="min-h-screen bg-[#0B1120] text-white pt-24 md:pt-10 pb-20 font-sans">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-[40px] font-extrabold tracking-widest uppercase leading-none font-mono">
                                <span className="text-white">Club</span> <span className="text-[#0ea5e9]">Manager</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-[#64748B] text-[10px] tracking-[0.2em] font-mono uppercase">System.Access.Level_03</p>
                            <Badge variant="outline" className="border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981] rounded-full px-3 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Encrypted Connection
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Incomplete Profile Alert */}
                {!currentClubDetails && (
                    <div className="mb-8 p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-[#00E5FF]/10 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF]">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors">Club Profile Incomplete</h3>
                                <p className="text-[11px] text-slate-400">Complete your club's profile verification to unlock all premium management features.</p>
                            </div>
                        </div>
                        <Button className="bg-[#00E5FF]/10 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold text-xs h-9 px-6 rounded-md transition-all">
                            Complete Now
                        </Button>
                    </div>
                )}

                {/* Dashboard Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-[#0F172A] border-white/5 relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all duration-300">
                        <CardContent className="p-8 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-500 mb-2">Club Members</p>
                                <h3 className="text-4xl font-bold tracking-tight text-white mb-1">
                                    {currentClubDetails?.members || "1,240"}
                                </h3>
                                <p className="text-[10px] text-[#00E5FF] flex items-center gap-1 font-medium">
                                    <TrendingUp className="w-3 h-3" /> +12% from last month
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-7 h-7" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#0F172A] border-white/5 relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all duration-300">
                        <CardContent className="p-8 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-500 mb-2">Active Events</p>
                                <h3 className="text-4xl font-bold tracking-tight text-white mb-1">
                                    {clubEvents.length || "8"}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">Currently ongoing</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform duration-500">
                                <Calendar className="w-7 h-7" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#0F172A] border-white/5 relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all duration-300">
                        <CardContent className="p-8 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-500 mb-2">Announcements</p>
                                <h3 className="text-4xl font-bold tracking-tight text-white mb-1">
                                    {clubAnnouncements.length || "12"}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">Active broadcasts</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform duration-500">
                                <Megaphone className="w-7 h-7" />
                            </div>
                        </CardContent>
                    </Card>
                </div>




                {/* Tabs */}
                <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-between items-center border-b border-white/5 mb-8 overflow-x-auto">
                        <TabsList className="bg-transparent h-12 p-0 flex space-x-8 rounded-none border-0 min-w-max">
                            <TabsTrigger
                                value="events"
                                className="bg-transparent border-0 rounded-none h-12 px-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF] transition-all"
                            >
                                Manage Events
                            </TabsTrigger>
                            <TabsTrigger
                                value="announcements"
                                className="bg-transparent border-0 rounded-none h-12 px-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF] transition-all"
                            >
                                Broadcast
                            </TabsTrigger>
                            <TabsTrigger
                                value="team"
                                className="bg-transparent border-0 rounded-none h-12 px-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF] transition-all"
                            >
                                Manage Team
                            </TabsTrigger>
                            <TabsTrigger
                                value="gallery"
                                className="bg-transparent border-0 rounded-none h-12 px-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] data-[state=active]:text-[#00E5FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00E5FF] transition-all"
                            >
                                Gallery
                            </TabsTrigger>
                        </TabsList>

                        <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                            <span>View:</span>
                            <div className="flex gap-2">
                                <LayoutGrid className="w-4 h-4 text-[#00E5FF] cursor-pointer" />
                                <List className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>


                    {/* Events Content */}
                    <TabsContent value="events" className="mt-0 outline-none">
                        {clubEvents.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                                    <Button
                                        onClick={() => openAddModal('event')}
                                        className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md flex items-center gap-2 h-9 px-4"
                                    >
                                        <Plus className="w-4 h-4" /> CREATE EVENT
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {clubEvents.map((event) => (
                                        <Card key={event.id} className="bg-[#0F172A] border-white/5 group relative overflow-hidden flex flex-col h-full">
                                            {event.image && (
                                                <div className="h-40 w-full relative">
                                                    <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />
                                                </div>
                                            )}
                                            <CardContent className="p-6 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <Badge className="bg-[#00E5FF]/10 text-[#00E5FF] border-none mb-2">{event.type}</Badge>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openAddModal('event', event)} className="h-8 w-8 text-slate-400 hover:text-white">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => confirmDelete('event', event.id)} className="h-8 w-8 text-red-400 hover:bg-red-400/10">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Calendar className="w-3.5 h-3.5 text-[#00E5FF]" />
                                                            {event.date}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
                                                            {event.location}
                                                        </div>
                                                    </div>
                                                </div>
                                                {event.registrationLink && (
                                                    <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="mt-4">
                                                        <Button variant="outline" className="w-full border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/10 h-9">
                                                            Register Now
                                                        </Button>
                                                    </a>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0F172A]/50 border border-white/5 rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white mb-8 shadow-2xl">
                                    <Calendar className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Your Events</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                                    You haven't scheduled any events yet. Start organizing your first community meetup or club session today.
                                </p>
                                <Button
                                    onClick={() => openAddModal('event')}
                                    className="bg-transparent hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold h-12 px-8 rounded-xl transition-all flex items-center gap-2 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Create First Event
                                </Button>
                            </div>
                        )}
                    </TabsContent>


                    {/* Announcements Content */}
                    <TabsContent value="announcements" className="mt-0 outline-none">
                        {clubAnnouncements.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Latest Announcements</h2>
                                    <Button
                                        onClick={() => openAddModal('announcement')}
                                        className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md flex items-center gap-2 h-9 px-4"
                                    >
                                        <Plus className="w-4 h-4" /> NEW BROADCAST
                                    </Button>
                                </div>
                                <div className="grid gap-4">
                                    {clubAnnouncements.map((item) => (
                                        <Card key={item.id} className="bg-[#0F172A] border-white/5 hover:border-[#00E5FF]/30 transition-all duration-300">
                                            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="text-xl font-bold text-white">{item.title}</h3>
                                                        <Badge variant="outline" className={`${item.priority === 'High' ? 'text-red-400 border-red-400' : 'text-[#00E5FF] border-[#00E5FF]/30'} bg-white/5`}>
                                                            {item.priority || 'Low'}
                                                        </Badge>
                                                        <Badge className="bg-white/5 text-slate-400 border-white/10 font-mono text-[10px]">
                                                            {item.category || 'General'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{item.content}</p>
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                                            Posted: {item.date}
                                                        </p>
                                                        {item.link && (
                                                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00E5FF] hover:underline font-mono uppercase tracking-widest flex items-center gap-1">
                                                                <Globe className="w-3 h-3" /> External Link
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex md:flex-col gap-2 shrink-0">
                                                    <Button variant="outline" size="sm" onClick={() => openAddModal('announcement', item)} className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-9">
                                                        Edit
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete('announcement', item.id)} className="text-red-500 hover:bg-red-500/10 h-9 w-9">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0F172A]/50 border border-white/5 rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white mb-8 shadow-2xl">
                                    <Megaphone className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Broadcasting</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                                    Share important updates and reach your club members instantly through official broadcasts.
                                </p>
                                <Button
                                    onClick={() => openAddModal('announcement')}
                                    className="bg-transparent hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold h-12 px-8 rounded-xl transition-all flex items-center gap-2 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Create First Announcement
                                </Button>
                            </div>
                        )}
                    </TabsContent>


                    {/* Team Members Content */}
                    <TabsContent value="team" className="mt-0 outline-none">
                        {currentClubDetails?.teamMembers && currentClubDetails.teamMembers.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Core Team</h2>
                                    <Button
                                        onClick={() => openAddModal('member')}
                                        className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md flex items-center gap-2 h-9 px-4"
                                    >
                                        <Plus className="w-4 h-4" /> ADD MEMBER
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentClubDetails.teamMembers.map((member) => (
                                        <Card key={member.id} className="bg-[#0F172A] border-white/5 p-6 hover:border-[#00E5FF]/30 transition-all duration-300 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] overflow-hidden border border-[#00E5FF]/20 group-hover:scale-105 transition-transform duration-500">
                                                    {member.image ? (
                                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-8 h-8" />
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-white">{member.name}</h3>
                                                    <p className="text-xs text-[#00E5FF] font-mono tracking-wider uppercase mb-2">{member.role}</p>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openAddModal('member', member)} className="h-7 w-7 text-slate-400 hover:text-white">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => confirmDelete('member', member.id)} className="h-7 w-7 text-red-500/60 hover:text-red-400 hover:bg-red-400/10">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0F172A]/50 border border-white/5 rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white mb-8 shadow-2xl">
                                    <Users className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Club Team</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                                    Manage your club leads and team members. Assign roles and coordinate your club operations.
                                </p>
                                <Button
                                    onClick={() => openAddModal('member')}
                                    className="bg-transparent hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold h-12 px-8 rounded-xl transition-all flex items-center gap-2 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Add Team Member
                                </Button>
                            </div>
                        )}
                    </TabsContent>


                    {/* Gallery Content */}
                    <TabsContent value="gallery" className="mt-0 outline-none">
                        {clubGalleryImages.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Club Gallery</h2>
                                    <Button
                                        onClick={() => openAddModal('gallery')}
                                        className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md flex items-center gap-2 h-9 px-4"
                                    >
                                        <Plus className="w-4 h-4" /> ADD IMAGE
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {clubGalleryImages.map((img) => (
                                        <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-[#0F172A]">
                                            <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-xs font-bold text-white mb-2 line-clamp-1">{img.alt}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openAddModal('gallery', img)} className="h-8 w-8 text-white hover:bg-white/20">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete('gallery', img.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/20">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0F172A]/50 border border-white/5 rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white mb-8 shadow-2xl">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Gallery</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                                    Curate a collection of highlights and memories from your club's events and activities.
                                </p>
                                <Button
                                    onClick={() => openAddModal('gallery')}
                                    className="bg-transparent hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold h-12 px-8 rounded-xl transition-all flex items-center gap-2 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Add Image
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>



                {/* Combined Add/Edit Modal */}
                <AnimatePresence>
                    {isAddModalOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        {formData.id ? 'Edit' : 'Create'} {addModalType === 'event' ? 'Event' : addModalType === 'announcement' ? 'Announcement' : 'Member'}
                                    </h2>
                                    <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} className="rounded-full h-8 w-8 p-0">
                                        ✕
                                    </Button>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <form id="resource-form" onSubmit={handleSave} className="space-y-5">

                                        {/* Modals for Event */}
                                        {addModalType === 'event' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Event Title <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.name || ''}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="e.g. Annual Hackathon"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Date & Time <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="datetime-local"
                                                            value={formData.date || ''}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            required
                                                            className="bg-black/50 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Type Category</label>
                                                        <select
                                                            value={formData.type || 'Social'}
                                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="Academic">Academic</option>
                                                            <option value="Social">Social</option>
                                                            <option value="Sports">Sports</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Location <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.location || ''}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="e.g. Main Auditorium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Registration Link (Optional)</label>
                                                    <Input
                                                        value={formData.registrationLink || ''}
                                                        onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="https://forms.gle/..."
                                                    />
                                                </div>


                                            </>
                                        )}

                                        {/* Modals for Announcement */}
                                        {addModalType === 'announcement' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Title <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.title || ''}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="Brief title of your announcement"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Priority</label>
                                                        <select
                                                            value={formData.priority || 'Low'}
                                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="Low">Low</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="High">High</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Category</label>
                                                        <select
                                                            value={formData.category || 'Event'}
                                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="General">General</option>
                                                            <option value="Event">Event</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Details <span className="text-red-500">*</span></label>
                                                    <Textarea
                                                        value={formData.content || ''}
                                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10 min-h-[120px]"
                                                        placeholder="Provide the full details of this announcement..."
                                                    />
                                                </div>
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm font-medium text-gray-300">External Link (Optional)</label>
                                                    <Input
                                                        value={formData.link || ''}
                                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                        className="bg-black/50 border-white/10"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Modals for Team Member */}
                                        {addModalType === 'member' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.name || ''}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="e.g. Jane Doe"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Role <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.role || ''}
                                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="e.g. Vice President, Event Coordinator"
                                                    />
                                                </div>
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm font-medium text-gray-300">Profile Image URL (Optional)</label>
                                                    <Input
                                                        value={formData.image || ''}
                                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="https://example.com/avatar.jpg"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Modals for Gallery Image */}
                                        {addModalType === 'gallery' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Image Title / Description <span className="text-red-500">*</span></label>
                                                    <Input required value={formData.alt || ''} onChange={e => setFormData({ ...formData, alt: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-teal-500" placeholder="e.g. Club Meeting" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Grid Width (Columns)</label>
                                                        <select
                                                            value={formData.span ? formData.span.split(' ')[0] : 'col-span-1'}
                                                            onChange={(e) => {
                                                                const currentSpan = formData.span || 'col-span-1 row-span-1';
                                                                const newSpan = `${e.target.value} ${currentSpan.split(' ')[1]}`;
                                                                setFormData({ ...formData, span: newSpan });
                                                            }}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="col-span-1">1 Column</option>
                                                            <option value="col-span-2">2 Columns</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Grid Height (Rows)</label>
                                                        <select
                                                            value={formData.span ? formData.span.split(' ')[1] : 'row-span-1'}
                                                            onChange={(e) => {
                                                                const currentSpan = formData.span || 'col-span-1 row-span-1';
                                                                const newSpan = `${currentSpan.split(' ')[0]} ${e.target.value}`;
                                                                setFormData({ ...formData, span: newSpan });
                                                            }}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="row-span-1">1 Row</option>
                                                            <option value="row-span-2">2 Rows</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <label className="text-sm font-medium text-gray-300">Image Upload (Max 1MB) <span className="text-red-500">*</span></label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        required
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 1048576) {
                                                                    alert("File size exceeds 1MB. Please upload a smaller image.");
                                                                    e.target.value = '';
                                                                    return;
                                                                }
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setFormData({ ...formData, src: reader.result as string });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        className="bg-black/50 border-white/10 text-white focus:border-teal-500 file:bg-teal-500 file:text-black file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 file:text-sm file:font-semibold hover:file:bg-teal-400"
                                                    />
                                                    {formData.src && (
                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                            <p className="text-sm text-gray-400 mb-2">Preview:</p>
                                                            <img src={formData.src} alt="Preview" className="w-full h-48 object-cover rounded-md border border-white/10" />
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </form>
                                </div>

                                <div className="p-4 border-t border-white/10 bg-black/50 flex justify-end gap-3">
                                    <Button type="button" variant="outline" className="border-white/20 hover:bg-white/5" onClick={() => setIsAddModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" form="resource-form" className="bg-teal-600 hover:bg-teal-500 text-white font-medium min-w-[100px]">
                                        {formData.id ? 'Save Changes' : 'Publish'}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-gray-900 border border-red-500/50 rounded-xl p-6 max-w-sm w-full shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                                <p className="text-gray-400 mb-6 text-sm">
                                    Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300" onClick={() => setIsDeleteModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" onClick={executeDelete}>
                                        Yes, Delete
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
