'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: string;
    link?: string; // Optional external link
    category?: string;
    priority?: string;
}

export interface CouncilEvent {
    id: string;
    name: string;
    date: string;
    location: string;
    type?: string;
    registrationLink?: string;
    image?: string;
}

interface CouncilContextType {
    announcements: Announcement[];
    events: CouncilEvent[];
    addAnnouncement: (title: string, content: string, author: string, link?: string, category?: string, priority?: string) => void;
    deleteAnnouncement: (id: string) => void;
    addEvent: (name: string, date: string, location: string, type?: string, registrationLink?: string, image?: string) => void;
    deleteEvent: (id: string) => void;
}

const CouncilContext = createContext<CouncilContextType | undefined>(undefined);

export const useCouncil = () => {
    const context = useContext(CouncilContext);
    if (!context) {
        throw new Error('useCouncil must be used within a CouncilProvider');
    }
    return context;
};

const STORAGE_KEY = 'nsgc_council_data_v3';

export const CouncilProvider = ({ children }: { children: ReactNode }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [events, setEvents] = useState<CouncilEvent[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Removed localStorage mock persistence logic
    useEffect(() => {
        setAnnouncements([]);
        setEvents([]);
        setIsLoaded(true);
    }, []);

    const addAnnouncement = (title: string, content: string, author: string, link?: string, category?: string, priority?: string) => {
        const newAnnouncement: Announcement = {
            id: uuidv4(),
            title,
            content,
            author,
            link,
            category: category || 'General',
            priority: priority || 'Low',
            createdAt: new Date().toISOString()
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);

        // Cross-context mock logic removed for Nhost Integration
    };

    const deleteAnnouncement = (id: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const addEvent = (name: string, date: string, location: string, type?: string, registrationLink?: string, image?: string) => {
        const newEvent: CouncilEvent = {
            id: uuidv4(),
            name,
            date,
            location,
            type: type || 'Social',
            registrationLink,
            image
        };
        setEvents(prev => [...prev, newEvent]);

        // Cross-context mock logic removed for Nhost Integration
    };

    const deleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    return (
        <CouncilContext.Provider value={{
            announcements,
            events,
            addAnnouncement,
            deleteAnnouncement,
            addEvent,
            deleteEvent
        }}>
            {children}
        </CouncilContext.Provider>
    );
};
