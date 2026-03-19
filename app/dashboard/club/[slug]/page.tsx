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
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useSharedData, Announcement, Event, ClubTeamMember, GalleryImage } from '@/hooks/useSharedData';
import { useQuery } from '@apollo/client';
import { useClubData } from '@/hooks/useClubData';
import { use } from 'react';

export default function ClubDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // --- State Management ---
    const {
        events,
        announcements,
        galleryImages,
        users,
        refetchAnnouncements,
        refetchEvents,
        refetchGalleryImages
    } = useSharedData();

    const { 
        myClubByEmail, 
        myClubByEmailLoading, 
        allClubs,
        isLoaded: clubDataLoaded,
        refetchMyClubByEmail,
        GET_CLUB_BY_SLUG,
        UPDATE_CLUB_PROFILE,
        INSERT_CLUB_EVENT,
        UPDATE_CLUB_EVENT,
        DELETE_CLUB_EVENT,
        INSERT_CLUB_MEMBER,
        UPDATE_CLUB_MEMBER_ROLE,
        DELETE_CLUB_MEMBER
    } = useClubData();

    // UI States
    const [activeTab, setActiveTab] = useState('events');

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalType, setAddModalType] = useState<'event' | 'announcement' | 'member' | 'gallery' | 'profile'>('event');
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: string, isClubEvent?: boolean } | null>(null);

    // Form States
    const [formData, setFormData] = useState<Record<string, any>>({});

    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();

    // Roles and Overrides
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRoles = (user as any)?.roles || [];
    const defaultRole = user?.defaultRole || '';
    const hasOverrideRole = userRoles.includes('admin') || userRoles.includes('developer') || defaultRole === 'admin' || defaultRole === 'developer';

    // Helper to find club by slug in administrative list
    const clubBySlug = allClubs.find(c => c.slug === resolvedParams.slug);

    // Login Access Check
    useEffect(() => {
        if (!isLoading && clubDataLoaded) {
            if (!isAuthenticated || !user) {
                router.push('/login');
                return;
            }

            if (hasOverrideRole) {
                if (!clubBySlug) {
                    router.push('/dashboard/student');
                    return;
                }
                setIsAuthorized(true);
            } else {
                if (!myClubByEmailLoading) {
                    if (!myClubByEmail || myClubByEmail.slug !== resolvedParams.slug) {
                        router.push('/dashboard/student'); // Redirect to generic dashboard
                        return;
                    }
                    setIsAuthorized(true);
                }
            }
        }
    }, [isAuthenticated, isLoading, user, router, myClubByEmailLoading, myClubByEmail, resolvedParams.slug, hasOverrideRole, clubBySlug, clubDataLoaded]);

    const activeClub = hasOverrideRole ? clubBySlug : myClubByEmail;
    const currentClubId = activeClub?.id;
    const currentClubName = activeClub?.name || 'Club';

    // Map new Nhost data to expected legacy UI format
    const currentClubDetails = activeClub ? {
        id: activeClub.id,
        name: activeClub.name,
        description: activeClub.description,
        image: activeClub.logo_url,
        website: '', // contact_email was dropped
        lead: activeClub.club_members?.find((m: any) => m.role === 'manager')?.user?.displayName || 'Club Manager',
        members: activeClub.club_members?.length || 0,
        teamMembers: activeClub.club_members?.map((m: any) => ({
            id: m.id, // club_member id
            name: m.user?.displayName || m.user?.email || 'Unknown',
            role: m.role,
            avatar: m.user?.avatarUrl
        })) || []
    } : null;

    const clubEvents = events.filter(e => {
        const isClubIdMatch = e.club_id === activeClub?.id;
        const isSlugMatch = e.club_slug === resolvedParams.slug;
        const roleMatch = e.addedByRole?.toLowerCase().includes(currentClubName.toLowerCase());
        return isClubIdMatch || isSlugMatch || roleMatch;
    });

    const clubAnnouncements = announcements.filter(a => a.author === currentClubName || a.addedByRole?.includes(currentClubName));
    const clubGalleryImages = galleryImages.filter(img => img.addedByRole?.includes(currentClubName));

    // --- Helpers ---
    const openAddModal = (type: 'event' | 'announcement' | 'member' | 'gallery' | 'profile', data?: any) => {
        setAddModalType(type);
        // Reverse map legacy data to form data
        let initialData = { ...data };
        if (type === 'event' && data) {
            initialData = {
                id: data.id,
                name: data.name,
                description: data.description,
                date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
                location: data.location,
                type: data.type,
                registrationLink: data.registrationLink,
                is_club_event: data.is_club_event
            };
        } else if (type === 'profile' && data) {
            initialData = {
                id: data.id,
                name: data.name,
                description: data.description,
                logo_url: data.image
            };
        }
        setFormData(initialData || {});
        setIsAddModalOpen(true);
    };

    const confirmDelete = (type: 'event' | 'announcement' | 'member' | 'gallery', id: string, isClubEvent?: boolean) => {
        setItemToDelete({ type, id, isClubEvent });
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        
        try {
            let res: Response | undefined;
            switch (type) {
                case 'event': 
                    res = await fetch('/api/v1/nhost/delete-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, is_club_event: itemToDelete.isClubEvent ?? true })
                    });
                    if (res.ok) {
                        refetchEvents();
                        refetchMyClubByEmail();
                    }
                    break;
                case 'announcement': 
                    res = await fetch('/api/v1/nhost/delete-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    if (res.ok) refetchAnnouncements();
                    break;
                case 'member':
                    res = await fetch('/api/v1/nhost/delete-club-member', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    if (res.ok) refetchMyClubByEmail();
                    break;
                case 'gallery': 
                    res = await fetch('/api/v1/nhost/delete-gallery-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    if (res.ok) refetchGalleryImages();
                    break;
            }
            
            if (res && !res.ok) {
                const errData = await res.json().catch(() => ({ message: 'Delete failed' }));
                throw new Error(errData.message || 'Delete failed');
            }
        } catch (e: any) {
            console.error("Error deleting:", e);
            alert(`Failed to delete: ${e.message}`);
        }
        
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!formData.id;

        try {
            switch (addModalType) {
                case 'event':
                    // Safe date parsing
                    let finalDateStr = formData.event_date || new Date().toISOString();
                    if (formData.date) {
                        const parsed = new Date(formData.date);
                        if (!isNaN(parsed.getTime())) {
                            finalDateStr = parsed.toISOString();
                        }
                    }

                    if (isEditing) {
                        const res = await fetch('/api/v1/nhost/update-event', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: formData.id,
                                title: formData.name || formData.title,
                                description: formData.description || '',
                                event_date: finalDateStr,
                                venue: formData.location || formData.venue || 'TBA',
                                registration_link: formData.registrationLink || '',
                                added_by_role: `[${formData.type || 'Social'}] Club Manager (${currentClubName})`,
                                is_club_event: formData.is_club_event ?? true,
                                type: formData.type || 'Social'
                            })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Update failed' }));
                            throw new Error(err.message || 'Update failed');
                        }
                    } else {
                        const res = await fetch('/api/v1/nhost/insert-event', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: formData.name || formData.title || 'New Event',
                                description: formData.description || '',
                                event_date: finalDateStr,
                                venue: formData.location || formData.venue || 'TBA',
                                registration_link: formData.registrationLink || '',
                                organizer_type: 'club',
                                type: formData.type || 'Social',
                                club_id: activeClub?.id,
                                added_by_role: `[${formData.type || 'Social'}] Club Manager (${currentClubName})`
                            })
                        });
                        
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Creation failed' }));
                            throw new Error(err.message || 'Creation failed');
                        }
                    }
                    refetchEvents();
                    refetchMyClubByEmail();
                    break;
                case 'announcement':
                    if (isEditing) {
                        const res = await fetch('/api/v1/nhost/update-announcement', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: formData.id,
                                title: formData.title,
                                content: formData.content,
                                category: formData.category || 'General',
                                priority: formData.priority || 'Low',
                                link: formData.link || null,
                                added_by_role: `Club Manager (${currentClubName})`
                            })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Update failed' }));
                            throw new Error(err.message || 'Update failed');
                        }
                    } else {
                        const res = await fetch('/api/v1/nhost/insert-announcement', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: formData.title,
                                content: formData.content,
                                category: formData.category || 'General',
                                priority: formData.priority || 'Low',
                                link: formData.link || null,
                                added_by_role: `Club Manager (${currentClubName})`
                            })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Creation failed' }));
                            throw new Error(err.message || 'Creation failed');
                        }
                    }
                    refetchAnnouncements();
                    break;
                case 'member':
                    if (isEditing) {
                        const res = await fetch('/api/v1/nhost/update-club-member', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: formData.id, role: formData.role || 'member' })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Update failed' }));
                            throw new Error(err.message || 'Update failed');
                        }
                    } else {
                        const res = await fetch('/api/v1/nhost/insert-club-member', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ club_id: currentClubId, user_id: formData.user_id, role: formData.role || 'member' })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Creation failed' }));
                            throw new Error(err.message || 'Creation failed');
                        }
                    }
                    refetchMyClubByEmail();
                    break;
                case 'gallery':
                    if (!formData.src) return alert("Please upload an image before saving.");
                    if (!isEditing) {
                        const res = await fetch('/api/v1/nhost/insert-gallery-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                src: formData.src,
                                alt: formData.alt || `Club Manager (${currentClubName})`,
                                span: formData.span || 'col-span-1 row-span-1',
                                added_by_role: `Club Manager (${currentClubName})`
                            })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Upload failed' }));
                            throw new Error(err.message || 'Upload failed');
                        }
                    }
                    refetchGalleryImages();
                    break;
                case 'profile':
                    if (isEditing) {
                        const res = await fetch('/api/v1/nhost/update-club', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                id: formData.id, 
                                name: formData.name, 
                                description: formData.description, 
                                logo_url: formData.logo_url || formData.image 
                            })
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Update failed' }));
                            throw new Error(err.message || 'Update failed');
                        }
                        refetchMyClubByEmail();
                    }
                    break;
            }
            setIsAddModalOpen(false);
            setFormData({});
        } catch (e: any) {
            console.error("Save error:", e);
            alert(`Error saving: ${e.message}`);
        }
    };

    if (!isAuthorized || isLoading || (!hasOverrideRole && myClubByEmailLoading) || (hasOverrideRole && !clubDataLoaded)) {
        return <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-white pt-24 md:pt-10 pb-20 font-sans">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        {currentClubDetails?.image && (
                            <img src={currentClubDetails.image} alt={currentClubDetails.name} className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-[40px] font-extrabold tracking-widest uppercase leading-none font-mono">
                                    <span className="text-white">{currentClubDetails?.name || currentClubName || "Club"}</span> <span className="text-[#0ea5e9]">Manager</span>
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <p className="text-[#64748B] text-[10px] tracking-[0.2em] font-mono uppercase">System.Access.Level_03</p>
                                <Badge variant="outline" className="border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981] rounded-full px-3 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Encrypted Connection
                                </Badge>
                                {currentClubDetails?.website && (
                                    <a href={currentClubDetails.website} target="_blank" rel="noopener noreferrer" className="text-[#00E5FF] text-[10px] tracking-[0.2em] font-mono uppercase hover:underline">
                                        Website
                                    </a>
                                )}
                            </div>
                            {currentClubDetails?.description && (
                                <p className="text-slate-400 text-sm mt-3 max-w-2xl leading-relaxed">
                                    {currentClubDetails.description}
                                </p>
                            )}
                            {currentClubDetails?.lead && (
                                <p className="text-slate-500 text-xs mt-1 font-medium">
                                    Led by: <span className="text-white">{currentClubDetails.lead}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    {currentClubDetails && (
                        <div className="flex shrink-0">
                            <Button variant="outline" onClick={() => openAddModal('profile', { ...currentClubDetails, originalName: currentClubDetails.name })} className="border-white/10 text-white hover:bg-white/5">
                                Edit Profile
                            </Button>
                        </div>
                    )}
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
                        <Button 
                            onClick={() => openAddModal('profile', { name: currentClubName, originalName: currentClubName })}
                            className="bg-[#00E5FF]/10 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-black border border-[#00E5FF]/30 font-bold text-xs h-9 px-6 rounded-md transition-all">
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
                                    {currentClubDetails?.members || "0"}
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
                                    {clubEvents.length || "0"}
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
                                    {clubAnnouncements.length || "0"}
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
                                    {clubEvents.map((event: any) => (
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
                                                            <Button variant="ghost" size="icon" onClick={() => confirmDelete('event', event.id, event.is_club_event)} className="h-8 w-8 text-red-400 hover:bg-red-400/10">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Calendar className="w-3.5 h-3.5 text-[#00E5FF]" />
                                                            {new Date(event.date).toLocaleDateString()}
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
                                    {currentClubDetails?.teamMembers?.map((member: any) => (
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
                                        {formData.id ? 'Edit' : 'Create'} {addModalType === 'event' ? 'Event' : addModalType === 'announcement' ? 'Announcement' : addModalType === 'member' ? 'Member' : addModalType === 'profile' ? 'Profile' : 'Item'}
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
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Description <span className="text-red-500">*</span></label>
                                                    <Textarea
                                                        value={formData.description || ''}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10 min-h-[100px]"
                                                        placeholder="Describe your event..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Date <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="date"
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
                                                    <label className="text-sm font-medium text-gray-300">Select User <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={formData.user_id || ''}
                                                        onChange={(e) => {
                                                            const selectedUser = users.find((u: any) => u.id === e.target.value);
                                                            setFormData({ 
                                                                ...formData, 
                                                                user_id: e.target.value, 
                                                                name: selectedUser?.displayName || selectedUser?.email || '' 
                                                            });
                                                        }}
                                                        required
                                                        disabled={!!formData.id}
                                                        className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                    >
                                                        <option value="">Choose a student...</option>
                                                        {users.map((u: any) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.displayName || u.email}
                                                            </option>
                                                        ))}
                                                    </select>
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
                                                            value={(formData.span || 'col-span-1').split(' ')[0]}
                                                            onChange={e => {
                                                                const currentSpan = formData.span || 'col-span-1 row-span-1';
                                                                const [, rowSpan] = currentSpan.split(' ');
                                                                setFormData({ ...formData, span: `${e.target.value} ${rowSpan || 'row-span-1'}` });
                                                            }}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="col-span-1">1 Column</option>
                                                            <option value="col-span-2">2 Columns</option>
                                                            <option value="col-span-3">3 Columns</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Grid Height (Rows)</label>
                                                        <select
                                                            value={(formData.span || 'row-span-1').includes('row-span-2') ? 'row-span-2' : 'row-span-1'}
                                                            onChange={e => {
                                                                const currentSpan = formData.span || 'col-span-1 row-span-1';
                                                                const [colSpan] = currentSpan.split(' ');
                                                                setFormData({ ...formData, span: `${colSpan} ${e.target.value}` });
                                                            }}
                                                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 h-10"
                                                        >
                                                            <option value="row-span-1">1 Row</option>
                                                            <option value="row-span-2">2 Rows</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Image Source <span className="text-red-500">*</span></label>
                                                    <Input required value={formData.src || ''} onChange={e => setFormData({ ...formData, src: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-teal-500" placeholder="https://example.com/image.jpg" />
                                                    <p className="text-[10px] text-gray-400 mt-1">Provide a direct URL to an image, preferably hosted on an image sharing service or cloud storage.</p>
                                                </div>
                                            </>
                                        )}

                                        {/* Modals for Club Profile */}
                                        {addModalType === 'profile' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Club Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.name || ''}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10 text-white"
                                                        placeholder="e.g. Coding Club"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Description <span className="text-red-500">*</span></label>
                                                    <Textarea
                                                        value={formData.description || ''}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10 text-white min-h-[100px]"
                                                        placeholder="Brief description of your club's mission and activities..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-300">Club Lead / President <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={formData.lead || ''}
                                                        onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                                                        required
                                                        className="bg-black/50 border-white/10 text-white"
                                                        placeholder="e.g. John Doe"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Website / Linktree (Optional)</label>
                                                        <Input
                                                            value={formData.website || ''}
                                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                            className="bg-black/50 border-white/10 text-white"
                                                            placeholder="https://linktr.ee/..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">Profile Image URL (Optional)</label>
                                                        <Input
                                                            value={formData.image || ''}
                                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                            className="bg-black/50 border-white/10 text-white"
                                                            placeholder="https://example.com/logo.jpg"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                    </form>
                                </div>

                                <div className="p-6 border-t border-white/10 bg-black/50 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-white/10 text-white hover:bg-white/5">
                                        Cancel
                                    </Button>
                                    <Button type="submit" form="resource-form" className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold min-w-24">
                                        Save Data
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                
                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                            <Trash2 className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Delete {itemToDelete?.type === 'gallery' ? 'Image' : itemToDelete?.type === 'member' ? 'Member' : 'Item'}?</h3>
                                            <p className="text-slate-400 text-sm">Action cannot be undone.</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-300 mb-8 leading-relaxed">
                                        Are you sure you want to permanently remove this {itemToDelete?.type}? All associated data will be lost from our records.
                                    </p>
                                    
                                    <div className="flex justify-end gap-3">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => {
                                                setIsDeleteModalOpen(false);
                                                setItemToDelete(null);
                                            }} 
                                            className="text-slate-400 hover:text-white hover:bg-white/5 font-semibold px-6"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={executeDelete} 
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 shadow-lg shadow-red-500/20"
                                        >
                                            Delete Permanently
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
