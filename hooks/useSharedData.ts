'use client';

import { useState, useEffect } from 'react';

// --- Types ---
export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    priority: 'Low' | 'Medium' | 'High';
    category: 'General' | 'Academic' | 'Event' | 'Emergency';
    link?: string; // Optional external link
    author?: string; // Optional author/club name
    addedByRole?: string;
}

export interface CouncilMember {
    id: string;
    name: string;
    role: string;
    email: string;
    status: 'Active' | 'Inactive';
    image?: string; // Base64 image string
}

export interface ClubTeamMember {
    id: string;
    name: string;
    role: string;
    image?: string;
}

export interface Club {
    id: string;
    name: string;
    description: string;
    lead: string;
    members: number;
    teamMembers?: ClubTeamMember[];
    image?: string; // Base64 image string
    website?: string;
}

export interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    type: 'Academic' | 'Social' | 'Sports';
    image?: string; // Base64 image string
    registrationLink?: string; // Optional registration link
    organizer?: string; // Optional organizer/club name
    addedByRole?: string;
    participants?: number;
    time?: string;
}

export interface Candidate {
    id: string;
    name: string;
    votes: number;
    image?: string; // Base64 image string
}

export interface Election {
    id: string;
    title: string;
    date: string;
    status: 'Upcoming' | 'Ongoing' | 'Completed';
    description: string;
    candidates: Candidate[];
}

export interface Achievement {
    id: string;
    student: string;
    title: string;
    category: 'Academic' | 'Sports' | 'Research' | 'Cultural';
    date: string;
    description: string;
    image?: string; // Optional image URL
    addedByRole?: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: 'Active' | 'Suspended';
    joinedDate: string;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string; // Changed to string for consistency with UUIDs
    question: string;
    options: PollOption[];
    totalVotes: number;
    userVoted: boolean; // Note: In a real backend, this would be per-user. For local demo, it's global.
    userChoice?: string;
    status: 'Active' | 'Closed';
    dueDate?: string;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    questions: number; // Placeholder for now
    time: string; // e.g. "2 mins"
    link?: string; // Optional external link
    status: 'Active' | 'Closed';
    dueDate?: string;
}

export interface GalleryImage {
    id: string;
    src: string; // Base64 image string or URL
    alt: string; // Title or description
    span: string; // CSS grid span (e.g., 'col-span-1 row-span-1')
    addedByRole?: string; // Track who uploaded it
    dateAdded?: string;
}

// Default Data (Empty)
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [];
const DEFAULT_MEMBERS: CouncilMember[] = [];
const DEFAULT_CLUBS: Club[] = [];
const DEFAULT_EVENTS: Event[] = [];
const DEFAULT_ELECTIONS: Election[] = [];
const DEFAULT_ACHIEVEMENTS: Achievement[] = [];
const DEFAULT_USERS: User[] = [];
const DEFAULT_POLLS: Poll[] = [];
const DEFAULT_SURVEYS: Survey[] = [];
const DEFAULT_GALLERY: GalleryImage[] = [
    { id: "g1", src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop", alt: "Convocation 2024", span: "col-span-2 row-span-2" },
    { id: "g2", src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=400&fit=crop", alt: "Tech Fest", span: "col-span-1 row-span-1" },
    { id: "g3", src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop", alt: "Hackathon", span: "col-span-1 row-span-1" },
    { id: "g4", src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop", alt: "Cultural Night", span: "col-span-2 row-span-1" },
    { id: "g5", src: "https://images.unsplash.com/photo-1475721027767-p42f563d6ce9?w=400&h=800&fit=crop", alt: "Sports Meet", span: "col-span-1 row-span-2" },
    { id: "g6", src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=400&fit=crop", alt: "Workshop", span: "col-span-1 row-span-1" },
    { id: "g7", src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop", alt: "Seminar", span: "col-span-1 row-span-1" },
];

export function useSharedData() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [members, setMembers] = useState<CouncilMember[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [elections, setElections] = useState<Election[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]); // "Feedback" forms
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Helper to read current data
    const loadAllData = () => {
        // console.log('useSharedData: Loading all data...');
        const load = (key: string, defaultData: any, setter: (data: any) => void) => {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    // console.log(`useSharedData: Loaded ${key}`, JSON.parse(stored));
                    setter(JSON.parse(stored));
                } catch (e) {
                    console.error(`Failed to parse ${key}`, e);
                    setter(defaultData);
                }
            } else {
                // console.log(`useSharedData: No data for ${key}, using default`);
                setter(defaultData);
            }
        };

        load('nsgc_v3_announcements', DEFAULT_ANNOUNCEMENTS, setAnnouncements);
        load('nsgc_v3_members', DEFAULT_MEMBERS, setMembers);
        load('nsgc_v3_clubs', DEFAULT_CLUBS, setClubs);
        load('nsgc_v3_events', DEFAULT_EVENTS, setEvents);
        load('nsgc_v3_elections', DEFAULT_ELECTIONS, setElections);
        load('nsgc_v3_achievements', DEFAULT_ACHIEVEMENTS, setAchievements);
        load('nsgc_v3_users', DEFAULT_USERS, setUsers);
        load('nsgc_v3_totalUsers', 1250, setTotalUsers); // Might want to change this to actual count later
        load('nsgc_v3_polls', DEFAULT_POLLS, setPolls);
        load('nsgc_v3_surveys', DEFAULT_SURVEYS, setSurveys);
        
        // Filter out gallery images with empty src (safety net for corrupt dynamic data)
        const loadGallery = (key: string, defaultData: GalleryImage[], setter: (data: GalleryImage[]) => void) => {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const filtered = Array.isArray(parsed) 
                        ? parsed.filter((img: GalleryImage) => img.src && img.src.trim() !== '')
                        : defaultData;
                    setter(filtered);
                } catch (e) {
                    console.error(`Failed to parse ${key}`, e);
                    setter(defaultData);
                }
            } else {
                setter(defaultData);
            }
        };
        loadGallery('nsgc_v3_gallery', DEFAULT_GALLERY, setGalleryImages);

        // Load Total Users count - Deprecated in favor of users.length but kept for backward compatibility if needed
        const storedUsersCount = localStorage.getItem('nsgc_users_count');
        setTotalUsers(storedUsersCount ? JSON.parse(storedUsersCount) : 50); // Default to a baseline if empty for demo
    };

    // Initial Load & Event Listeners
    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadAllData();
            setIsLoaded(true);

            // Listen for cross-tab changes
            const handleStorageChange = (e: StorageEvent) => {
                // console.log('useSharedData: Storage event received', e.key);
                if (e.key?.startsWith('nsgc_')) {
                    loadAllData();
                }
            };

            // Listen for same-tab changes (custom event)
            const handleCustomUpdate = () => {
                // console.log('useSharedData: Custom update event received');
                loadAllData();
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('nsgc-data-update', handleCustomUpdate);

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('nsgc-data-update', handleCustomUpdate);
            };
        }
    }, []);

    // Save helpers that also dispatch events
    const updateAnnouncements = (newData: Announcement[] | ((prev: Announcement[]) => Announcement[])) => {
        setAnnouncements(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_announcements', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateMembers = (newData: CouncilMember[] | ((prev: CouncilMember[]) => CouncilMember[])) => {
        setMembers(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_members', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateClubs = (newData: Club[] | ((prev: Club[]) => Club[])) => {
        setClubs(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_clubs', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateEvents = (newData: Event[] | ((prev: Event[]) => Event[])) => {
        setEvents(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_events', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateElections = (newData: Election[] | ((prev: Election[]) => Election[])) => {
        setElections(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_elections', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateAchievements = (newData: Achievement[] | ((prev: Achievement[]) => Achievement[])) => {
        setAchievements(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_achievements', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateUsers = (newData: User[] | ((prev: User[]) => User[])) => {
        setUsers(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_users', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updatePolls = (newData: Poll[] | ((prev: Poll[]) => Poll[])) => {
        setPolls(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_polls', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateSurveys = (newData: Survey[] | ((prev: Survey[]) => Survey[])) => {
        setSurveys(prev => {
            const updated = typeof newData === 'function' ? newData(prev) : newData;
            localStorage.setItem('nsgc_v3_surveys', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    const updateGalleryImages = (newData: GalleryImage[] | ((prev: GalleryImage[]) => GalleryImage[])) => {
        setGalleryImages(prev => {
            const updatedRaw = typeof newData === 'function' ? newData(prev) : newData;
            // Filter out any images with empty src before saving
            const updated = updatedRaw.filter(img => img.src && img.src.trim() !== '');
            localStorage.setItem('nsgc_v3_gallery', JSON.stringify(updated));
            window.dispatchEvent(new Event('nsgc-data-update'));
            return updated;
        });
    };

    return {
        announcements, setAnnouncements: updateAnnouncements,
        members, setMembers: updateMembers,
        clubs, setClubs: updateClubs,
        events, setEvents: updateEvents,
        elections, setElections: updateElections,
        achievements, setAchievements: updateAchievements,
        users, setUsers: updateUsers,
        polls, setPolls: updatePolls,
        surveys, setSurveys: updateSurveys,
        galleryImages, setGalleryImages: updateGalleryImages,
        isLoaded,
        totalUsers
    };
}
