'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlassModal } from '@/components/ui/glass-modal';
import {
    Users, Megaphone, Calendar, Flag, Plus, Trash2,
    LogOut, CheckCircle, AlertTriangle, Star, Menu, FileText, ShoppingBag, BarChart2, Vote, Trophy, MessageSquare, ExternalLink, Camera, Upload, X, Crop, ThumbsUp, Eye
} from 'lucide-react';
import { useTickets, TicketProvider, TicketStatus } from '@/lib/ticket-context';
import Link from 'next/link';

// --- Types ---
import { useSharedData, Announcement, CouncilMember, Club, Event, Election, Achievement, User, GalleryImage, INSERT_ANNOUNCEMENT, INSERT_EVENT } from '@/hooks/useSharedData';
import { ImageCropper } from '@/components/ui/image-cropper';
import { useAuthenticationStatus, useUserData, useSignOut } from '@nhost/react';
import { useMutation } from '@apollo/client';
import { INSERT_CLUB, useClubData } from '@/hooks/useClubData';

function PresidentDashboardContent() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const { refetchMyClubByEmail, clubs, refetchClubs } = useClubData();

    // --- State Management ---
    const {
        announcements, setAnnouncements,
        members, setMembers,
        setClubs,
        events, setEvents,
        elections, setElections,
        achievements, setAchievements,
        users, setUsers,
        polls, setPolls,
        surveys, setSurveys,
        galleryImages, setGalleryImages,
        totalUsers,
        refetchAnnouncements,
        refetchEvents
    } = useSharedData();

    const [insertClub] = useMutation(INSERT_CLUB);
    const [insertAnnouncement] = useMutation(INSERT_ANNOUNCEMENT);
    const [insertEvent] = useMutation(INSERT_EVENT);

    const { tickets, updateTicketStatus } = useTickets();

    // UI States
    const [activeTab, setActiveTab] = useState('announcements');
    const [selectedTicket, setSelectedTicket] = useState<any>(null); // For viewing full complaint details

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalType, setAddModalType] = useState<'announcement' | 'member' | 'club' | 'event' | 'election' | 'achievement' | 'user' | 'poll' | 'survey' | 'gallery'>('announcement');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: string } | null>(null);
    const [eventFilter, setEventFilter] = useState<'All' | 'President' | 'Council' | 'Club Manager'>('All');
    const [announcementFilter, setAnnouncementFilter] = useState<'All' | 'President' | 'Council' | 'Club Manager'>('All');
    const [achievementFilter, setAchievementFilter] = useState<'All' | 'President' | 'Council' | 'Club Manager'>('All');

    // Camera & Image State for Forms
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null); // To keep track of stream for cleanup

    // Cropping State
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [isCandidateCrop, setIsCandidateCrop] = useState(false);

    // Temporary Candidate State for Election Form
    const [tempCandidateName, setTempCandidateName] = useState('');
    const [tempCandidateImage, setTempCandidateImage] = useState<string | undefined>(undefined);

    // Image Viewer Logic
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Form States
    const [formData, setFormData] = useState<Record<string, any>>({});

    const { isAuthenticated, isLoading } = useAuthenticationStatus();
    const user = useUserData();
    const { signOut } = useSignOut();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.push('/login');
                return;
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const roles = (user as any).roles || [];
            const defaultRole = user.defaultRole || '';
            
            if (roles.includes('president') || defaultRole === 'president' || roles.includes('admin') || roles.includes('developer') || defaultRole === 'admin' || defaultRole === 'developer') {
                setIsAuthorized(true);
            } else {
                router.push('/dashboard/student');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    // Load dashboard data from DB after authorization is confirmed
    useEffect(() => {
        if (!isAuthorized) return;
        fetch('/api/v1/nhost/get-dashboard-data')
            .then(res => res.json())
            .then(data => {
                if (!data || data.error) return;
                if (data.council_members?.length > 0) {
                    setMembers(data.council_members.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        role: m.role,
                        email: m.email,
                        status: m.status || 'Active',
                        image: m.image
                    })));
                }
                if (data.elections?.length > 0) {
                    setElections(data.elections.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        date: e.date,
                        description: e.description,
                        candidates: []
                    })));
                }
                if (data.achievements?.length > 0) {
                    setAchievements(data.achievements.map((a: any) => ({
                        id: a.id,
                        student: a.student_id || '',
                        title: a.title,
                        category: a.category,
                        date: a.achievement_date,
                        description: a.description,
                        image: a.image_url,
                        addedByRole: 'President'
                    })));
                }
                if (data.polls?.length > 0) {
                    setPolls(data.polls.map((p: any) => ({
                        id: p.id,
                        question: p.question,
                        status: p.is_active ? 'Active' : 'Closed',
                        options: p.options || [],
                        votes: 0
                    })));
                }
                if (data.surveys?.length > 0) {
                    setSurveys(data.surveys.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        description: s.description,
                        time: s.time,
                        link: s.link,
                        status: s.status || 'Active'
                    })));
                }
                if (data.gallery_images?.length > 0) {
                    setGalleryImages(data.gallery_images.map((g: any) => ({
                        id: g.id,
                        src: g.src,
                        alt: g.alt || '',
                        span: g.span || 'col-span-1 row-span-1',
                        addedByRole: g.added_by_role || 'President',
                        dateAdded: g.date_added
                    })));
                }
            })
            .catch(err => console.error('Failed to load dashboard data from DB:', err));
    }, [isAuthorized]);


    const openAddModal = (type: 'announcement' | 'member' | 'club' | 'event' | 'election' | 'achievement' | 'user' | 'poll' | 'survey' | 'gallery', data?: any) => {
        setAddModalType(type);
        setFormData(data || {}); // Reset form or load existing data
        setIsAddModalOpen(true);
    };

    const confirmDelete = (type: string, id: string) => {
        setItemToDelete({ type, id });
        setIsDeleteModalOpen(true);
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCandidate = false) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size > 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Open Cropper
                setCroppingImage(result);
                setIsCandidateCrop(isCandidate);
            };
            reader.readAsDataURL(file);
        }
    };

    const capturePhoto = (isCandidate = false) => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const imageData = canvasRef.current.toDataURL('image/jpeg');

                // Open Cropper
                setCroppingImage(imageData);
                setIsCandidateCrop(isCandidate);

                stopCamera();
            }
        }
    };

    const handleCropComplete = (croppedImage: string) => {
        if (isCandidateCrop) {
            setTempCandidateImage(croppedImage);
        } else {
            setFormData(prev => ({ ...prev, image: croppedImage }));
        }
        setCroppingImage(null);
    };

    const removePhoto = (isCandidate = false) => {
        if (isCandidate) {
            setTempCandidateImage(undefined);
        } else {
            setFormData(prev => {
                const newData = { ...prev };
                delete newData.image;
                return newData;
            });
        }
    };

    const executeDelete = () => {
        if (!itemToDelete) return;

        const { type, id } = itemToDelete;
        switch (type) {
            case 'announcement': setAnnouncements((prev: any[]) => prev.filter((i: any) => i.id !== id)); break;
            case 'member': setMembers(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'club': setClubs(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'event': setEvents((prev: any[]) => prev.filter((i: any) => i.id !== id)); break;
            case 'election': setElections(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'achievement': setAchievements(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'user': setUsers(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'poll': setPolls(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'survey': setSurveys(prev => prev.filter((i: any) => i.id !== id)); break;
            case 'gallery': setGalleryImages(prev => prev.filter((i: any) => i.id !== id)); break;
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
                return prev.map((item: any) => item.id === itemId ? { ...item, ...newItem } : item);
            }
            return [...prev, newItem];
        };

        switch (addModalType) {
            case 'announcement':
                if (isEditing) {
                    fetch('/api/v1/nhost/update-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: itemId,
                            title: formData.title || 'Untitled',
                            content: formData.content || '',
                            category: formData.category || 'General'
                        })
                    }).then(res => res.json()).then(() => {
                        refetchAnnouncements();
                    }).catch(e => {
                        console.error("Failed to update announcement:", e);
                    });
                    
                    // Optimistic update locally
                    setAnnouncements((prev: any[]) => updateState(prev, { ...newData, addedByRole: 'President', date: (newData as Announcement).date || new Date().toISOString().split('T')[0] }));
                } else {
                    fetch('/api/v1/nhost/insert-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.title || 'Untitled',
                            content: formData.content || '',
                            category: formData.category || 'General'
                        })
                    }).then(res => res.json()).then(() => {
                        refetchAnnouncements();
                    }).catch(e => {
                        console.error("Failed to insert announcement:", e);
                    });
                }
                break;
            case 'member':
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-council-member', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formData.name,
                            role: formData.role,
                            email: formData.email,
                            image: formData.image
                        })
                    }).then(res => res.json()).then(data => {
                        window.location.reload();
                    }).catch(console.error);
                }
                setMembers((prev: any[]) => updateState(prev, { ...newData, status: (newData as CouncilMember).status || 'Active' }));
                break;
            case 'club':
                const clubSlug = (formData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-club', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formData.name,
                            slug: clubSlug,
                            description: formData.description,
                            logo_url: formData.image,
                            club_email: formData.clubEmail || ''
                        })
                    }).then(res => res.json()).then(() => {
                        window.location.reload();
                    }).catch(e => {
                        console.error("Failed to insert club in DB:", e);
                        alert(`Database insertion failed for club. Error: ${e.message || 'Unknown error'}`);
                    });
                }
                setClubs((prev: any[]) => updateState(prev, { ...newData, slug: clubSlug, members: (newData as Club).members || 0 }));
                break;
            case 'event':
                if (isEditing) {
                    fetch('/api/v1/nhost/update-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: itemId,
                            title: formData.name || 'Untitled',
                            description: formData.description || 'No description provided',
                            event_date: new Date(formData.date || new Date()).toISOString(),
                            venue: formData.location || 'TBA',
                            registration_link: formData.registrationLink || null
                        })
                    }).then(res => res.json()).then(() => {
                        refetchEvents();
                    }).catch(e => {
                        console.error("Failed to update event:", e);
                    });
                    
                    // Optimistic update locally
                    setEvents((prev: any[]) => updateState(prev, { ...newData, addedByRole: 'President', event_date: new Date(formData.date || new Date()).toISOString(), registration_link: formData.registrationLink || null }));
                } else {
                    fetch('/api/v1/nhost/insert-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.name || 'Untitled',
                            description: formData.description || 'No description provided',
                            event_date: new Date(formData.date || new Date()).toISOString(),
                            venue: formData.location || 'TBA',
                            organizer_type: 'council',
                            registration_link: formData.registrationLink || null
                        })
                    }).then(res => res.json()).then(() => {
                        refetchEvents();
                    }).catch(e => console.error("Failed to insert event:", e));
                }
                break;
            case 'election':
                const electionPayloadDescription = JSON.stringify({
                    description: formData.description || 'No description',
                    startDate: formData.startDate,
                    startTime: formData.startTime,
                    endDate: formData.endDate,
                    endTime: formData.endTime
                });

                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-election', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.title || formData.name,
                            date: formData.startDate ? new Date(`${formData.startDate}T${formData.startTime || '00:00'}`).toISOString() : new Date().toISOString(),
                            description: electionPayloadDescription,
                            candidates: [
                                ...(formData.candidates || []),
                                ...(tempCandidateName.trim() ? [{ name: tempCandidateName.trim(), image: tempCandidateImage || null }] : [])
                            ].map((c: any) => ({
                                name: c.name,
                                image: c.image || null
                            }))
                        })
                    }).then(res => res.json()).then(data => {
                        refetchAnnouncements(); // triggers fetchDashboardData which loads elections too
                    }).catch(console.error);
                } else {
                    fetch('/api/v1/nhost/update-election', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: itemId,
                            title: formData.title || formData.name,
                            date: formData.startDate ? new Date(`${formData.startDate}T${formData.startTime || '00:00'}`).toISOString() : new Date().toISOString(),
                            description: electionPayloadDescription,
                            candidates: [
                                ...(formData.candidates || []),
                                ...(tempCandidateName.trim() ? [{ name: tempCandidateName.trim(), image: tempCandidateImage || null, votes: 0 }] : [])
                            ].map((c: any) => ({
                                name: c.name,
                                image: c.image || null,
                                votes: c.votes || 0
                            }))
                        })
                    }).then(res => res.json()).then(() => {
                        refetchAnnouncements(); // refresh all dashboard data
                    }).catch(console.error);
                }
                setElections((prev: any[]) => updateState(prev, { ...newData, candidates: (newData as any).candidates || [] }));
                break;
            case 'achievement':
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-achievement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student: formData.student || formData.name,
                            title: formData.title || formData.achievement,
                            category: formData.category || 'General',
                            date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
                            description: formData.description || 'No description',
                            image: formData.image
                        })
                    }).then(res => res.json()).then(data => {
                        window.location.reload();
                    }).catch(console.error);
                }
                setAchievements((prev: any[]) => updateState(prev, { ...newData, image: (newData as any).image || '', addedByRole: 'President' }));
                break;
            case 'user':
                setUsers(prev => {
                    const exists = prev.find(u => u.id === itemId);
                    if (exists) {
                        return prev.map(u => u.id === itemId ? { ...u, ...formData } as User : u);
                    }
                    return prev;
                });
            case 'poll':
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            question: formData.question || formData.title
                        })
                    }).then(res => res.json()).then(() => {
                        window.location.reload();
                    }).catch(console.error);
                }
                setPolls((prev: any[]) => updateState(prev, { ...newData, options: (newData as any).options || [], votes: 0, status: (newData as any).status || 'Active' }));
                break;
            case 'survey':
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-survey', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: formData.title,
                            description: formData.description || 'No description',
                            time: formData.time || formData.estimatedTime || '5 mins',
                            link: formData.link
                        })
                    }).then(res => res.json()).then(() => {
                        window.location.reload();
                    }).catch(console.error);
                }
                setSurveys((prev: any[]) => updateState(prev, { ...newData, status: (newData as any).status || 'Active' }));
                break;
            case 'gallery':
                if (!(newData as any).src) {
                    alert("Please upload an image before saving.");
                    return;
                }
                if (!isEditing) {
                    fetch('/api/v1/nhost/insert-gallery-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            src: formData.src,
                            alt: formData.alt || formData.title || 'Gallery image',
                            span: formData.span || 'col-span-1 row-span-1'
                        })
                    }).then(res => res.json()).then(() => {
                        window.location.reload();
                    }).catch(console.error);
                }
                setGalleryImages((prev: any[]) => updateState(prev, {
                    ...newData,
                    src: (newData as GalleryImage).src,
                    span: (newData as GalleryImage).span || 'col-span-1 row-span-1',
                    addedByRole: 'President',
                    dateAdded: (newData as GalleryImage).dateAdded || new Date().toISOString().split('T')[0]
                }));
                break;
        }
        setIsAddModalOpen(false);
    };

    if (!isAuthorized) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <div className="min-h-screen bg-[#0B0B14] text-white pt-24 md:pt-16 pb-20 font-sans">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 mt-4 relative">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        <h1 className="text-3xl md:text-[40px] font-extrabold tracking-widest text-[#0ea5e9] uppercase leading-none font-mono">
                            President's Office
                        </h1>
                        <Badge variant="outline" className="border-[#0ea5e9]/50 text-[#0ea5e9] bg-transparent rounded-full px-4 py-1 text-[10px] font-bold tracking-[0.2em] uppercase mt-2 md:mt-0">
                            Authorized Access
                        </Badge>
                    </div>
                    <div className="text-sm text-[#94a3b8] md:absolute md:left-0 md:-bottom-6 mt-2 md:mt-0">
                        Manage campus activities, board members, and announcements.
                    </div>
                    <div className="flex items-center gap-4 self-end md:self-auto mt-4 md:mt-0">
                        {/* Quick Access Hamburger */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                className="border-white/10 bg-transparent hover:bg-white/5 text-white rounded-lg h-10 px-4 text-xs font-bold tracking-widest uppercase transition-colors"
                                onClick={() => setActiveTab(activeTab === 'quick-access' ? 'announcements' : 'quick-access')}
                            >
                                <Menu className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Quick Access</span>
                            </Button>
                            {activeTab === 'quick-access' && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#111625] border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 p-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Quick Links</div>
                                    <Link href="/complaints">
                                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer font-medium">
                                            <FileText className="w-4 h-4 text-[#ef4444]" />
                                            Submit Complaint
                                        </div>
                                    </Link>
                                    <Link href="/marketplace">
                                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer font-medium">
                                            <ShoppingBag className="w-4 h-4 text-[#0ea5e9]" />
                                            Sell Item
                                        </div>
                                    </Link>
                                    <Link href="/feedback">
                                        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer font-medium">
                                            <BarChart2 className="w-4 h-4 text-[#8b5cf6]" />
                                            Take Survey
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>



                        <Button
                            variant="ghost"
                            className="text-[#64748B] hover:text-white hover:bg-white/5 text-xs font-bold tracking-widest uppercase h-10 px-3"
                            onClick={async () => {
                                await signOut();
                                router.push('/login');
                            }}
                        >
                            <span className="hidden sm:inline mr-2">Sign Out</span> <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="announcements" value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                    <div className="bg-[#111625] rounded-[24px] p-2 border border-white/5 mb-10 shadow-xl overflow-hidden hidden md:block">
                        <TabsList className="grid grid-cols-4 grid-rows-2 h-auto gap-2 bg-transparent p-0 w-full">
                            <TabsTrigger value="announcements" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Megaphone className="w-4 h-4 mr-3" /> Announcements</TabsTrigger>
                            <TabsTrigger value="members" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Users className="w-4 h-4 mr-3" /> Council Members</TabsTrigger>
                            <TabsTrigger value="clubs" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Flag className="w-4 h-4 mr-3" /> Clubs</TabsTrigger>
                            <TabsTrigger value="gallery" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Camera className="w-4 h-4 mr-3" /> Gallery</TabsTrigger>
                            <TabsTrigger value="events" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Calendar className="w-4 h-4 mr-3" /> Events</TabsTrigger>
                            <TabsTrigger value="elections" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Vote className="w-4 h-4 mr-3" /> Elections</TabsTrigger>
                            <TabsTrigger value="achievements" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><Trophy className="w-4 h-4 mr-3" /> Achievements</TabsTrigger>
                            <TabsTrigger value="complaints" className="h-[60px] rounded-xl data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-[#94a3b8] font-bold tracking-wide transition-all data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"><MessageSquare className="w-4 h-4 mr-3" /> Complaints</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Mobile fallback for tabs */}
                    <div className="md:hidden overflow-x-auto pb-4 mb-2 -mx-4 px-4 scrollbar-hide">
                        <TabsList className="inline-flex h-auto bg-[#111625] p-1 rounded-full border border-white/5">
                            <TabsTrigger value="announcements" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Megaphone className="w-3.5 h-3.5 mr-2" /> Announcements</TabsTrigger>
                            <TabsTrigger value="members" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Users className="w-3.5 h-3.5 mr-2" /> Members</TabsTrigger>
                            <TabsTrigger value="clubs" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Flag className="w-3.5 h-3.5 mr-2" /> Clubs</TabsTrigger>
                            <TabsTrigger value="gallery" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Camera className="w-3.5 h-3.5 mr-2" /> Gallery</TabsTrigger>
                            <TabsTrigger value="events" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Calendar className="w-3.5 h-3.5 mr-2" /> Events</TabsTrigger>
                            <TabsTrigger value="elections" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Vote className="w-3.5 h-3.5 mr-2" /> Elections</TabsTrigger>
                            <TabsTrigger value="achievements" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><Trophy className="w-3.5 h-3.5 mr-2" /> Achievements</TabsTrigger>
                            <TabsTrigger value="complaints" className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#0ea5e9] data-[state=active]:text-black text-xs font-bold whitespace-nowrap"><MessageSquare className="w-3.5 h-3.5 mr-2" /> Complaints</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Announcements Content */}
                    <TabsContent value="announcements" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Announcements</h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <select
                                    className="bg-[#111625] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] font-medium outline-none focus:border-[#0ea5e9]/50 transition-colors w-full sm:w-[200px]"
                                    value={announcementFilter}
                                    onChange={(e) => setAnnouncementFilter(e.target.value as any)}
                                >
                                    <option value="All">All Announcements</option>
                                    <option value="President">Added by President</option>
                                    <option value="Council">Added by Council</option>
                                    <option value="Club Manager">Added by Clubs</option>
                                </select>
                                <Button onClick={() => openAddModal('announcement')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                    <Plus className="w-4 h-4 mr-2" /> New Announcement
                                </Button>
                            </div>
                        </div>

                        {announcements.filter(a => announcementFilter === 'All' ? true : a.addedByRole === announcementFilter).length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Megaphone className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Active Announcements</h3>
                                <p className="text-[#64748B] italic max-w-sm">All broadcasts to the campus community will appear here. Start by creating your first update.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-8">
                                {announcements
                                    .filter(a => announcementFilter === 'All' ? true : a.addedByRole === announcementFilter)
                                    .map((item) => (
                                        <Card key={item.id} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-colors">
                                            <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                                        <Badge variant="outline" className={item.priority === 'High' ? 'text-red-500 border-red-500' : 'text-blue-500 border-blue-500'}>{item.priority}</Badge>
                                                        <Badge variant="secondary" className="bg-white/10 text-gray-300">{item.category || 'General'}</Badge>
                                                    </div>
                                                    <p className="text-gray-400 mb-2">{item.content}</p>
                                                    <p className="text-xs text-gray-500">Posted: {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {item.link && (
                                                        <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="w-full border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400 mb-2 md:mb-0">
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
                            </div>
                        )}
                    </TabsContent>

                    {/* Council Members Content */}
                    <TabsContent value="members" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Council Members</h2>
                            <Button onClick={() => openAddModal('member')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Add Member
                            </Button>
                        </div>
                        {members.length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Users className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Council Members</h3>
                                <p className="text-[#64748B] italic max-w-sm">There are no registered council members yet. Add members to build your team.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                {members.map((member) => (
                                    <Card key={member.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center mb-2 overflow-hidden border border-cyan-500/30">
                                                {member.image ? (
                                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-8 h-8" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{member.name}</h3>
                                                <p className="text-cyan-500 text-sm">{member.role}</p>
                                                <p className="text-gray-500 text-xs mt-1">{member.email}</p>
                                            </div>
                                            <div className="flex gap-2 w-full mt-2">
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('member', member)} className="flex-1 border-white/20 text-gray-300 hover:text-white">Edit</Button>
                                                <Button variant="ghost" size="sm" onClick={() => confirmDelete('member', member.id)} className="flex-1 text-red-500 hover:text-red-400">Remove</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Clubs Content */}
                    <TabsContent value="clubs" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Student Clubs</h2>
                            <Button onClick={() => openAddModal('club')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Register Club
                            </Button>
                        </div>
                        {clubs.length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Flag className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Student Clubs</h3>
                                <p className="text-[#64748B] italic max-w-sm">No clubs have been registered yet. Create clubs to engage the student community.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-8">
                                {clubs.map((club: any) => (
                                    <Card key={club.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                                                    <Flag className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{club.name}</h3>
                                                    <p className="text-sm text-gray-400">{club.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Lead: {club.lead} • {club.members} Members</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('club', club)} className="border-white/20 text-gray-300 hover:text-white">
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('club', club.id)} className="text-red-500 hover:bg-red-500/10">
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Events Content */}
                    <TabsContent value="events" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Upcoming Events</h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <select
                                    className="bg-[#111625] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] font-medium outline-none focus:border-[#0ea5e9]/50 transition-colors w-full sm:w-[200px]"
                                    value={eventFilter}
                                    onChange={(e) => setEventFilter(e.target.value as any)}
                                >
                                    <option value="All">All Events</option>
                                    <option value="President">Added by President</option>
                                    <option value="Council">Added by Council</option>
                                    <option value="Club Manager">Added by Clubs</option>
                                </select>
                                <Button onClick={() => openAddModal('event')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                    <Plus className="w-4 h-4 mr-2" /> Create Event
                                </Button>
                            </div>
                        </div>

                        {events.filter(e => eventFilter === 'All' ? true : e.addedByRole === eventFilter).length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Calendar className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Upcoming Events</h3>
                                <p className="text-[#64748B] italic max-w-sm">There are no events scheduled at the moment. Plan and create new events for the campus.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {events
                                    .filter(e => eventFilter === 'All' ? true : e.addedByRole === eventFilter)
                                    .map((event) => (
                                        <Card key={event.id} className="bg-white/5 border-white/10 group relative overflow-hidden">
                                            {event.image ? (
                                                <div className="h-32 w-full relative">
                                                    <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                                                    <div className="absolute bottom-2 left-4">
                                                        <Badge variant="outline" className="border-white/20 bg-black/50 backdrop-blur-md">{event.type}</Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                                            )}
                                            <CardContent className={`p-6 ${event.image ? 'pt-4' : 'pl-8'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    {!event.image && <Badge variant="outline" className="border-white/20">{event.type}</Badge>}
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
                                                {event.registrationLink && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-cyan-500 hover:text-cyan-400 font-medium">
                                                            <ExternalLink className="w-3 h-3" />
                                                            Registration Link
                                                        </a>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Elections Content */}
                    <TabsContent value="elections" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Elections</h2>
                            <Button onClick={() => openAddModal('election')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Schedule Election
                            </Button>
                        </div>
                        {elections.length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Vote className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Active Elections</h3>
                                <p className="text-[#64748B] italic max-w-sm">There are no ongoing or upcoming elections across the student body.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-8">
                                {elections.map((election) => (
                                    <Card key={election.id} className="bg-white/5 border-white/10">
                                        <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-bold">{election.title}</h3>
                                                    <Badge variant="outline" className={election.status === 'Ongoing' ? 'text-green-500 border-green-500' : 'text-gray-500 border-gray-500'}>{election.status}</Badge>
                                                </div>
                                                <p className="text-gray-400 mb-2">{election.description}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    {election.date}
                                                </div>

                                                {/* Results Section */}
                                                {election.candidates && election.candidates.length > 0 && (
                                                    <div className="mt-4 space-y-3">
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Results</h4>
                                                        <div className="space-y-2">
                                                            {election.candidates.map((candidate: any) => {
                                                                const totalVotes = election.candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
                                                                // Percentage based on total registered users
                                                                const percentage = totalUsers > 0 ? Math.round(((candidate.votes || 0) / totalUsers) * 100) : 0;
                                                                return (
                                                                    <div key={candidate.id} className="space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-300">{candidate.name}</span>
                                                                            <span className="font-mono text-cyan-500">{candidate.votes || 0} votes ({percentage}%)</span>
                                                                        </div>
                                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                                                                                style={{ width: `${percentage}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 self-start md:self-center">
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('election', election)} className="border-white/20 text-gray-300 hover:text-white mt-1 border">
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('election', election.id)} className="text-red-500 hover:bg-red-500/10">
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Achievements Content */}
                    <TabsContent value="achievements" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Hall of Fame</h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <select
                                    className="bg-[#111625] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] font-medium outline-none focus:border-[#0ea5e9]/50 transition-colors w-full sm:w-[200px]"
                                    value={achievementFilter}
                                    onChange={(e) => setAchievementFilter(e.target.value as any)}
                                >
                                    <option value="All">All Achievements</option>
                                    <option value="President">Added by President</option>
                                    <option value="Council">Added by Council</option>
                                    <option value="Club Manager">Added by Clubs</option>
                                </select>
                                <Button onClick={() => openAddModal('achievement')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto whitespace-nowrap">
                                    <Plus className="w-4 h-4 mr-2 md:mr-0 lg:mr-2" /> Add Achievement
                                </Button>
                            </div>
                        </div>

                        {achievements.filter(a => achievementFilter === 'All' ? true : a.addedByRole === achievementFilter).length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Trophy className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Achievements Found</h3>
                                <p className="text-[#64748B] italic max-w-sm">No student achievements have been recorded yet. Recognize student excellence by adding one.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {achievements
                                    .filter(a => achievementFilter === 'All' ? true : a.addedByRole === achievementFilter)
                                    .map((achievement) => (
                                        <Card key={achievement.id} className="bg-white/5 border-white/10 overflow-hidden">
                                            <div className="h-40 bg-zinc-900 relative">
                                                {achievement.image ? (
                                                    <img src={achievement.image} alt={achievement.title} className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-500">
                                                        <Trophy className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-black/50 text-white border-white/10 backdrop-blur-md">{achievement.category}</Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{achievement.title}</h3>
                                                        <p className="text-cyan-500 text-sm">{achievement.student}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 -mt-2 -mr-2">
                                                        <Button variant="ghost" size="sm" onClick={() => openAddModal('achievement', achievement)} className="text-gray-300 hover:text-white h-8 px-2">
                                                            Edit
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => confirmDelete('achievement', achievement.id)} className="text-red-500 hover:bg-red-500/10 h-8 w-8">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400 line-clamp-2">{achievement.description}</p>
                                                <div className="mt-4 text-xs text-gray-500">{achievement.date}</div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Complaints Content */}
                    <TabsContent value="complaints" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Student Complaints</h2>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-sm py-1.5 px-4 font-mono">
                                    {tickets.filter(t => t.status === 'Pending').length} PENDING
                                </Badge>
                                <Badge variant="outline" className="border-blue-500 text-blue-500 text-sm py-1.5 px-4 font-mono">
                                    {tickets.filter(t => t.status === 'In Progress').length} IN PROGRESS
                                </Badge>
                            </div>
                        </div>
                        {tickets.length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <AlertTriangle className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Complaints Logged</h3>
                                <p className="text-[#64748B] italic max-w-sm">No complaints or feedback have been submitted by the student body.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-8">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
                                        <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all">
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
                                                                        <ThumbsUp className="w-3 h-3 text-cyan-500" />
                                                                        {ticket.votes || 0} Votes
                                                                    </span>
                                                                    <Badge variant="outline" className="border-white/20 text-gray-400">
                                                                        {ticket.department}
                                                                    </Badge>
                                                                </div>
                                                                <h3 className="text-lg font-bold text-white">{ticket.subject}</h3>
                                                            </div>
                                                        </div>

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
                                                                    ticket.status === 'In Review' ? 'bg-cyan-500 text-white' :
                                                                        'bg-cyan-500 text-black'
                                                                }`}>
                                                                {ticket.status}
                                                            </Badge>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                {ticket.status !== 'In Progress' && ticket.status !== 'Completed' && (
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
                                                                {ticket.status !== 'Completed' && (
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
                                                                {ticket.status === 'Completed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-xs border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 col-span-2"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateTicketStatus(ticket.id, 'In Progress', 'Reopened by President');
                                                                        }}
                                                                    >
                                                                        Reopen
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Students Content */}
                    <TabsContent value="students" className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <Card className="flex-1 bg-white/5 border-white/10">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Total Users</p>
                                        <h3 className="text-3xl font-bold text-white">{users.length}</h3>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </CardContent>
                            </Card>
                            <Card className="flex-1 bg-white/5 border-white/10">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Suspended Users</p>
                                        <h3 className="text-3xl font-bold text-white">{users.filter(u => u.status === 'Suspended').length}</h3>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="grid gap-4">
                            {users.map((user) => (
                                <Card key={user.id} className="bg-white/5 border-white/10">
                                    <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold">{user.firstName} {user.lastName}</h3>
                                                    <Badge className={user.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                                                        {user.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                                <p className="text-xs text-gray-500">Joined: {user.joinedDate}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openAddModal('user', user)} className="border-white/20 text-gray-300 hover:text-white">
                                                Edit
                                            </Button>
                                            {user.status === 'Active' ? (
                                                <Button variant="outline" size="sm" onClick={() => setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Suspended' } : u))} className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                                                    Suspend
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Active' } : u))} className="border-green-500/20 text-green-500 hover:bg-green-500/10 hover:text-green-400">
                                                    Activate
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => confirmDelete('user', user.id)} className="text-red-500 hover:bg-red-500/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Feedback & Polls Content */}
                    <TabsContent value="polls" className="space-y-8">
                        {/* Polls Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Active Polls</h2>
                                <Button onClick={() => openAddModal('poll')} className="bg-cyan-500 text-black hover:bg-cyan-400"><Plus className="w-4 h-4 mr-2" /> New Poll</Button>
                            </div>
                            <div className="grid gap-4">
                                {polls.map((poll) => (
                                    <Card key={poll.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-6 flex justify-between items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg">{poll.question}</h3>
                                                    <Badge className={poll.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>{poll.status}</Badge>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">{poll.totalVotes} Votes • {poll.options.length} Options</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('poll', poll)} className="border-white/20 text-gray-300 hover:text-white">Edit</Button>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('poll', poll.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 className="w-5 h-5" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Surveys Section */}
                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Surveys</h2>
                                <Button onClick={() => openAddModal('survey')} className="bg-cyan-500 text-black hover:bg-cyan-400"><Plus className="w-4 h-4 mr-2" /> New Survey</Button>
                            </div>
                            <div className="grid gap-4">
                                {surveys.map((survey) => (
                                    <Card key={survey.id} className="bg-white/5 border-white/10">
                                        <CardContent className="p-6 flex justify-between items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg">{survey.title}</h3>
                                                    <Badge className={survey.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>{survey.status}</Badge>
                                                </div>
                                                <p className="text-sm text-gray-400">{survey.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">{survey.time} to complete • {survey.questions} Questions</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openAddModal('survey', survey)} className="border-white/20 text-gray-300 hover:text-white">Edit</Button>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('survey', survey.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 className="w-5 h-5" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Gallery Content */}
                    <TabsContent value="gallery" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-white">Manage Gallery</h2>
                            <Button onClick={() => openAddModal('gallery')} className="bg-[#0ea5e9] text-black hover:bg-[#38bdf8] font-bold tracking-wide rounded-lg px-6 py-2.5 h-auto transition-colors w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Add Image
                            </Button>
                        </div>
                        {galleryImages.length === 0 ? (
                            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center bg-[#111625]/20 mt-8 min-h-[400px]">
                                <Camera className="w-20 h-20 text-[#64748B] mb-8 opacity-20" />
                                <h3 className="text-2xl font-mono uppercase tracking-[0.2em] text-[#94a3b8] mb-4">No Images Found</h3>
                                <p className="text-[#64748B] italic max-w-sm">The gallery is currently empty. Upload photos to share moments with the student body.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {galleryImages.map((image) => (
                                    <Card key={image.id} className="bg-white/5 border-white/10 overflow-hidden group">
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={image.src}
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
                                {galleryImages.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-400">
                                        <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>No images in gallery</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* --- Modals --- */}

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
                                className="max-w-full max-h-[70vh] object-contain rounded-md"
                            />
                        )}
                    </div>
                </GlassModal>

                {/* Add Item Modal */}
                <GlassModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={`Add New ${addModalType}`}
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-white/20 hover:bg-white/10 hover:text-white">Cancel</Button>
                            <Button onClick={handleSave} className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
                                <CheckCircle className="w-4 h-4 mr-2" /> Save Item
                            </Button>
                        </>
                    }
                >
                    <form id="add-form" className="space-y-4" onSubmit={handleSave}>
                        {addModalType === 'announcement' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Title</label>
                                    <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50 transition-colors" placeholder="e.g. Semester Dates" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Content</label>
                                    <Textarea required value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50 transition-colors" placeholder="Announcement details..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Category</label>
                                    <select value={formData.category || 'General'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none">
                                        <option value="General">General</option>
                                        <option value="Academic">Academic</option>
                                        <option value="Event">Event</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Priority</label>
                                    <select value={formData.priority || 'Low'} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Link (Optional)</label>
                                    <Input value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50 transition-colors" placeholder="e.g. https://example.com" />
                                </div>
                            </>
                        )}

                        {addModalType === 'member' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                                    <Input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Role</label>
                                    <Input required value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" placeholder="e.g. Secretary" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Email</label>
                                    <Input type="email" required value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>

                                {/* Photo Upload Section */}
                                <div className="space-y-4 pt-2 border-t border-white/10">
                                    <label className="text-sm font-medium text-gray-300">Member Photo (Optional)</label>

                                    {!isCameraOpen && !formData.image && (
                                        <div className="flex gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('member-file-upload')?.click()}
                                                className="border-white/10 hover:bg-white/5 bg-black/50"
                                            >
                                                <input
                                                    id="member-file-upload"
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
                                                <Button type="button" onClick={() => capturePhoto(false)} className="bg-cyan-500 text-black hover:bg-cyan-400">
                                                    <Camera className="w-4 h-4 mr-2" /> Capture
                                                </Button>
                                                <Button type="button" onClick={stopCamera} variant="destructive" className="bg-red-500 hover:bg-red-600">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {formData.image && (
                                        <div className="relative inline-block">
                                            <img src={formData.image} alt="Member Preview" className="h-24 w-24 rounded-full border-2 border-cyan-500/50 object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(false)}
                                                className="absolute 0 0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                                                style={{ top: '0', right: '0' }}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {addModalType === 'user' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">First Name</label>
                                        <Input required value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-black/50 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Last Name</label>
                                        <Input required value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-black/50 border-white/10 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Email</label>
                                    <Input required value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-black/50 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Status</label>
                                    <select value={formData.status || 'Active'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none">
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </>

                        )}

                        {addModalType === 'poll' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Question</label>
                                    <Input required value={formData.question || ''} onChange={e => setFormData({ ...formData, question: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Status</label>
                                        <select value={formData.status || 'Active'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none">
                                            <option value="Active">Active</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Due Date</label>
                                        <Input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Options</label>
                                    <div className="space-y-2">
                                        {(formData.options || []).map((opt: any, idx: number) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOpts = [...(formData.options || [])];
                                                        newOpts[idx].text = e.target.value;
                                                        setFormData({ ...formData, options: newOpts });
                                                    }}
                                                    className="bg-black/50 border-white/10 text-white"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newOpts = formData.options.filter((_: any, i: number) => i !== idx);
                                                        setFormData({ ...formData, options: newOpts });
                                                    }}
                                                    className="text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, options: [...(formData.options || []), { id: Math.random().toString(36).substr(2, 9), text: '', votes: 0 }] })}
                                            className="border-white/10 text-gray-300 hover:text-white w-full"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Option
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {addModalType === 'survey' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Title</label>
                                    <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <Input required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Est. Time</label>
                                        <Input required value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="bg-black/50 border-white/10 text-white" placeholder="e.g. 2 mins" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">No. of Questions</label>
                                        <Input type="number" required value={formData.questions || ''} onChange={e => setFormData({ ...formData, questions: parseInt(e.target.value) || 0 })} className="bg-black/50 border-white/10 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">External Link (Optional)</label>
                                    <Input type="url" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="bg-black/50 border-white/10 text-white" placeholder="https://..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Status</label>
                                        <select value={formData.status || 'Active'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none">
                                            <option value="Active">Active</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Due Date</label>
                                        <Input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                </div>
                            </>
                        )}

                        {addModalType === 'club' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Club Name</label>
                                    <Input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Club Official Email <span className="text-red-500">*</span></label>
                                    <Input required type="email" value={formData.clubEmail || ''} onChange={e => setFormData({ ...formData, clubEmail: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" placeholder="club@college.edu" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <Input required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Lead Student</label>
                                    <Input required value={formData.lead || ''} onChange={e => setFormData({ ...formData, lead: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Club Website (Optional)</label>
                                    <Input type="url" placeholder="https://" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-4 pt-2 border-t border-white/10">
                                    <label className="text-sm font-medium text-gray-300">Club Logo (Optional)</label>

                                    {!isCameraOpen && !formData.image && (
                                        <div className="flex gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('club-file-upload')?.click()}
                                                className="border-white/10 hover:bg-white/5 bg-black/50"
                                            >
                                                <input
                                                    id="club-file-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileUpload(e)}
                                                />
                                                <Upload className="w-4 h-4 mr-2" /> Upload Logo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => startCamera()}
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
                                                <Button type="button" onClick={() => capturePhoto(false)} className="bg-cyan-500 text-black hover:bg-cyan-400">
                                                    <Camera className="w-4 h-4 mr-2" /> Capture
                                                </Button>
                                                <Button type="button" onClick={stopCamera} variant="destructive" className="bg-red-500 hover:bg-red-600">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {formData.image && (
                                        <div className="relative inline-block">
                                            <img src={formData.image} alt="Club Logo" className="h-24 w-24 rounded-full border-2 border-cyan-500/50 object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(false)}
                                                className="absolute 0 0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                                                style={{ top: '0', right: '0' }}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
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
                                    <Input type="date" required value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Location</label>
                                    <Input required value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Type</label>
                                    <select value={formData.type || 'Social'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none">
                                        <option value="Social">Social</option>
                                        <option value="Academic">Academic</option>
                                        <option value="Sports">Sports</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Registration Link (Optional)</label>
                                    <Input type="url" placeholder="https://forms.gle/..." value={formData.registrationLink || ''} onChange={e => setFormData({ ...formData, registrationLink: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                            </>
                        )}

                        {addModalType === 'election' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Election Title</label>
                                    <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <Textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Start Date</label>
                                        <Input type="date" required value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Start Time</label>
                                        <Input type="time" required value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">End Date</label>
                                        <Input type="date" required value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">End Time</label>
                                        <Input type="time" required value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" style={{ colorScheme: 'dark' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-gray-300">Candidates</label>
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                                            <div className="flex gap-2">
                                                <Input
                                                    id="candidate-input"
                                                    value={tempCandidateName}
                                                    onChange={(e) => setTempCandidateName(e.target.value)}
                                                    placeholder="Candidate Name"
                                                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        const val = tempCandidateName.trim();
                                                        if (val) {
                                                            const currentCandidates = formData.candidates || [];
                                                            setFormData({
                                                                ...formData,
                                                                candidates: [...currentCandidates, {
                                                                    id: Math.random().toString(36).slice(2, 9),
                                                                    name: val,
                                                                    votes: 0,
                                                                    image: tempCandidateImage
                                                                }]
                                                            });
                                                            setTempCandidateName('');
                                                            setTempCandidateImage(undefined);
                                                        }
                                                    }}
                                                    className="bg-cyan-500 text-black hover:bg-cyan-400"
                                                >
                                                    <Plus className="w-4 h-4" /> Add
                                                </Button>
                                            </div>

                                            {/* Candidate Photo Upload */}
                                            <div>
                                                {/* Photo Buttons */}
                                                {!isCameraOpen && !tempCandidateImage && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => document.getElementById('candidate-file-upload')?.click()}
                                                            className="text-xs border-white/10 hover:bg-white/5 bg-black/50"
                                                        >
                                                            <input
                                                                id="candidate-file-upload"
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, true)}
                                                            />
                                                            <Upload className="w-3 h-3 mr-2" /> Upload Photo
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={startCamera}
                                                            className="text-xs border-white/10 hover:bg-white/5 bg-black/50"
                                                        >
                                                            <Camera className="w-3 h-3 mr-2" /> Camera
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Camera View */}
                                                {isCameraOpen && (
                                                    <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden max-w-xs mx-auto mt-2">
                                                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                                                        <canvas ref={canvasRef} className="hidden" />
                                                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                                            <Button size="sm" type="button" onClick={() => capturePhoto(true)} className="bg-cyan-500 text-black hover:bg-cyan-400 text-xs">
                                                                Capture
                                                            </Button>
                                                            <Button size="sm" type="button" onClick={stopCamera} variant="destructive" className="bg-red-500 hover:bg-red-600 text-xs">
                                                                Close
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Image Preview */}
                                                {tempCandidateImage && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={tempCandidateImage} alt="Candidate Preview" className="h-16 w-16 rounded-full border border-cyan-500/50 object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(true)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-lg"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        <div className="space-y-2 mt-2">
                                            {(formData.candidates || []).map((cand: any) => (
                                                <div key={cand.id} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        {cand.image && <img src={cand.image} alt={cand.name} className="w-6 h-6 rounded-full object-cover" />}
                                                        <span className="text-sm">{cand.name}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const currentCandidates = formData.candidates || [];
                                                            setFormData({
                                                                ...formData,
                                                                candidates: currentCandidates.filter((c: any) => c.id !== cand.id)
                                                            });
                                                        }}
                                                        className="text-red-500 h-6 w-6 p-0 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {addModalType === 'achievement' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Achievement Title</label>
                                    <Input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Student/Team Name</label>
                                    <Input required value={formData.student || ''} onChange={e => setFormData({ ...formData, student: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <Textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Category</label>
                                    <select value={formData.category || 'Academic'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:border-cyan-500/50 outline-none">
                                        <option value="Academic">Academic</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Research">Research</option>
                                        <option value="Cultural">Cultural</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Date</label>
                                    <Input required value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50" placeholder="e.g. March 2025" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Image (Max 500KB)</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 512000) { // 500KB limit
                                                    alert("File size exceeds 500KB. Please upload a smaller image.");
                                                    e.target.value = ''; // Clear input
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setCroppingImage(reader.result as string);
                                                    setIsCandidateCrop(false);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50 file:bg-cyan-500 file:text-black file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 file:text-sm file:font-semibold hover:file:bg-cyan-400"
                                    />
                                    {formData.image && (
                                        <p className="text-xs text-green-500 mt-1">Image loaded successfully!</p>
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
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Item
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
                                This action cannot be undone. This default item will be permanently removed from the database.
                            </p>
                        </div>
                    </div>
                </GlassModal>

            </div >

            {/* View Complaint Details Modal */}
            < GlassModal
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                title="Complaint Details"
                className="max-w-2xl"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setSelectedTicket(null)} className="border-white/20 hover:bg-white/10 hover:text-white">Close</Button>
                        {
                            selectedTicket?.status !== 'In Progress' && selectedTicket?.status !== 'Completed' && (
                                <Button
                                    onClick={() => {
                                        updateTicketStatus(selectedTicket.id, 'In Progress');
                                        setSelectedTicket(null);
                                    }}
                                    className="bg-blue-600 text-white hover:bg-blue-700 font-bold border-none"
                                >
                                    Start Progress
                                </Button>
                            )
                        }
                        {
                            selectedTicket?.status !== 'Completed' && (
                                <Button
                                    onClick={() => {
                                        updateTicketStatus(selectedTicket.id, 'Completed');
                                        setSelectedTicket(null);
                                    }}
                                    className="bg-green-600 text-white hover:bg-green-700 font-bold border-none"
                                >
                                    Mark Resolved
                                </Button>
                            )
                        }
                    </>
                }
            >
                {selectedTicket && (
                    <div className="space-y-6 text-sm">
                        <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-white/10">
                            <div>
                                <div className="text-gray-500 font-mono text-xs mb-1">Ticket ID: {selectedTicket.id}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.subject}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={`${selectedTicket.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                                        selectedTicket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                                            selectedTicket.status === 'In Review' ? 'bg-cyan-500/20 text-cyan-500' :
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
                                <div className="flex items-center justify-end gap-1 mt-2 text-cyan-500">
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
                                    {/* Use a regular img tag inside the modal for simplicity, allowing it to scale naturally */}
                                    <img src={selectedTicket.image} alt="Ticket Attachment" className="max-w-full h-auto max-h-[400px] object-contain mx-auto" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </GlassModal >

            {
                croppingImage && (
                    <ImageCropper
                        image={croppingImage!}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setCroppingImage(null)}
                        aspectRatio={isCandidateCrop ? 1 : (addModalType === 'event' || addModalType === 'achievement') ? 16 / 9 : 1}
                    />
                )
            }
        </div >
    );
}

export default function PresidentDashboard() {
    return (
        <TicketProvider>
            <PresidentDashboardContent />
        </TicketProvider>
    );
}
