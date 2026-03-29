'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSharedData } from '@/hooks/useSharedData';

export type TicketStatus = 'Pending' | 'In Review' | 'In Progress' | 'Completed' | 'Rejected';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type Department = 'Academic' | 'Hostel' | 'Mess';

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
    assignedTo: string | null; // User ID
    assignedToName?: string | null; // User Display Name
    createdAt: string;
    updatedAt: string;
    timeline: TimelineEvent[];
    proofUrl?: string; // Mock URL
    image?: string; // Base64 image string
    hostelType?: string;
    roomNumber?: string;
    block?: string;
    floor?: string;
    votes: number;
    votedBy: string[]; // Array of user emails/IDs who have voted
    tags?: string[];
    beforeImageUrl?: string;
    afterImageUrl?: string;
    expectedResolutionTime?: string;
    dueAt?: string;
    isEscalated?: boolean;
    scheduledDate?: string;
    timeSlot?: string;
}

interface TicketContextType {
    tickets: Ticket[];
    createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'status' | 'assignedTo' | 'votes' | 'votedBy' | 'isEscalated'>) => Promise<string>;
    updateTicketStatus: (id: string, status: TicketStatus, note?: string, afterImageUrl?: string) => void;
    updateTicketContent: (id: string, updates: Partial<Ticket>) => void;
    deleteTicket: (id: string) => void;
    assignTicket: (id: string, userId: string, userName: string) => void;
    addComment: (id: string, comment: string) => void;
    upvoteTicket: (id: string, userId: string) => void;
    getTicketById: (id: string) => Ticket | undefined;
    refreshTickets: () => void;
    setDeadline: (id: string, dueAt: string) => void;
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
    const { tickets, refetchTickets, isLoaded } = useSharedData();
    const [localTickets, setLocalTickets] = useState<Ticket[]>([]);

    // Sync localTickets with hook tickets
    useEffect(() => {
        if (isLoaded) {
            setLocalTickets(tickets || []);
        }
    }, [isLoaded, tickets]);

    const createTicket = async (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'status' | 'assignedTo' | 'votes' | 'votedBy'>) => {
        const tempId = `CMP-PENDING-${Date.now()}`;
        
        // Optimistic update
        const newTicket: Ticket = {
            ...data,
            id: tempId,
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
            votedBy: [],
            isEscalated: false
        };
        
        setLocalTickets(prev => [newTicket, ...prev]);

        try {
            // Backend call
            const response = await fetch('/api/v1/nhost/insert-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const resData = await response.json();
            
            if (resData.success && resData.data?.insert_tickets_one?.id) {
                const realId = resData.data.insert_tickets_one.id;
                
                // Update the optimistic ticket in local state with the real ID
                setLocalTickets(prev => prev.map(t => 
                    t.id === tempId ? { ...t, id: realId } : t
                ));
                
                await refetchTickets();
                return realId;
            } else {
                console.error("Failed to get persistent ID from backend:", resData);
                return tempId;
            }
        } catch (err) {
            console.error("Failed to save ticket:", err);
            return tempId;
        }
    };

    const updateTicketStatus = (id: string, status: TicketStatus, note?: string, afterImageUrl?: string) => {
        let updatedTimeline: TimelineEvent[] = [];
        setLocalTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                const newTimelineItem: TimelineEvent = {
                    status: status,
                    date: new Date().toLocaleString(),
                    completed: true,
                    description: note || `Status updated to ${status}`
                };
                updatedTimeline = [...ticket.timeline, newTimelineItem];
                return {
                    ...ticket,
                    status,
                    updatedAt: new Date().toISOString(),
                    timeline: updatedTimeline,
                    afterImageUrl: afterImageUrl || ticket.afterImageUrl
                };
            }
            return ticket;
        }));

        // Persist to backend
        console.log(`[TicketContext] Updating ticket ${id} to status: ${status}`);
        fetch('/api/v1/nhost/update-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, timeline: updatedTimeline, after_image_url: afterImageUrl })
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
                console.log(`[TicketContext] Status update persisted for ticket ${id}`);
                refetchTickets();
            } else {
                console.error(`[TicketContext] Failed to persist status update:`, data);
            }
          })
          .catch(err => console.error("[TicketContext] Failed to update status:", err));
    };

    const updateTicketContent = (id: string, updates: Partial<Ticket>) => {
        setLocalTickets(prev => prev.map(ticket => {
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
        setLocalTickets(prev => prev.filter(ticket => ticket.id !== id));
    };

    const assignTicket = (id: string, userId: string, userName: string) => {
        let updatedTimeline: TimelineEvent[] = [];
        let updatedStatus: TicketStatus = 'In Review';
        
        setLocalTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                updatedStatus = ticket.status === 'Pending' ? 'In Review' : ticket.status;
                const newTimelineItem = {
                    status: 'Assigned',
                    date: new Date().toLocaleString(),
                    completed: true,
                    description: `Assigned to ${userName}`
                };
                updatedTimeline = [...ticket.timeline, newTimelineItem];
                return {
                    ...ticket,
                    assignedTo: userId,
                    assignedToName: userName,
                    status: updatedStatus,
                    updatedAt: new Date().toISOString(),
                    timeline: updatedTimeline
                };
            }
            return ticket;
        }));
 
        // Persist to backend
        fetch('/api/v1/nhost/update-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id, 
                assigned_to: userId, 
                assigned_to_name: userName,
                status: updatedStatus, 
                timeline: updatedTimeline 
            })
        }).then(res => res.json())
          .then(data => {
            if (data.success) refetchTickets();
          })
          .catch(err => console.error("Failed to assign ticket:", err));
    };

    const addComment = (id: string, comment: string) => {
        // In a real app, comments might be a separate array. Here we'll just log it in the timeline/update time
        setLocalTickets(prev => prev.map(ticket => {
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
        setLocalTickets(prev => prev.map(ticket => {
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

    const getTicketById = (id: string) => localTickets.find(t => t.id === id);

    const setDeadline = (id: string, dueAt: string) => {
        // Optimistic update
        setLocalTickets(prev => prev.map(ticket => {
            if (ticket.id === id) {
                return { ...ticket, dueAt, updatedAt: new Date().toISOString() };
            }
            return ticket;
        }));

        // Persist to backend
        fetch('/api/v1/nhost/update-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, due_at: dueAt })
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
                console.log(`[TicketContext] Deadline set for ticket ${id}`);
                refetchTickets();
            } else {
                console.error(`[TicketContext] Failed to set deadline:`, data);
            }
          })
          .catch(err => console.error('[TicketContext] Failed to set deadline:', err));
    };

    const contextValue = useMemo(() => ({
        tickets: localTickets,
        createTicket,
        updateTicketStatus,
        updateTicketContent,
        deleteTicket,
        assignTicket,
        addComment,
        upvoteTicket,
        getTicketById,
        refreshTickets: refetchTickets,
        setDeadline
    }), [localTickets, refetchTickets]);

    return (
        <TicketContext.Provider value={contextValue}>
            {children}
        </TicketContext.Provider>
    );
};
