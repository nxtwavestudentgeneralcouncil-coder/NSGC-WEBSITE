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
const DEFAULT_GALLERY: GalleryImage[] = [];

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
        // Mock data initialization stripped for Nhost backend integration.
        setAnnouncements([]);
        setMembers([]);
        setClubs([]);
        setEvents([]);
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
    const updateAnnouncements = (newData: Announcement[] | ((prev: Announcement[]) => Announcement[])) => {
        setAnnouncements(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateMembers = (newData: CouncilMember[] | ((prev: CouncilMember[]) => CouncilMember[])) => {
        setMembers(prev => typeof newData === 'function' ? newData(prev) : newData);
    };

    const updateClubs = (newData: Club[] | ((prev: Club[]) => Club[])) => {
        setClubs(prev => typeof newData === 'function' ? newData(prev) : newData);
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
