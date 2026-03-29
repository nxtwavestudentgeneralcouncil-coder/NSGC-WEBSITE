import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const QUERIES: Record<string, string> = {
    announcements: `
    query GetAnnouncements {
        announcements(order_by: { created_at: desc }) {
            id title content category priority link is_active
            created_by created_at expires_at added_by_role
        }
    }`,
    events: `
    query GetEvents {
        events(order_by: { event_date: desc }) {
            id title description event_date venue organizer_type
            image_url registration_link added_by_role created_by
        }
    }`,
    clubs: `
    query GetClubs {
        clubs {
            id name slug description logo_url club_email category
            club_head_id lead website
            club_members {
                id role custom_name custom_email
                user { id displayName avatarUrl email }
            }
            club_events {
                id title description event_date image_url
            }
        }
    }`,
    council_members: `
    query GetCouncilMembers {
        council_members {
            id name role email status image
        }
    }`,
    elections: `
    query GetElections {
        elections {
            id title date description
            candidates { id name image votes }
        }
    }`,
    achievements: `
    query GetAchievements {
        achievements(order_by: { achievement_date: desc }) {
            id student_id title tier category achievement_date
            description image_url certificate_url verified
            added_by_role created_by
        }
    }`,
    polls: `
    query GetPolls {
        polls(order_by: { start_date: desc }) {
            id question options is_active start_date end_date created_by
        }
    }`,
    surveys: `
    query GetSurveys {
        surveys {
            id title description time link status
        }
    }`,
    gallery_images: `
    query GetGalleryImages {
        gallery_images {
            id src alt span added_by_role date_added created_by
        }
    }`,
    tickets: `
    query GetTickets {
        tickets(order_by: { created_at: desc }) {
            id title description status priority department votes
            assigned_to submitted_by submitted_by_email
            created_at updated_at timeline image_url
            hostel_type room_number due_at
        }
    }`,
    users: `
    query GetUsers {
        users {
            id displayName email avatarUrl createdAt defaultRole
        }
    }`
};

// Robust fallback for tickets if newer columns are missing
const TICKETS_FALLBACK_QUERY = `
    query GetTicketsFallback {
        tickets(order_by: { created_at: desc }) {
            id title description status priority department votes
            assigned_to submitted_by created_at updated_at
        }
    }
`;

export async function GET(req: NextRequest) {
    // 1. Verify Authentication & Authorization
    const allowedRoles = [
        'president', 'admin', 'developer', 'council', 'council_member', 
        'student', 'me_user', 'club_head', 'club_manager', 
        'mess_admin', 'mess-admin',
        'hostel_complaints', 'hostel-complaints'
    ];
    const session = await verifySession(req, allowedRoles);
    
    if (!session) {
        return unauthorizedResponse('Authentication required to access dashboard data');
    }

    const { user } = session;
    const userRoles = (user as any).roles || [];
    const defaultRole = user.defaultRole;
    
    const privilegedRoles = ['president', 'admin', 'developer', 'council', 'council_member', 'club_head', 'club_manager', 'mess_admin', 'mess-admin', 'hostel_complaints', 'hostel-complaints'];
    const isPrivileged = userRoles.some((r: string) => privilegedRoles.includes(r)) || privilegedRoles.includes(defaultRole);
    const isStudent = !isPrivileged && (userRoles.includes('student') || defaultRole === 'student' || defaultRole === 'me_user');

    // 2. Initialize Nhost Client
    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    const results: Record<string, any> = {};

    // 3. Perform Modular Fetching
    const queryEntries = Object.entries(QUERIES);
    const settledResults = await Promise.allSettled(
        queryEntries.map(async ([key, query]) => {
            try {
                const { data, error } = await nhost.graphql.request(query);
                if (error) {
                    // Try fallback for tickets specifically if it fails
                    if (key === 'tickets') {
                        console.warn('[get-dashboard-data] Tickets query failed, trying fallback...');
                        const fallbackResult = await nhost.graphql.request(TICKETS_FALLBACK_QUERY);
                        if (fallbackResult.data) return { key, data: fallbackResult.data[key] || [] };
                    }
                    console.error(`[get-dashboard-data] Error in ${key}:`, error);
                    return { key, data: [] }; // Return empty array on error for this section
                }
                return { key, data: data ? data[key] : [] };
            } catch (err) {
                console.error(`[get-dashboard-data] Exception in ${key}:`, err);
                return { key, data: [] };
            }
        })
    );

    // 4. Aggregating Results
    settledResults.forEach((res) => {
        if (res.status === 'fulfilled') {
            results[res.value.key] = res.value.data;
        }
    });

    // Handle case where some data is missing
    const data = {
        announcements: results.announcements || [],
        events: results.events || [],
        clubs: results.clubs || [],
        council_members: results.council_members || [],
        elections: results.elections || [],
        achievements: results.achievements || [],
        polls: results.polls || [],
        surveys: results.surveys || [],
        gallery_images: results.gallery_images || [],
        tickets: results.tickets || [],
        users: results.users || []
    };

    // 5. Finalize Response
    if (isStudent) {
        data.users = [];
    }

    return NextResponse.json(data, { 
        status: 200, 
        headers: { 
            'Cache-Control': 's-maxage=30, stale-while-revalidate=60' 
        } 
    });
}
