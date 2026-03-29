'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUserData } from '@nhost/react';

// --- Types (matching useSharedData.ts) ---
export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    priority: 'Low' | 'Medium' | 'High';
    category: 'General' | 'Academic' | 'Event' | 'Emergency';
    link?: string;
    author?: string;
    addedByRole?: string;
    createdBy?: string;
}

export interface CouncilMember {
    id: string;
    name: string;
    role: string;
    email: string;
    status: 'Active' | 'Inactive';
    image?: string;
}

export interface Club {
    id: string;
    name: string;
    slug: string;
    description: string;
    lead: string;
    members: number;
    image?: string;
    logo_url?: string;
    website?: string;
    category?: string;
    clubEmail?: string;
    club_members?: any[];
    club_events?: any[];
}

export interface Event {
    id: string;
    name: string;
    description: string;
    date: string;
    location: string;
    type: 'Academic' | 'Social';
    image?: string;
    registrationLink?: string;
    participants?: number;
    addedByRole?: string;
    createdBy?: string;
    club_id?: string;
    club_slug?: string;
    is_club_event?: boolean;
}

export interface Election {
    id: string;
    title: string;
    date: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    status: 'Upcoming' | 'Ongoing' | 'Completed';
    candidates: any[];
}

interface SharedDataState {
    announcements: Announcement[];
    events: Event[];
    members: CouncilMember[];
    clubs: Club[];
    elections: Election[];
    achievements: any[];
    users: any[];
    polls: any[];
    surveys: any[];
    galleryImages: any[];
    tickets: any[];
    totalUsers: number;
    isLoaded: boolean;
    apiLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setState: React.Dispatch<React.SetStateAction<Omit<SharedDataState, 'refetch' | 'setState' | 'setAnnouncements' | 'setEvents' | 'setMembers' | 'setClubs' | 'setElections' | 'setAchievements' | 'setUsers' | 'setPolls' | 'setSurveys' | 'setGalleryImages' | 'setTickets'>>>;
    setAnnouncements: (announcements: Announcement[] | ((prev: Announcement[]) => Announcement[])) => void;
    setEvents: (events: Event[] | ((prev: Event[]) => Event[])) => void;
    setMembers: (members: CouncilMember[] | ((prev: CouncilMember[]) => CouncilMember[])) => void;
    setClubs: (clubs: Club[] | ((prev: Club[]) => Club[])) => void;
    setElections: (elections: Election[] | ((prev: Election[]) => Election[])) => void;
    setAchievements: (achievements: any[] | ((prev: any[]) => any[])) => void;
    setUsers: (users: any[] | ((prev: any[]) => any[])) => void;
    setPolls: (polls: any[] | ((prev: any[]) => any[])) => void;
    setSurveys: (surveys: any[] | ((prev: any[]) => any[])) => void;
    setGalleryImages: (galleryImages: any[] | ((prev: any[]) => any[])) => void;
    setTickets: (tickets: any[] | ((prev: any[]) => any[])) => void;
}

const SharedDataContext = createContext<SharedDataState | undefined>(undefined);

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<Omit<SharedDataState, 'refetch' | 'setState' | 'setAnnouncements' | 'setEvents' | 'setMembers' | 'setClubs' | 'setElections' | 'setAchievements' | 'setUsers' | 'setPolls' | 'setSurveys' | 'setGalleryImages' | 'setTickets'>>({
        announcements: [],
        events: [],
        members: [],
        clubs: [],
        elections: [],
        achievements: [],
        users: [],
        polls: [],
        surveys: [],
        galleryImages: [],
        tickets: [],
        totalUsers: 0,
        isLoaded: false,
        apiLoading: true,
        error: null,
    });

    const parseCategoryFromRole = useCallback((role: string, fallback: string = 'Social') => {
        if (!role) return fallback;
        const match = role.match(/^\[(.*?)\]/);
        return match ? match[1] : fallback;
    }, []);

    const fetchAllData = useCallback(async () => {
        setState(prev => ({ ...prev, apiLoading: true, error: null }));
        try {
            console.log('[SharedDataProvider] Fetching dashboard data...');
            const res = await fetch('/api/v1/nhost/get-dashboard-data');

            if (!res.ok) {
                console.error(`[SharedDataProvider] HTTP ${res.status}: ${res.statusText}`);
                if (res.status === 401) {
                    const Cookies = (await import('js-cookie')).default;
                    Cookies.remove('nhostRefreshToken');
                    // Only redirect if NOT on the home page
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                    return;
                }
                setState(prev => ({ ...prev, apiLoading: false, isLoaded: true, error: `HTTP ${res.status}` }));
                return;
            }

            const data = await res.json();

            if (data.error) {
                const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                console.error('[SharedDataProvider] API Error:', errMsg);
                setState(prev => ({ ...prev, apiLoading: false, isLoaded: true, error: errMsg }));
                return;
            }

            // Simplified mapping for brevity in this context
            const mappedClubs: Club[] = (data.clubs || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug || '',
                description: c.description || '',
                lead: c.lead || (c.club_members?.find((m: any) => m.role === 'manager' || m.role === 'lead' || m.role === 'club_head')?.custom_name || c.club_members?.find((m: any) => m.role === 'manager' || m.role === 'lead' || m.role === 'club_head')?.user?.displayName) || '',
                members: c.club_members?.length || 0,
                image: c.logo_url,
                logo_url: c.logo_url,
                website: c.website || '',
                category: c.category || 'General',
                clubEmail: c.club_email || '',
                club_members: c.club_members || [],
                club_events: c.club_events || []
            }));

            const allClubEvents: Event[] = (data.clubs || []).flatMap((c: any) =>
                (c.club_events || []).map((e: any) => ({
                    id: e.id,
                    name: e.title,
                    description: e.description,
                    date: e.event_date,
                    location: c.name, // Use club name as location for club events
                    type: parseCategoryFromRole(e.added_by_role) || 'Social',
                    image: e.image_url,
                    registrationLink: e.registration_link, // Keep registration link if available
                    addedByRole: e.added_by_role, // Use event's added_by_role
                    club_id: c.id,
                    club_slug: c.slug,
                    is_club_event: true
                }))
            );

            const mappedAnnouncements: Announcement[] = (data.announcements || []).map((a: any) => ({
                id: a.id,
                title: a.title,
                content: a.content,
                date: a.created_at,
                priority: a.priority || 'Medium',
                category: a.category || 'General',
                link: a.link,
                addedByRole: a.added_by_role
            }));

            // ... Map other fields as needed or just pass through
            
            console.log(`[SharedDataProvider] Loaded ${mappedClubs.length} clubs and ${mappedAnnouncements.length} announcements.`);

            setState({
                announcements: mappedAnnouncements,
                events: [
                    ...(data.events || []).map((e: any) => ({
                        id: e.id,
                        name: e.title,
                        description: e.description,
                        date: e.event_date,
                        location: e.venue,
                        type: parseCategoryFromRole(e.added_by_role, e.organizer_type === 'council' ? 'Academic' : (['Academic', 'Social', 'Sports'].includes(e.organizer_type) ? e.organizer_type : 'Social')),
                        image: e.image_url,
                        registrationLink: e.registration_link,
                        addedByRole: e.added_by_role,
                        is_club_event: false
                    })),
                    ...allClubEvents
                ],
                members: data.council_members || [],
                clubs: mappedClubs,
                elections: (data.elections || []).map((el: any) => ({
                    id: el.id,
                    title: el.title,
                    date: el.date,
                    description: el.description,
                    startDate: el.start_date || el.date, 
                    startTime: el.start_time || '',
                    endDate: el.end_date || el.date,
                    endTime: el.end_time || '',
                    status: el.status || 'Ongoing',
                    candidates: el.candidates || []
                })),
                achievements: (data.achievements || []).map((a: any) => ({
                    ...a,
                    student: a.title || a.student || a.user?.displayName || 'Student',
                    date: a.achievement_date || a.date,
                    addedByRole: a.added_by_role,
                    createdBy: a.created_by
                })),
                users: (data.users || []).map((u: any) => ({
                    id: u.id,
                    firstName: u.displayName?.split(' ')[0] || 'Student',
                    lastName: u.displayName?.split(' ').slice(1).join(' ') || '',
                    displayName: u.displayName || 'Student',
                    email: u.email || '',
                    status: 'Active',
                    joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    avatarUrl: u.avatarUrl,
                    defaultRole: u.defaultRole
                })),
                polls: data.polls || [],
                surveys: data.surveys || [],
                galleryImages: (data.gallery_images || []).map((img: any) => ({
                    ...img,
                    addedByRole: img.added_by_role,
                    createdBy: img.created_by,
                    dateAdded: img.date_added
                })),
                tickets: (data.tickets || []).map((t: any) => ({
                    id: t.id,
                    studentName: t.submitted_by,
                    email: t.submitted_by_email,
                    department: t.department,
                    type: t.type || (t.department === 'Hostel' ? 'Hostel' : (t.hostel_type ? 'Hostel' : 'Other')),
                    subject: t.title,
                    description: t.description,
                    priority: t.priority,
                    status: t.status,
                    votes: t.votes || 0,
                    assignedTo: t.assigned_to,
                    createdAt: t.created_at,
                    updatedAt: t.updated_at,
                    timeline: t.timeline || [],
                    image: t.image_url,
                    hostelType: t.hostel_type,
                    roomNumber: t.room_number,
                    votedBy: t.voted_by || [],
                    dueAt: t.due_at
                })),
                totalUsers: data.users?.length || 0,
                isLoaded: true,
                apiLoading: false,
                error: null,
            });
        } catch (error: any) {
            console.error('[SharedDataProvider] Fetch failed:', error);
            setState(prev => ({ ...prev, apiLoading: false, isLoaded: true, error: error.message }));
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const setAnnouncements = useCallback((val: Announcement[] | ((prev: Announcement[]) => Announcement[])) => {
        setState(prev => ({ ...prev, announcements: typeof val === 'function' ? val(prev.announcements) : val }));
    }, []);

    const setEvents = useCallback((val: Event[] | ((prev: Event[]) => Event[])) => {
        setState(prev => ({ ...prev, events: typeof val === 'function' ? val(prev.events) : val }));
    }, []);

    const setMembers = useCallback((val: CouncilMember[] | ((prev: CouncilMember[]) => CouncilMember[])) => {
        setState(prev => ({ ...prev, members: typeof val === 'function' ? val(prev.members) : val }));
    }, []);

    const setClubs = useCallback((val: Club[] | ((prev: Club[]) => Club[])) => {
        setState(prev => ({ ...prev, clubs: typeof val === 'function' ? val(prev.clubs) : val }));
    }, []);

    const setElections = useCallback((val: Election[] | ((prev: Election[]) => Election[])) => {
        setState(prev => ({ ...prev, elections: typeof val === 'function' ? val(prev.elections) : val }));
    }, []);

    const setAchievements = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, achievements: typeof val === 'function' ? val(prev.achievements) : val }));
    }, []);

    const setUsers = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, users: typeof val === 'function' ? val(prev.users) : val }));
    }, []);

    const setPolls = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, polls: typeof val === 'function' ? val(prev.polls) : val }));
    }, []);

    const setSurveys = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, surveys: typeof val === 'function' ? val(prev.surveys) : val }));
    }, []);

    const setGalleryImages = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, galleryImages: typeof val === 'function' ? val(prev.galleryImages) : val }));
    }, []);

    const setTickets = useCallback((val: any[] | ((prev: any[]) => any[])) => {
        setState(prev => ({ ...prev, tickets: typeof val === 'function' ? val(prev.tickets) : val }));
    }, []);

    const contextValue: SharedDataState = useMemo(() => ({
        ...state,
        refetch: fetchAllData,
        setState,
        setAnnouncements,
        setEvents,
        setMembers,
        setClubs,
        setElections,
        setAchievements,
        setUsers,
        setPolls,
        setSurveys,
        setGalleryImages,
        setTickets
    }), [state, fetchAllData, setState, setAnnouncements, setEvents, setMembers, setClubs, setElections, setAchievements, setUsers, setPolls, setSurveys, setGalleryImages, setTickets]);

    return (
        <SharedDataContext.Provider value={contextValue}>
            {children}
        </SharedDataContext.Provider>
    );
}

export function useSharedContext() {
    const context = useContext(SharedDataContext);
    if (context === undefined) {
        throw new Error('useSharedContext must be used within a SharedDataProvider');
    }
    return context;
}
