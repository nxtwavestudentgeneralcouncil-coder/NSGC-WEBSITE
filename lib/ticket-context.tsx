'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type TicketStatus = 'Pending' | 'In Review' | 'In Progress' | 'Completed' | 'Rejected';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type Department = 'Academic' | 'Hostel' | 'Sanitation' | 'Ragging' | 'Other';

export interface TimelineEvent {
    status: string;
    date: string;
    completed: boolean;
    description?: string;
}

export interface Ticket {
    id: string;
    studentName: string;
    email: string;
    department: string; // Using string to allow flexibility, but typed as Department in UI
    type: string;
    subject: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
    timeline: TimelineEvent[];
    proofUrl?: string; // Mock URL
    image?: string; // Base64 image string
    votes: number;
    votedBy: string[]; // Array of user emails/IDs who have voted
}

interface TicketContextType {
    tickets: Ticket[];
    createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'status' | 'assignedTo' | 'votes' | 'votedBy'>) => string;
    updateTicketStatus: (id: string, status: TicketStatus, note?: string) => void;
    updateTicketContent: (id: string, updates: Partial<Ticket>) => void;
    deleteTicket: (id: string) => void;
    assignTicket: (id: string, adminName: string) => void;
    addComment: (id: string, comment: string) => void;
    upvoteTicket: (id: string, userId: string) => void;
    getTicketById: (id: string) => Ticket | undefined;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const useTickets = () => {
    const context = useContext(TicketContext);
    if (!context) {
        throw new Error('useTickets must be used within a TicketProvider');
    }
    return context;
};

const STORAGE_KEY = 'nsgc_tickets_v3';

export const TicketProvider = ({ children }: { children: ReactNode }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Removed localStorage mock persistence logic
    useEffect(() => {
        setTickets([]);
        setIsLoaded(true);
    }, []);

    const createTicket = (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'status' | 'assignedTo' | 'votes' | 'votedBy'>) => {
        const newTicket: Ticket = {
            ...data,
            id: `CMP-2025-${String(tickets.length + 100).padStart(3, '0')}`,
            status: 'Pending',
            assignedTo: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timeline: [
                {
                    status: 'Received',
                    date: new Date().toLocaleString(),
                    completed: true,
                    description: 'Ticket created successfully'
                }
            ],
            votes: 0,
            votedBy: []
        };
        setTickets(prev => [newTicket, ...prev]);
        return newTicket.id;
    };

    const updateTicketStatus = (id: string, status: TicketStatus, note?: string) => {
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                const newTimelineItem: TimelineEvent = {
                    status: status,
                    date: new Date().toLocaleString(),
                    completed: true,
                    description: note || `Status updated to ${status}`
                };
                return {
                    ...ticket,
                    status,
                    updatedAt: new Date().toISOString(),
                    timeline: [...ticket.timeline, newTimelineItem]
                };
            }
            return ticket;
        }));
    };

    const updateTicketContent = (id: string, updates: Partial<Ticket>) => {
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                return {
                    ...ticket,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            }
            return ticket;
        }));
    };

    const deleteTicket = (id: string) => {
        setTickets(prev => prev.filter(ticket => ticket.id !== id));
    };

    const assignTicket = (id: string, adminName: string) => {
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                return {
                    ...ticket,
                    assignedTo: adminName,
                    status: ticket.status === 'Pending' ? 'In Review' : ticket.status,
                    updatedAt: new Date().toISOString(),
                    timeline: [...ticket.timeline, {
                        status: 'Assigned',
                        date: new Date().toLocaleString(),
                        completed: true,
                        description: `Assigned to ${adminName}`
                    }]
                };
            }
            return ticket;
        }));
    };

    const addComment = (id: string, comment: string) => {
        // In a real app, comments might be a separate array. Here we'll just log it in the timeline/update time
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                return {
                    ...ticket,
                    updatedAt: new Date().toISOString(),
                    timeline: [...ticket.timeline, {
                        status: 'Comment Added',
                        date: new Date().toLocaleString(),
                        completed: true,
                        description: comment
                    }]
                };
            }
            return ticket;
        }));
    };

    const upvoteTicket = (id: string, userId: string) => {
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                // Ensure votedBy exists
                const currentVotedBy = ticket.votedBy || [];
                const currentVotes = ticket.votes || 0;

                const hasVoted = currentVotedBy.includes(userId);

                // Toggle vote
                if (hasVoted) {
                    return {
                        ...ticket,
                        votes: Math.max(0, currentVotes - 1),
                        votedBy: currentVotedBy.filter(u => u !== userId)
                    };
                } else {
                    return {
                        ...ticket,
                        votes: currentVotes + 1,
                        votedBy: [...currentVotedBy, userId]
                    };
                }
            }
            return ticket;
        }));
    };

    const getTicketById = (id: string) => tickets.find(t => t.id === id);

    return (
        <TicketContext.Provider value={{
            tickets,
            createTicket,
            updateTicketStatus,
            updateTicketContent,
            deleteTicket,
            assignTicket,
            addComment,
            upvoteTicket,
            getTicketById
        }}>
            {children}
        </TicketContext.Provider>
    );
};
