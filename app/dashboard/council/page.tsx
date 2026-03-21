'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlassModal } from '@/components/ui/glass-modal';
import {
    Megaphone, Calendar, CheckCircle, XCircle, AlertTriangle, LogOut, ThumbsUp, Plus, Trash2, Star, Menu, MessageSquare, FileText, Users, Eye, ExternalLink, Camera, Upload, X, Trophy, BellOff
} from 'lucide-react';
import { useTickets } from '@/lib/ticket-context';
import Link from 'next/link';
import { useSharedData, Announcement, Achievement, GalleryImage } from '@/hooks/useSharedData';
import { useAuthenticationStatus, useUserData } from '@nhost/react';

function CouncilDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const memberIdParam = searchParams.get('member');
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Contexts
    const { tickets, updateTicketStatus } = useTickets();
    const { announcements, setAnnouncements, events, setEvents, achievements, setAchievements, galleryImages, setGalleryImages, members, refetchAnnouncements, refetchEvents, refetchAchievements, refetchGalleryImages } = useSharedData();
    // UI States
    const [activeTab, setActiveTab] = useState('announcements');
    const [selectedTicket, setSelectedTicket] = useState<any>(null); // For viewing full complaint details
    const [viewingImage, setViewingImage] = useState<string | null>(null); // For standalone image views

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalType, setAddModalType] = useState<'announcement' | 'event' | 'achievement' | 'gallery'>('announcement');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: string } | null>(null);
    // Camera & Image State for Forms
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [formData, setFormData] = useState<Record<string, any>>({});

    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.push('/login');
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const roles = (user as any).roles || [];
            const defaultRole = user?.defaultRole || '';
            const isEmailAuthorized = members.some(m => m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase());
            const hasOverrideRole = roles.includes('admin') || roles.includes('developer') || defaultRole === 'admin' || defaultRole === 'developer';
            
            if (isEmailAuthorized || hasOverrideRole) {
                setIsAuthorized(true);
            } else {
                router.push('/dashboard/student');
            }
        }
    }, [isAuthenticated, isLoading, user, router, members]);

    if (!isAuthorized) {
        return <div className="min-h-screen bg-black" />;
    }

    // Determine whose content to show: the selected member (for admin) or the logged-in user
    const viewingMember = memberIdParam ? members.find(m => m.email.toLowerCase() === decodeURIComponent(memberIdParam).toLowerCase()) : null;
    const isViewingOther = !!viewingMember;

    // When viewing a specific member, show all Council-submitted content
    // When viewing own dashboard, show only own content
    // Show all Council and President content by default
    const filteredAnnouncements = announcements.filter(item => 
        item.addedByRole === 'Council' || 
        item.addedByRole === 'President' || 
        item.createdBy === user?.id
    );
    const filteredEvents = events.filter(event => 
        event.addedByRole === 'Council' || 
        event.addedByRole === 'President' || 
        event.createdBy === user?.id
    );
    const filteredAchievements = achievements.filter(item => 
        item.addedByRole === 'Council' || 
        item.addedByRole === 'President' || 
        item.createdBy === user?.id
    );
    const filteredGallery = galleryImages.filter(image => 
        image.addedByRole === 'Council' || 
        image.addedByRole === 'President' || 
        image.createdBy === user?.id
    );

    const pendingCount = tickets.filter(t => t.status === 'Pending').length;
    const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;

    // Handlers
    const openAddModal = (type: 'announcement' | 'event' | 'achievement' | 'gallery', data?: any) => {
        setAddModalType(type);
        setFormData(data || {});
        setIsAddModalOpen(true);
    };

    const confirmDelete = (type: string, id: string) => {
        setItemToDelete({ type, id });
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            const apiMap: Record<string, string> = {
                'announcement': '/api/v1/nhost/delete-announcement',
                'event': '/api/v1/nhost/delete-event',
                'achievement': '/api/v1/nhost/delete-achievement',
                'gallery': '/api/v1/nhost/delete-gallery-image'
            };
            
            const endpoint = apiMap[itemToDelete.type];
            if (!endpoint) {
                alert(`Deletion for ${itemToDelete.type} is not implemented`);
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemToDelete.id })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to delete item');
            }

            // Refresh data via useSharedData refetch
            if (itemToDelete.type === 'announcement') refetchAnnouncements();
            else if (itemToDelete.type === 'event') refetchEvents();
            else if (itemToDelete.type === 'achievement') refetchAchievements();
            else if (itemToDelete.type === 'gallery') refetchGalleryImages();
            else refetchAnnouncements(); // Fallback
        } catch (e: any) {
            console.error("Error deleting:", e);
            alert(e.message || "An error occurred while deleting.");
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    // Camera Handlers
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setIsCameraOpen(false);
            alert("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size > 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const imageData = canvasRef.current.toDataURL('image/jpeg');
                setFormData(prev => ({ ...prev, image: imageData }));
                stopCamera();
            }
        }
    };

    const removePhoto = () => {
        setFormData(prev => {
            const newData = { ...prev };
            delete newData.image;
            return newData;
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!formData.id;

        try {
            if (addModalType === 'announcement') {
                if (isEditing) {
                    const res = await fetch('/api/v1/nhost/update-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: formData.id,
                            title: formData.title,
                            content: formData.content,
                            category: formData.category,
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to update announcement');
                    refetchAnnouncements();
                } else {
                    const res = await fetch('/api/v1/nhost/insert-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.title || 'Untitled',
                            content: formData.content || '',
                            category: formData.category || 'General',
                            created_by: user?.id,
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to insert announcement');
                    refetchAnnouncements();
                }
            } else if (addModalType === 'event') {
                if (isEditing) {
                    const res = await fetch('/api/v1/nhost/update-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: formData.id,
                            title: formData.name,
                            description: formData.description,
                            event_date: formData.date ? new Date(formData.date).toISOString() : undefined,
                            venue: formData.location,
                            registration_link: formData.registrationLink,
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to update event');
                    refetchEvents();
                } else {
                    const res = await fetch('/api/v1/nhost/insert-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.name || 'Untitled',
                            description: formData.description || 'No description provided',
                            event_date: new Date(formData.date || new Date()).toISOString(),
                            venue: formData.location || 'TBA',
                            organizer_type: 'council',
                            registration_link: formData.registrationLink,
                            created_by: user?.id,
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to insert event');
                    refetchEvents();
                }
            } else if (addModalType === 'achievement') {
                if (isEditing) {
                    const res = await fetch('/api/v1/nhost/update-achievement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: formData.id,
                            student: formData.student || '',
                            title: formData.title || 'Untitled',
                            category: formData.category || 'academic',
                            date: formData.date || new Date().toISOString().split('T')[0],
                            description: formData.description || '',
                            image: formData.image || null,
                            tier: formData.tier || 'Bronze',
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to update achievement');
                    refetchAchievements(); 
                } else {
                    const res = await fetch('/api/v1/nhost/insert-achievement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student: formData.student || '',
                            title: formData.title || 'Untitled',
                            category: formData.category || 'academic',
                            date: formData.date || new Date().toISOString().split('T')[0],
                            description: formData.description || '',
                            image: formData.image || null,
                            student_id: formData.student_id || null,
                            tier: formData.tier || 'Bronze',
                            created_by: user?.id,
                            added_by_role: 'Council'
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to insert achievement');
                    refetchAchievements(); 
                }
            } else if (addModalType === 'gallery') {
                if (!formData.src && !isEditing) {
                    alert("Please upload an image before saving.");
                    return;
                }
                
                if (isEditing) {
                    alert("Edit functionality for gallery images is not available via API. Try deleting and re-uploading.");
                } else {
                    const res = await fetch('/api/v1/nhost/insert-gallery-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            src: formData.src,
                            alt: formData.alt || '',
                            span: formData.span || 'col-span-1 row-span-1',
                            added_by_role: 'Council',
                            date_added: new Date().toISOString().split('T')[0],
                            created_by: user?.id
                        })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Failed to insert gallery image');
                    refetchGalleryImages();
                }
            }
        } catch (e: any) {
            console.error("Error saving data:", e);
            alert(e.message || "An error occurred while saving.");
        }
        setIsAddModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-white pt-24 md:pt-16 pb-20 font-sans relative">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1400px] relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-[40px] font-extrabold tracking-widest uppercase leading-none font-mono">
                                <span className="text-white">Council</span> <span className="text-[#0ea5e9]">Dashboard</span>
                            </h1>
                        {isViewingOther && (
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
                                Viewing: {viewingMember?.name} ({viewingMember?.role})
                            </Badge>
                        )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-[#64748B] text-[10px] tracking-[0.2em] font-mono uppercase">System.Access.Level_04</p>
                            <Badge variant="outline" className="border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981] rounded-full px-3 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Encrypted Connection
                            </Badge>
                        </div>
                    </div>


                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Complaints (Cyan left border) */}
                    <Card className="bg-[#0F172A] border-none rounded-xl relative overflow-hidden flex flex-col justify-center shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
                        <CardContent className="p-6 flex justify-between items-end relative pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Pending Complaints</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{pendingCount.toString().padStart(2, '0')}</h3>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>

                    {/* Events */}
                    <Card className="bg-[#0F172A] border-none rounded-xl flex flex-col justify-center shadow-lg">
                        <CardContent className="p-6 flex justify-between items-end pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Active Events</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{filteredEvents.length.toString().padStart(2, '0')}</h3>
                            </div>
                            <Calendar className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>

                    {/* Announcements (Cyan left border) */}
                    <Card className="bg-[#0F172A] border-none rounded-xl relative overflow-hidden flex flex-col justify-center shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
                        <CardContent className="p-6 flex justify-between items-end relative pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Total Announcements</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{filteredAnnouncements.length.toString().padStart(2, '0')}</h3>
                            </div>
                            <Megaphone className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>

                    {/* Achievements */}
                    <Card className="bg-[#0F172A] border-none rounded-xl flex flex-col justify-center shadow-lg">
                        <CardContent className="p-6 flex justify-between items-end pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Total Achievements</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{filteredAchievements.length.toString().padStart(2, '0')}</h3>
                            </div>
                            <Trophy className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs & Content Area */}
                <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden mb-12">
                    <Tabs defaultValue="announcements" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b border-slate-800 px-6 overflow-x-auto">
                            <TabsList className="bg-transparent border-0 p-0 h-16 flex items-center justify-start gap-8 min-w-max">
                                {['announcements', 'events', 'complaints', 'achievements', 'gallery'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="h-full rounded-none px-0 text-slate-400 hover:text-white data-[state=active]:bg-transparent data-[state=active]:text-[#00E5FF] data-[state=active]:shadow-[0_2px_0_0_#00E5FF] capitalize font-semibold tracking-wide transition-all data-[state=active]:uppercase"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Announcements Content */}
                        <TabsContent value="announcements" className="space-y-6 p-6 pt-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        Public Announcements
                                    </h2>
                                    <p className="text-sm text-slate-400">Broadcast official messages to the council membership</p>
                                </div>
                                <Button
                                    onClick={() => openAddModal('announcement')}
                                    className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> NEW ANNOUNCEMENT
                                </Button>
                            </div>
                            <div className="grid gap-4">
                                {filteredAnnouncements.map((item) => (
                                    <Card key={item.id} className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-colors">
                                        <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                                    <Badge variant="outline" className={item.priority === 'High' ? 'text-red-500 border-red-500' : 'text-blue-500 border-blue-500'}>{item.priority || 'Low'}</Badge>
                                                    <Badge variant="secondary" className="bg-white/10 text-gray-300">{item.category || 'General'}</Badge>
                                                </div>
                                                <p className="text-gray-400 mb-2">{item.content}</p>
                                                <p className="text-xs text-gray-500">Posted: {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {item.link && (
                                                    <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm" className="w-full border-blue-500/20 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 mb-2 md:mb-0">
                                                            <ExternalLink className="w-4 h-4 mr-2" /> View Link
                                                        </Button>
                                                    </a>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('announcement', item)} className="border-white/20 text-gray-300 hover:text-white mb-2 md:mb-0">
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('announcement', item.id)} className="text-red-500 hover:bg-red-500/10 hover:text-red-400 self-start md:self-center bg-black/20">
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {filteredAnnouncements.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center mt-8 min-h-[400px]">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                            <BellOff className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No active announcements</h3>
                                        <p className="text-sm text-slate-400 max-w-sm">
                                            There are currently no public announcements to display. Create a new one using the button above to get started.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Events Content */}
                        <TabsContent value="events" className="space-y-6 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        Campus Events
                                    </h2>
                                    <p className="text-sm text-slate-400">Manage and track upcoming centralized campus activities</p>
                                </div>
                                <Button
                                    onClick={() => openAddModal('event')}
                                    className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> CREATE EVENT
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredEvents.map((event) => (
                                    <Card key={event.id} className="bg-white/5 border-white/10 group relative overflow-hidden">
                                        {event.image ? (
                                            <div className="h-32 w-full relative">
                                                <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-lg">{event.name}</h3>
                                                        <Badge className="bg-cyan-500/20 text-cyan-500 whitespace-nowrap">{event.type}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 pb-2">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="font-bold text-lg">{event.name}</h3>
                                                    <Badge className="bg-cyan-500/20 text-cyan-500">{event.type}</Badge>
                                                </div>
                                            </div>
                                        )}

                                        <CardContent className="p-6 pt-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge variant="outline" className="border-white/20 text-blue-400">{event.type || 'Social Event'}</Badge>
                                                <div className="flex items-center gap-1 -mt-2 -mr-2 ml-auto z-10 relative">
                                                    <Button variant="ghost" size="sm" onClick={() => openAddModal('event', event)} className="text-gray-300 hover:text-white h-8 px-2">
                                                        Edit
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete('event', event.id)} className="text-red-500 hover:bg-red-500/10 h-8 w-8">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                                <Star className="w-4 h-4" />
                                                <span>{event.location}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredEvents.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center mt-8 min-h-[400px] col-span-1 md:col-span-2">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                            <Calendar className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No upcoming events</h3>
                                        <p className="text-sm text-slate-400 max-w-sm">
                                            The events schedule is currently empty. Plan and deploy a new activity using the button above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Achievements Content */}
                        <TabsContent value="achievements" className="space-y-6 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        Hall of Fame
                                    </h2>
                                    <p className="text-sm text-slate-400">Displaying student achievements and accolades</p>
                                </div>
                                <Button
                                    onClick={() => openAddModal('achievement')}
                                    className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> CREATE ENTRY
                                </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredAchievements.map((item) => (
                                    <Card key={item.id} className="bg-white/5 border-white/10 hover:border-yellow-500/50 transition-colors">
                                        {item.image && (
                                            <div className="h-48 w-full overflow-hidden rounded-t-lg">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-2">
                                                    <Badge variant="outline" className="border-white/20 text-yellow-400 w-fit">{item.category}</Badge>
                                                    {item.tier && (
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`w-fit text-[10px] font-bold uppercase tracking-wider ${
                                                                item.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' :
                                                                item.tier === 'Silver' ? 'bg-slate-300/20 text-slate-300 border-slate-300/50' :
                                                                item.tier === 'Bronze' ? 'bg-orange-400/20 text-orange-400 border-orange-400/50' :
                                                                'bg-cyan-500/20 text-cyan-500 border-cyan-500/50'
                                                            }`}
                                                        >
                                                            {item.tier}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 -mt-2 -mr-2 ml-auto z-10 relative">
                                                    <Button variant="ghost" size="sm" onClick={() => openAddModal('achievement', item)} className="text-gray-300 hover:text-white h-8 px-2">
                                                        Edit
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete('achievement', item.id)} className="text-red-500 hover:bg-red-500/10 h-8 w-8">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                            <p className="text-gray-400 mb-4">{item.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{item.student}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{item.date}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredAchievements.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center mt-8 min-h-[400px] col-span-1 md:col-span-2">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                            <Trophy className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No achievements recorded</h3>
                                        <p className="text-sm text-slate-400 max-w-sm">
                                            The hall of fame is currently empty. Record a new student accolade using the button above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Complaints Content */}
                        <TabsContent value="complaints" className="space-y-6 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        Student Complaints
                                    </h2>
                                    <p className="text-sm text-slate-400">Monitor and resolve secured communication channels for student reports</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 rounded-md px-4 py-2 text-xs font-semibold">
                                        <span className="text-cyan-400 mr-2">{pendingCount}</span> Pending
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 rounded-md px-4 py-2 text-xs font-semibold">
                                        <span className="text-cyan-400 mr-2">{inProgressCount}</span> In Progress
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center mt-8 min-h-[400px]">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                            <MessageSquare className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No reports found</h3>
                                        <p className="text-sm text-slate-400 max-w-sm">
                                            The communication array is clear. No pending student reports at this time.
                                        </p>
                                    </div>
                                ) : (
                                    tickets.map((ticket) => (
                                        <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
                                            <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
                                                                        <Badge className={`${ticket.priority === 'High' ? 'bg-red-500/20 text-red-500' :
                                                                            ticket.priority === 'Medium' ? 'bg-cyan-500/20 text-cyan-500' :
                                                                                'bg-blue-500/20 text-blue-500'
                                                                            }`}>
                                                                            {ticket.priority}
                                                                        </Badge>
                                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <ThumbsUp className="w-3 h-3 text-blue-500" />
                                                                            {ticket.votes || 0} Votes
                                                                        </span>
                                                                        <Badge variant="outline" className="border-white/20 text-gray-400">
                                                                            {ticket.department}
                                                                        </Badge>
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
                                                                </div>
                                                            </div>

                                                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                                            Posted: {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </p>
                                                            <p className="text-gray-400 text-sm line-clamp-3">{ticket.description}</p>

                                                            {ticket.image && (
                                                                <div className="mt-3">
                                                                    <div
                                                                        className="relative h-32 w-48 rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setViewingImage(ticket.image!);
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={ticket.image}
                                                                            alt="Attachment"
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                            <div className="bg-black/60 p-2 rounded-full backdrop-blur-sm">
                                                                                <Eye className="w-5 h-5 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                        <FileText className="w-3 h-3" /> Click to view attachment
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-white/5">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {ticket.studentName}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3 min-w-[200px]">
                                                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                                                <span className="text-xs text-gray-500 block mb-2">Current Status</span>
                                                                <Badge className={`w-full justify-center py-1 mb-3 ${ticket.status === 'Completed' ? 'bg-green-500 text-black' :
                                                                    ticket.status === 'In Progress' ? 'bg-blue-500 text-white' :
                                                                        ticket.status === 'Rejected' ? 'bg-red-500 text-white' :
                                                                            'bg-cyan-500 text-black'
                                                                    }`}>
                                                                    {ticket.status}
                                                                </Badge>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {ticket.status !== 'In Progress' && ticket.status !== 'Completed' && ticket.status !== 'Rejected' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 text-xs border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateTicketStatus(ticket.id, 'In Progress');
                                                                            }}
                                                                        >
                                                                            Start
                                                                        </Button>
                                                                    )}
                                                                    {ticket.status !== 'Completed' && ticket.status !== 'Rejected' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 text-xs border-green-500/50 text-green-500 hover:bg-green-500/10"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateTicketStatus(ticket.id, 'Completed');
                                                                            }}
                                                                        >
                                                                            Resolve
                                                                        </Button>
                                                                    )}
                                                                    {ticket.status !== 'Rejected' && ticket.status !== 'Completed' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 text-xs border-red-500/50 text-red-500 hover:bg-red-500/10 col-span-2"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateTicketStatus(ticket.id, 'Rejected', 'Rejected by Council');
                                                                            }}
                                                                        >
                                                                            Reject
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        {/* Gallery Content */}
                        <TabsContent value="gallery" className="space-y-6 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        Media Gallery
                                    </h2>
                                    <p className="text-sm text-slate-400">Manage visual assets for the campus network</p>
                                </div>
                                <Button
                                    onClick={() => openAddModal('gallery')}
                                    className="bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold rounded-md shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> UPLOAD MEDIA
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredGallery.map((image) => (
                                    <Card key={image.id} className="bg-white/5 border-white/10 overflow-hidden group">
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={image.src || undefined}
                                                alt={image.alt}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                    <div>
                                                        <h3 className="text-white font-bold">{image.alt}</h3>
                                                        <p className="text-xs text-gray-300">Added: {image.dateAdded || 'N/A'}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete('gallery', image.id)} className="text-red-500 hover:bg-red-500/20 bg-black/50">
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 flex gap-2">
                                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 bg-cyan-500/10 text-xs">
                                                Span: {image.span.split(' ')[0].replace('col-span-', '')}x{image.span.split(' ')[1].replace('row-span-', '')}
                                            </Badge>
                                            <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">
                                                By: {image.addedByRole || 'System'}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                                {filteredGallery.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center mt-8 min-h-[400px] col-span-full">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                                            <Camera className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">No media assets</h3>
                                        <p className="text-sm text-slate-400 max-w-sm">
                                            The visual array is currently empty. Upload photos to share with the student body using the button above.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Add/Edit Modal */}
                    <GlassModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        title={formData.id ? `Edit ${addModalType}` : `New ${addModalType}`}
                        footer={
                            <>
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-white/20 hover:bg-white/10 hover:text-white">Cancel</Button>
                                <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700 font-bold border-none">
                                    Save Details
                                </Button>
                            </>
                        }
                    >
                        <form className="space-y-4" onSubmit={handleSave}>
                            {addModalType === 'announcement' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Title</label>
                                        <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-blue-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Content</label>
                                        <Textarea required value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} className="bg-black/50 border-white/10 text-white min-h-[100px] focus:border-blue-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Category</label>
                                        <select value={formData.category || 'General'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-blue-500/50 outline-none">
                                            <option value="General">General</option>
                                            <option value="Academic">Academic</option>
                                            <option value="Event">Event</option>
                                            <option value="Emergency">Emergency</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Priority</label>
                                        <select value={formData.priority || 'Low'} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-blue-500/50 outline-none">
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Link (Optional)</label>
                                        <Input value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-blue-500/50" placeholder="e.g. https://example.com" />
                                    </div>
                                </>
                            )}

                            {addModalType === 'event' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Event Name</label>
                                        <Input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Date</label>
                                        <Input required type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Location</label>
                                        <Input required value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Event Type</label>
                                        <select value={formData.type || 'Social'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none">
                                            <option value="Academic">Academic</option>
                                            <option value="Social">Social</option>
                                            <option value="Sports">Sports</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Registration Link (Optional)</label>
                                        <Input type="url" placeholder="https://forms.gle/..." value={formData.registrationLink || ''} onChange={e => setFormData({ ...formData, registrationLink: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                    </div>
                                </>
                            )}

                            {addModalType === 'achievement' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Achievement Title</label>
                                        <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-yellow-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Student/Team Name</label>
                                        <Input required value={formData.student || ''} onChange={e => setFormData({ ...formData, student: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-yellow-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Description</label>
                                        <Textarea required value={formData.description || ''} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-yellow-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Category</label>
                                        <select value={formData.category || 'academic'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-yellow-500/50 outline-none">
                                            <option value="academic">Academic</option>
                                            <option value="sports">Sports</option>
                                            <option value="cultural">Cultural</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Tier</label>
                                        <select value={formData.tier || 'Bronze'} onChange={e => setFormData({ ...formData, tier: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-yellow-500/50 outline-none">
                                            <option value="Gold">Gold</option>
                                            <option value="Silver">Silver</option>
                                            <option value="Bronze">Bronze</option>
                                            <option value="Finalist">Finalist</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Date</label>
                                        <Input required value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-yellow-500/50" placeholder="e.g. March 2025" />
                                    </div>

                                    {/* Photo Upload Section */}
                                    <div className="space-y-4 pt-2 border-t border-white/10">
                                        <label className="text-sm font-medium text-gray-300">Achievement Photo (Optional)</label>

                                        {!isCameraOpen && !formData.image && (
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById('achievement-file-upload')?.click()}
                                                    className="border-white/10 hover:bg-white/5 bg-black/50"
                                                >
                                                    <input
                                                        id="achievement-file-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                    />
                                                    <Upload className="w-4 h-4 mr-2" /> Upload Photo
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={startCamera}
                                                    className="border-white/10 hover:bg-white/5 bg-black/50"
                                                >
                                                    <Camera className="w-4 h-4 mr-2" /> Use Camera
                                                </Button>
                                            </div>
                                        )}

                                        {isCameraOpen && (
                                            <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden max-w-md mx-auto">
                                                <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                                                <canvas ref={canvasRef} className="hidden" />
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                                    <Button type="button" onClick={capturePhoto} className="bg-yellow-500 text-black hover:bg-yellow-400">
                                                        <Camera className="w-4 h-4 mr-2" /> Capture
                                                    </Button>
                                                    <Button type="button" onClick={stopCamera} variant="destructive" className="bg-red-500 hover:bg-red-600">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {formData.image && (
                                            <div className="relative inline-block w-full">
                                                <img src={formData.image} alt="Achievement Preview" className="h-32 w-full rounded-lg border border-yellow-500/50 object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {addModalType === 'gallery' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Image Title / Description</label>
                                        <Input required value={formData.alt || ''} onChange={e => setFormData({ ...formData, alt: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" placeholder="e.g. Convocation 2024" />
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
                                                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none"
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
                                                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none"
                                            >
                                                <option value="row-span-1">1 Row</option>
                                                <option value="row-span-2">2 Rows</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Image (Max 1MB)</label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            required
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 1048576) { // 1MB limit for gallery to allow better quality
                                                        alert("File size exceeds 1MB. Please upload a smaller image.");
                                                        e.target.value = ''; // Clear input
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, src: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50 file:bg-cyan-500 file:text-black file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 file:text-sm file:font-semibold hover:file:bg-cyan-400"
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
                    </GlassModal>

                    {/* Delete Confirmation Modal */}
                    <GlassModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        title="Confirm Deletion"
                        variant="danger"
                        footer={
                            <>
                                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="border-white/20 hover:bg-white/10 hover:text-white">Cancel</Button>
                                <Button onClick={executeDelete} className="bg-red-600 text-white hover:bg-red-700 font-bold border-none">
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </>
                        }
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-white mb-2">Are you sure?</p>
                                <p className="text-gray-400">
                                    This action cannot be undone. This item will be permanently removed.
                                </p>
                            </div>
                        </div>
                    </GlassModal>

                    {/* View Complaint Details Modal */}
                    <GlassModal
                        isOpen={!!selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                        title="Complaint Details"
                        className="max-w-2xl"
                        footer={
                            <>
                                <Button variant="outline" onClick={() => setSelectedTicket(null)} className="border-white/20 hover:bg-white/10 hover:text-white">Close</Button>
                                {selectedTicket?.status !== 'In Progress' && selectedTicket?.status !== 'Completed' && selectedTicket?.status !== 'Rejected' && (
                                    <Button
                                        onClick={() => {
                                            updateTicketStatus(selectedTicket.id, 'In Progress');
                                            setSelectedTicket(null);
                                        }}
                                        className="bg-blue-600 text-white hover:bg-blue-700 font-bold border-none"
                                    >
                                        Start Progress
                                    </Button>
                                )}
                                {selectedTicket?.status !== 'Completed' && selectedTicket?.status !== 'Rejected' && (
                                    <Button
                                        onClick={() => {
                                            updateTicketStatus(selectedTicket.id, 'Completed');
                                            setSelectedTicket(null);
                                        }}
                                        className="bg-green-600 text-white hover:bg-green-700 font-bold border-none"
                                    >
                                        Mark Resolved
                                    </Button>
                                )}
                                {selectedTicket?.status !== 'Rejected' && selectedTicket?.status !== 'Completed' && (
                                    <Button
                                        onClick={() => {
                                            updateTicketStatus(selectedTicket.id, 'Rejected', 'Rejected by Council');
                                            setSelectedTicket(null);
                                        }}
                                        className="bg-red-600 text-white hover:bg-red-700 font-bold border-none"
                                    >
                                        Reject Complaint
                                    </Button>
                                )}
                            </>
                        }
                    >
                        {selectedTicket && (
                            <div className="space-y-6 text-sm">
                                <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-white/10">
                                    <div>
                                        <div className="text-gray-500 font-mono text-xs mb-1">Ticket ID: {selectedTicket.id}</div>
                                        <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${selectedTicket.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                                                selectedTicket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                                                    selectedTicket.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-cyan-500/20 text-cyan-500'
                                                }`}>
                                                {selectedTicket.status}
                                            </Badge>
                                            <Badge className={`${selectedTicket.priority === 'High' ? 'bg-red-500/20 text-red-500' :
                                                selectedTicket.priority === 'Medium' ? 'bg-cyan-500/20 text-cyan-500' :
                                                    'bg-blue-500/20 text-blue-500'
                                                }`}>
                                                Priority: {selectedTicket.priority}
                                            </Badge>
                                            <Badge variant="outline" className="border-white/20 text-gray-300">
                                                Dept: {selectedTicket.department}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-400">
                                        <p className="mb-1"><span className="text-gray-500">From:</span> {selectedTicket.studentName}</p>
                                        <p><span className="text-gray-500">Date:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                        <div className="flex items-center justify-end gap-1 mt-2 text-blue-500">
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>{selectedTicket.votes || 0} Votes</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-300 mb-2">Description</h4>
                                    <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                {selectedTicket.image && (
                                    <div>
                                        <h4 className="font-semibold text-gray-300 mb-2">Attached Image</h4>
                                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                            <img src={selectedTicket.image} alt="Ticket Attachment" className="max-w-full h-auto max-h-[400px] object-contain mx-auto" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassModal>
                </div>


            </div>
        </div>
    );
}

export default function CouncilDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <CouncilDashboardContent />
        </Suspense>
    );
}
