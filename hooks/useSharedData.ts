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

// --- GraphQL Queries and Mutations ---
const QUERY_ANNOUNCEMENTS = gql`
  query GetLiveAnnouncements {
    announcements(where: {is_active: {_eq: true}}, order_by: {created_at: desc}) {
      id
      title
      content
      category
      created_at
    }
  }
`;

const INSERT_ANNOUNCEMENT = gql`
  mutation InsertAnnouncement($title: String!, $content: String!, $category: String!, $priority: String) {
    insert_announcements_one(object: {
      title: $title,
      content: $content,
      category: $category
    }) {
      id
    }
  }
`;

const QUERY_EVENTS = gql`
  query GetLiveEvents {
    events(order_by: {event_date: asc}) {
      id
      title
      description
      event_date
      venue
      organizer_type
      image_url
    }
  }
`;

const INSERT_EVENT = gql`
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
    // Apollo GraphQL Variables
    // 600000ms = 10 minutes polling interval
    const { data: announcementData, loading: announcementsLoading, refetch: refetchAnnouncements } = useQuery(QUERY_ANNOUNCEMENTS, { pollInterval: 600000 });
    const { data: eventData, loading: eventsLoading, refetch: refetchEvents } = useQuery(QUERY_EVENTS, { pollInterval: 600000 });
    
    const [insertAnnouncement] = useMutation(INSERT_ANNOUNCEMENT);
    const [insertEvent] = useMutation(INSERT_EVENT);

    const user = useUserData();

    // Local State Variables (for features not yet migrated to Nhost DB)
    const [members, setMembers] = useState<CouncilMember[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
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
        // Try loading from localStorage first to persist data across reloads during prototyping
        try {
            const savedClubs = localStorage.getItem('nsgc_clubs');
            if (savedClubs) {
                setClubs(JSON.parse(savedClubs));
            } else {
                setClubs([]);
            }

            const savedMembers = localStorage.getItem('nsgc_members');
            if (savedMembers) {
                setMembers(JSON.parse(savedMembers));
            } else {
                setMembers([]);
            }
        } catch (e) {
            console.error('Failed to load local storage data', e);
            setClubs([]);
            setMembers([]);
        }

        // Keep other mocked states empty for now, or you could add localStorage caching for them too
        setElections([]);
        setAchievements([]);
        setUsers([]);
        setTotalUsers(0);
        setPolls([]);
        setSurveys([]);
        setGalleryImages([]);
    };

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadAllData();
            setIsLoaded(true);
        }
    }, []);

    // Save helpers
    const updateAnnouncements = async (newData: any) => {
        // Intercept local state updates from old code and push to GraphQL.
        // We assume newData is either the array of announcements or a function, but we only really care about appending new ones right now based on old logic.
        // For actual app usage, the UI should call a dedicated function. We'll hack this by looking at what was added.
        if (Array.isArray(newData)) {
            // Find the newest announcement (naive assumption for compatibility)
            const latest = newData[newData.length - 1]; 
            if (latest && latest.title && latest.content) {
                try {
                    await insertAnnouncement({
                        variables: {
                            title: latest.title,
                            content: latest.content,
                            category: latest.category || 'General',
                            priority: latest.priority || 'Low'
                        }
                    });
                    // Force an immediate refetch so the user sees their own post right away
                    refetchAnnouncements();
                } catch (e) {
                    console.error("Failed to insert announcement via GraphQL:", e);
                }
            }
        }
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

    const updateEvents = async (newData: any) => {
         // Intercept local state updates and push to GraphQL.
        if (Array.isArray(newData)) {
            const latest = newData[newData.length - 1];
            if (latest && latest.name && latest.date) {
                try {
                     // Next.js components still use 'name' instead of 'title', mapping it here
                     await insertEvent({
                         variables: {
                             title: latest.name,
                             description: latest.description || 'No description provided.',
                             event_date: new Date(latest.date).toISOString(),
                             venue: latest.location || 'TBA',
                             // HACK: Use current user's role determining logic to pass organizer type, or default to 'council'
                             organizer_type: 'council' 
                         }
                     });
                     refetchEvents();
                } catch (e) {
                    console.error("Failed to insert event via GraphQL:", e);
                }
            }
        }
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

    // Formatting the received GraphQL data into the legacy Announcement structure
    const mappedAnnouncements: Announcement[] = announcementData?.announcements?.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        date: new Date(a.created_at).toLocaleDateString(),
        priority: 'Medium', // Could map priority too but hardcoding for now
        addedByRole: 'Council' // Hardcoding to 'Council' to pass existing filters just so UI renders
    })) || [];

    // Formatting the received GraphQL data into the legacy Event structure
    const mappedEvents: Event[] = eventData?.events?.map((e: any) => ({
        id: e.id,
        name: e.title,
        date: new Date(e.event_date).toLocaleDateString(),
        location: e.venue,
        type: e.organizer_type === 'council' ? 'Academic' : 'Social',
        addedByRole: e.organizer_type === 'council' ? 'Council' : 'Club Manager'
    })) || [];


    return {
        announcements: mappedAnnouncements, setAnnouncements: updateAnnouncements,
        members, setMembers: updateMembers,
        clubs, setClubs: updateClubs,
        events: mappedEvents, setEvents: updateEvents,
        elections, setElections: updateElections,
        achievements, setAchievements: updateAchievements,
        users, setUsers: updateUsers,
        polls, setPolls: updatePolls,
        surveys, setSurveys: updateSurveys,
        galleryImages, setGalleryImages: updateGalleryImages,
        isLoaded: isLoaded && !announcementsLoading && !eventsLoading,
        totalUsers
    };
}
