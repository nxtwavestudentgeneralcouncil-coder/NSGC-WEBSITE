'use client';

import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { useSharedContext } from '../components/providers/SharedDataProvider';
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
    createdBy?: string;
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
    slug: string;
    description: string;
    lead: string;
    members: number;
    teamMembers?: ClubTeamMember[];
    image?: string; // Base64 image string
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
    date: string;
    location: string;
    type: 'Academic' | 'Social' | 'Sports';
    image?: string; // Base64 image string
    registrationLink?: string; // Optional registration link
    organizer?: string; // Optional organizer/club name
    addedByRole?: string;
    createdBy?: string;
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
    tier?: 'Gold' | 'Silver' | 'Bronze' | 'Finalist'; // New field
    category: 'Academic' | 'Sports' | 'Research' | 'Cultural';
    date: string;
    description: string;
    image?: string; // Optional image URL
    addedByRole?: string;
    createdBy?: string;
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
    createdBy?: string;
    dateAdded?: string;
}

export interface Ticket {
    id: string;
    studentName: string;
    email: string;
    department: string;
    type: string;
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Review' | 'In Progress' | 'Completed' | 'Rejected';
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
    votes: number;
    timeline: any[];
    image?: string;
    hostelType?: string;
    roomNumber?: string;
    votedBy: string[];
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
    const context = useSharedContext();

    // Mapping state from context for backward compatibility
    const { 
        announcements, 
        events, 
        members, 
        clubs, 
        elections, 
        achievements, 
        users, 
        polls, 
        surveys, 
        galleryImages, 
        tickets, 
        isLoaded,
        apiLoading,
        error,
        totalUsers,
        refetch,
        setAnnouncements,
        setMembers,
        setClubs,
        setEvents,
        setElections,
        setAchievements,
        setUsers,
        setPolls,
        setSurveys,
        setGalleryImages,
        setTickets
    } = context;

    return {
        announcements,
        members,
        clubs,
        events,
        elections,
        achievements,
        users,
        polls,
        surveys,
        galleryImages,
        tickets,
        isLoaded: isLoaded && !apiLoading,
        error,
        totalUsers,
        refetchAnnouncements: refetch,
        refetchEvents: refetch,
        refetchElections: refetch,
        refetchGalleryImages: refetch,
        refetchAchievements: refetch,
        refetchMembers: refetch,
        refetchClubs: refetch,
        refetchPolls: refetch,
        refetchSurveys: refetch,
        refetchTickets: refetch,
        
        setAnnouncements,
        setMembers,
        setClubs,
        setEvents,
        setElections,
        setAchievements,
        setUsers,
        setPolls,
        setSurveys,
        setGalleryImages,
        setTickets
    };
}

