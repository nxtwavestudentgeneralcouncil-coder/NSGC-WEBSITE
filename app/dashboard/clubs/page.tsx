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
    Megaphone, Calendar, Plus, Trash2, LogOut, Star, Flag, Users, Globe, Camera
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
        const role = localStorage.getItem('userRole');
        if (role === 'clubs') {
            setIsAuthorized(true);
        } else if (role === 'president') {
            router.push('/dashboard/president');
        } else if (role === 'admin') {
            router.push('/dashboard/admin');
        } else if (role === 'student') {
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
                setGalleryImages(prev => updateState(prev, {
                    ...newData,
                    src: formData.src || '',
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
        <div className="min-h-screen bg-black text-white pt-24 md:pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
                                Club Manager
                            </h1>
                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">Lead Access</Badge>
                        </div>
                        <p className="text-gray-400">Managing <strong className="text-white">{currentClubName}</strong> resources and updates.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                            onClick={() => {
                                // Simulate Logout
                                router.push('/');
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Exit Dashboard
                        </Button>
                    </div>
                </div>

                {/* Dashboard Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Club Members</p>
                                <h3 className="text-2xl font-bold">{currentClubDetails?.members || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Active Events</p>
                                <h3 className="text-2xl font-bold">{clubEvents.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Megaphone className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Announcements</p>
                                <h3 className="text-2xl font-bold">{clubAnnouncements.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sub Header for Profile */}
                {currentClubDetails ? (
                    <div className="bg-gradient-to-r from-teal-900/30 to-black border border-white/5 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 text-teal-500">
                            <Flag className="w-10 h-10" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-2">{currentClubDetails.name}</h2>
                            <p className="text-gray-400 text-sm max-w-2xl mb-4">{currentClubDetails.description}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" /> Lead: {currentClubDetails.lead}
                                </div>
                                {currentClubDetails.website && (
                                    <div className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
                                        <a href={currentClubDetails.website} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">Website</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-black/50 border border-teal-500/20 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 text-teal-500">
                            <Flag className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-xl font-bold mb-1 text-teal-400">Club Profile Incomplete</h2>
                            <p className="text-gray-400 text-sm mb-0">
                                Your club does not have a comprehensive profile on record. Once your President or Council sets it up, it will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="overflow-x-auto pb-2">
                        <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap md:flex-nowrap min-w-max">
                            <TabsTrigger value="events" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"><Calendar className="w-4 h-4 mr-2" /> Manage Events</TabsTrigger>
                            <TabsTrigger value="announcements" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"><Megaphone className="w-4 h-4 mr-2" /> Broadcast Announcements</TabsTrigger>
                            <TabsTrigger value="team" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"><Users className="w-4 h-4 mr-2" /> Manage Team</TabsTrigger>
                            <TabsTrigger value="gallery" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"><Camera className="w-4 h-4 mr-2" /> Gallery</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Events Content */}
                    <TabsContent value="events" className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold">Your Events</h2>
                            <Button onClick={() => openAddModal('event')} className="bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20"><Plus className="w-4 h-4 mr-2" /> Post New Event</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clubEvents.map((event) => (
                                <Card key={event.id} className="bg-white/5 border-white/10 group relative overflow-hidden hover:border-teal-500/30 transition-all duration-300">
                                    {event.image ? (
                                        <div className="h-32 w-full relative">
                                            <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                                            <div className="absolute bottom-2 left-4">
                                                <Badge variant="outline" className="border-white/20 bg-black/50 backdrop-blur-md">{event.type}</Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
                                    )}
                                    <CardContent className={`p-6 ${event.image ? 'pt-4' : 'pl-8'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            {!event.image && <Badge variant="outline" className="border-white/20 bg-black/40">{event.type}</Badge>}
                                            <div className="flex items-center gap-1 -mt-2 -mr-2 ml-auto z-10 relative bg-black/40 p-1 rounded-md border border-white/10 backdrop-blur-md">
                                                <Button variant="ghost" size="sm" onClick={() => openAddModal('event', event)} className="text-gray-300 hover:text-white h-7 px-2 text-xs">
                                                    Edit
                                                </Button>
                                                <div className="w-px h-4 bg-white/20 mx-1"></div>
                                                <Button variant="ghost" size="icon" onClick={() => confirmDelete('event', event.id)} className="text-red-500 hover:bg-red-500/20 h-7 w-7 rounded">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-white">{event.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-1">
                                            <div className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-md">
                                                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                                                <span>{event.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-md">
                                                <Star className="w-3.5 h-3.5 text-yellow-500" />
                                                <span>{event.location}</span>
                                            </div>
                                        </div>
                                        {event.registrationLink && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <a href={event.registrationLink.startsWith('http') ? event.registrationLink : `https://${event.registrationLink}`} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="w-full border-teal-500/30 text-teal-400 hover:bg-teal-500/10">Follow Registration Link</Button>
                                                </a>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {clubEvents.length === 0 && (
                                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-300">No events found</h3>
                                    <p className="text-sm text-gray-500 mt-1">Start organizing activities for your club members.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Announcements Content */}
                    <TabsContent value="announcements" className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold">Your Announcements</h2>
                            <Button onClick={() => openAddModal('announcement')} className="bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20"><Plus className="w-4 h-4 mr-2" /> New Broadcast</Button>
                        </div>
                        <div className="grid gap-4">
                            {clubAnnouncements.map((item) => (
                                <Card key={item.id} className="bg-white/5 border-white/10 hover:border-teal-500/50 transition-colors">
                                    <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <h3 className="text-xl font-bold">{item.title}</h3>
                                                <Badge variant="outline" className={item.priority === 'High' ? 'text-red-400 border-red-500/50 bg-red-500/10' : item.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' : 'text-blue-400 border-blue-500/50 bg-blue-500/10'}>{item.priority}</Badge>
                                                <Badge variant="secondary" className="bg-white/10 text-gray-300">{item.category}</Badge>
                                            </div>
                                            <p className="text-gray-300 mb-4 bg-black/30 p-4 rounded-lg border border-white/5 leading-relaxed">{item.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-[120px]">
                                            <Button variant="outline" size="sm" onClick={() => openAddModal('announcement', item)} className="w-full border-white/20 text-gray-300 hover:text-white bg-black/40">
                                                Edit Post
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => confirmDelete('announcement', item.id)} className="w-full border-red-500/20 text-red-400 hover:bg-red-500/20 bg-black/40">
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {clubAnnouncements.length === 0 && (
                                <div className="py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-300">No announcements yet</h3>
                                    <p className="text-sm text-gray-500 mt-1">Keep your club members informed with updates here.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Team Members Content */}
                    <TabsContent value="team" className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold">Your Team Members</h2>
                            <Button onClick={() => openAddModal('member')} className="bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {(currentClubDetails?.teamMembers || []).map((member) => (
                                <Card key={member.id} className="bg-white/5 border-white/10 hover:border-teal-500/50 transition-colors">
                                    <div className="p-6 flex flex-col items-center text-center relative group">
                                        <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openAddModal('member', member)} className="h-7 w-7 bg-black/50 text-gray-300 hover:text-white rounded">
                                                <Star className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => confirmDelete('member', member.id)} className="h-7 w-7 bg-black/50 text-red-400 hover:bg-red-500/20 rounded">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <div className="w-20 h-20 rounded-full mb-4 bg-white/10 overflow-hidden flex items-center justify-center">
                                            {member.image ? (
                                                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-8 h-8 text-teal-500/50" />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                                        <Badge variant="outline" className="border-teal-500/30 text-teal-400 bg-teal-500/10 mb-3">{member.role}</Badge>
                                    </div>
                                </Card>
                            ))}
                            {(!currentClubDetails?.teamMembers || currentClubDetails.teamMembers.length === 0) && (
                                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-300">No team members added</h3>
                                    <p className="text-sm text-gray-500 mt-1">Add core team members and their roles here.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Gallery Content */}
                    <TabsContent value="gallery" className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold">Manage Gallery</h2>
                            <Button onClick={() => openAddModal('gallery')} className="bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20">
                                <Plus className="w-4 h-4 mr-2" /> Add Image
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {galleryImages.filter(g => g.addedByRole === `Club Manager (${currentClubName})`).map((image) => (
                                <Card key={image.id} className="bg-white/5 border-white/10 overflow-hidden group hover:border-teal-500/50 transition-colors">
                                    <div className="relative h-64 overflow-hidden bg-black/50">
                                        <img
                                            src={image.src || ''}
                                            alt={image.alt || ''}
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
                                    <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                                        <Badge variant="outline" className="border-teal-500/30 text-teal-400 bg-teal-500/10 text-xs">
                                            Span: {image.span.split(' ')[0].replace('col-span-', '')}x{image.span.split(' ')[1].replace('row-span-', '')}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                            {galleryImages.filter(g => g.addedByRole === `Club Manager (${currentClubName})`).length === 0 && (
                                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-300">No images in your gallery</h3>
                                    <p className="text-sm text-gray-500 mt-1">Share visual updates and moments here.</p>
                                </div>
                            )}
                        </div>
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
                                                            type="text"
                                                            value={formData.date || ''}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            required
                                                            className="bg-black/50 border-white/10"
                                                            placeholder="e.g. Oct 24, 10:00 AM"
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

                                                <div className="space-y-2 pt-2 border-t border-white/10">
                                                    <label className="text-sm font-medium text-gray-300">Image URL (Optional)</label>
                                                    <p className="text-xs text-gray-500 mb-2">Provide a descriptive image link to make your event stand out.</p>
                                                    <Input
                                                        value={formData.image || ''}
                                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                        className="bg-black/50 border-white/10"
                                                        placeholder="https://example.com/poster.jpg"
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
