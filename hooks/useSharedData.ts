'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';
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
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
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
const DEFAULT_GALLERY: GalleryImage[] = [];

// --- GraphQL Queries (kept for reference but no longer actively used for fetching) ---
// Announcements and Events are now fetched via the API route /api/v1/nhost/get-dashboard-data
// which uses the admin secret, bypassing Hasura role-based permissions.

export const INSERT_ANNOUNCEMENT = gql`
  mutation InsertAnnouncement($title: String!, $content: String!, $category: String!) {
    insert_announcements_one(object: {
      title: $title,
      content: $content,
      category: $category,
      is_active: true
    }) {
      id
    }
  }
`;

export const INSERT_EVENT = gql`
  mutation InsertEvent($title: String!, $description: String!, $event_date: timestamptz!, $venue: String!, $organizer_type: String!) {
    insert_events_one(object: {
      title: $title, 
      description: $description, 
      event_date: $event_date, 
      venue: $venue, 
      organizer_type: $organizer_type
    }) {
      id
    }
  }
`;

export function useSharedData() {
    const user = useUserData();

    // State for API-fetched data
    const [apiAnnouncements, setApiAnnouncements] = useState<Announcement[]>([]);
    const [apiEvents, setApiEvents] = useState<Event[]>([]);
    const [apiLoading, setApiLoading] = useState(true);

    // Local State Variables (for features not yet migrated to Nhost DB)
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [members, setMembers] = useState<CouncilMember[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [elections, setElections] = useState<Election[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch data from API route (uses admin secret, bypasses Hasura role permissions)
    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-dashboard-data');
            const data = await res.json();

            // Map announcements
            const mappedAnnouncements: Announcement[] = (data.announcements || []).map((a: any) => ({
                id: a.id,
                title: a.title,
                content: a.content,
                category: a.category,
                date: new Date(a.created_at).toISOString().split('T')[0],
                priority: 'Medium',
                addedByRole: 'Council'
            }));
            setApiAnnouncements(mappedAnnouncements);

            // Map events
            const mappedEvents: Event[] = (data.events || []).map((e: any) => ({
                id: e.id,
                name: e.title,
                date: new Date(e.event_date).toISOString().split('T')[0],
                location: e.venue,
                type: e.organizer_type === 'council' ? 'Academic' as const : 'Social' as const,
                addedByRole: e.organizer_type === 'council' ? 'Council' : 'Club Manager',
                registrationLink: e.registration_link || ''
            }));
            setApiEvents(mappedEvents);

            // Map clubs 
            if (data.clubs) {
                const mappedClubs: Club[] = data.clubs.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    description: c.description || '',
                    lead: '',
                    members: 0,
                    image: c.logo_url,
                    website: ''
                }));
                setClubs(mappedClubs);
            }

            // Map elections
            // Map elections
            if (data.elections) {
                const mappedElections: Election[] = data.elections.map((el: any) => {
                    let description = el.description || '';
                    let startDate = '';
                    let startTime = '';
                    let endDate = '';
                    let endTime = '';
                    let status: 'Upcoming' | 'Ongoing' | 'Completed' = 'Upcoming';

                    try {
                        const parsed = JSON.parse(el.description);
                        if (parsed && typeof parsed === 'object' && parsed.description) {
                            description = parsed.description;
                            startDate = parsed.startDate || '';
                            startTime = parsed.startTime || '';
                            endDate = parsed.endDate || '';
                            endTime = parsed.endTime || '';
                        }
                    } catch (e) {
                        // Not valid JSON, fallback to raw description
                    }

                    if (startDate && endDate) {
                        const now = new Date();
                        const start = new Date(`${startDate}T${startTime || '00:00'}`);
                        const end = new Date(`${endDate}T${endTime || '23:59'}`);
                        
                        if (now < start) {
                            status = 'Upcoming';
                        } else if (now >= start && now <= end) {
                            status = 'Ongoing';
                        } else {
                            status = 'Completed';
                        }
                    } else {
                        status = 'Ongoing'; // Fallback for old data
                    }

                    return {
                        id: el.id,
                        title: el.title,
                        date: el.date ? new Date(el.date).toISOString().split('T')[0] : '',
                        status,
                        description,
                        startDate,
                        startTime,
                        endDate,
                        endTime,
                        candidates: (el.candidates || []).map((c: any) => ({
                            id: c.id || Math.random().toString(36).substr(2, 9),
                            name: c.name,
                            votes: c.votes || 0,
                            image: c.image || ''
                        }))
                    };
                });
                setElections(mappedElections);
            }

            // Map council members
            if (data.council_members) {
                const mappedMembers: CouncilMember[] = data.council_members.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    role: m.role || '',
                    email: m.email || '',
                    status: m.status || 'Active',
                    image: m.image || ''
                }));
                setMembers(mappedMembers);
            }

            // Map achievements
            if (data.achievements) {
                const mappedAchievements: Achievement[] = data.achievements.map((a: any) => ({
                    id: a.id,
                    student: a.student_id || '',
                    title: a.title,
                    category: a.category || 'Academic',
                    date: a.achievement_date ? new Date(a.achievement_date).toISOString().split('T')[0] : '',
                    description: a.description || '',
                    image: a.image_url || ''
                }));
                setAchievements(mappedAchievements);
            }

            // Map polls
            if (data.polls) {
                const mappedPolls: Poll[] = data.polls.map((p: any) => ({
                    id: p.id,
                    question: p.question,
                    options: Array.isArray(p.options) ? p.options.map((o: any) => ({
                        id: o.id || Math.random().toString(36).substr(2, 9),
                        text: o.text || o,
                        votes: o.votes || 0
                    })) : [],
                    totalVotes: 0,
                    userVoted: false,
                    status: p.is_active ? 'Active' as const : 'Closed' as const,
                    dueDate: p.end_date || ''
                }));
                setPolls(mappedPolls);
            }

            // Map surveys
            if (data.surveys) {
                const mappedSurveys: Survey[] = data.surveys.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    description: s.description || '',
                    questions: 0,
                    time: s.time || '',
                    link: s.link || '',
                    status: s.status || 'Active'
                }));
                setSurveys(mappedSurveys);
            }

            // Map gallery images
            if (data.gallery_images) {
                const mappedGallery: GalleryImage[] = data.gallery_images.map((g: any) => ({
                    id: g.id,
                    src: g.src,
                    alt: g.alt || '',
                    span: g.span || 'col-span-1 row-span-1',
                    addedByRole: g.added_by_role || '',
                    dateAdded: g.date_added || ''
                }));
                setGalleryImages(mappedGallery);
            }

            setApiLoading(false);
        } catch (e) {
            console.error('Failed to fetch dashboard data:', e);
            setApiLoading(false);
        }
    };

    const refetchAnnouncements = () => fetchDashboardData();
    const refetchEvents = () => fetchDashboardData();

    // Helper to read current data from localStorage
    const loadLocalData = () => {
        // Try loading from localStorage first to persist data across reloads during prototyping
        try {
            const savedMembers = localStorage.getItem('nsgc_members');
            if (savedMembers) {
                setMembers(JSON.parse(savedMembers));
            }
        } catch (e) {
            console.error('Failed to load local storage data', e);
        }
    };

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadLocalData();
            fetchDashboardData();
            setIsLoaded(true);
        }
    }, []);

    // Save helpers
    const updateAnnouncements = (newData: Announcement[] | ((prev: Announcement[]) => Announcement[])) => {
        setAnnouncements(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateMembers = (newData: CouncilMember[] | ((prev: CouncilMember[]) => CouncilMember[])) => {
        setMembers(prev => {
            const nextState = typeof newData === 'function' ? newData(prev) : newData;
            try {
                localStorage.setItem('nsgc_members', JSON.stringify(nextState));
            } catch (e) {
                console.error("Failed to save members to local storage", e);
            }
            return nextState;
        });
    };

    const updateClubs = (newData: Club[] | ((prev: Club[]) => Club[])) => {
        setClubs(prev => {
            const nextState = typeof newData === 'function' ? newData(prev) : newData;
            try {
                localStorage.setItem('nsgc_clubs', JSON.stringify(nextState));
            } catch (e) {
                console.error("Failed to save clubs to local storage", e);
            }
            return nextState;
        });
    };

    const updateEvents = (newData: Event[] | ((prev: Event[]) => Event[])) => {
        setEvents(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateElections = (newData: Election[] | ((prev: Election[]) => Election[])) => {
        setElections(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateAchievements = (newData: Achievement[] | ((prev: Achievement[]) => Achievement[])) => {
        setAchievements(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateUsers = (newData: User[] | ((prev: User[]) => User[])) => {
        setUsers(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updatePolls = (newData: Poll[] | ((prev: Poll[]) => Poll[])) => {
        setPolls(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateSurveys = (newData: Survey[] | ((prev: Survey[]) => Survey[])) => {
        setSurveys(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateGalleryImages = (newData: GalleryImage[] | ((prev: GalleryImage[]) => GalleryImage[])) => {
        setGalleryImages(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    return {
        announcements: apiAnnouncements, setAnnouncements: updateAnnouncements,
        members, setMembers: updateMembers,
        clubs, setClubs: updateClubs,
        events: apiEvents, setEvents: updateEvents,
        elections, setElections: updateElections,
        achievements, setAchievements: updateAchievements,
        users, setUsers: updateUsers,
        polls, setPolls: updatePolls,
        surveys, setSurveys: updateSurveys,
        galleryImages, setGalleryImages: updateGalleryImages,
        isLoaded: isLoaded && !apiLoading,
        totalUsers,
        refetchAnnouncements,
        refetchEvents
    };
}

