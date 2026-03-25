import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// Primary query — includes all columns (including newer ones)
const PRIMARY_QUERY = `
    query GetDashboardData {
        council_members {
            id name role email status image
        }
        elections {
            id title date description
            candidates { id name image votes }
        }
        achievements {
            id student_id title tier category achievement_date
            description image_url certificate_url verified
            added_by_role created_by
        }
        polls {
            id question options is_active start_date end_date created_by
        }
        surveys {
            id title description time link status
        }
        gallery_images {
            id src alt span added_by_role date_added created_by
        }
        announcements {
            id title content category priority link is_active
            created_by created_at expires_at added_by_role
        }
        events {
            id title description event_date venue organizer_type
            image_url registration_link added_by_role created_by
        }
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
        tickets {
            id title description status priority department votes
            assigned_to submitted_by submitted_by_email
            created_at updated_at timeline image_url
            hostel_type room_number
        }
        users {
            id
            displayName
            email
            avatarUrl
            createdAt
            defaultRole
        }
    }
`;

// Fallback query — removes newer ticket columns that may not be tracked yet
const FALLBACK_QUERY = `
    query GetDashboardDataFallback {
        council_members {
            id name role email status image
        }
        elections {
            id title date description
            candidates { id name image votes }
        }
        achievements {
            id student_id title tier category achievement_date
            description image_url certificate_url verified
            added_by_role created_by
        }
        polls {
            id question options is_active start_date end_date created_by
        }
        surveys {
            id title description time link status
        }
        gallery_images {
            id src alt span added_by_role date_added created_by
        }
        announcements {
            id title content category priority link is_active
            created_by created_at expires_at added_by_role
        }
        events {
            id title description event_date venue organizer_type
            image_url registration_link added_by_role created_by
        }
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
        tickets {
            id title description status priority department votes
            assigned_to submitted_by created_at updated_at
        }
        users {
            id
            displayName
            email
            avatarUrl
            createdAt
            defaultRole
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
    
    // A student is someone who ONLY has student-level roles, or we want to filter for them specifically.
    // However, if they have ANY administrative role, they should NOT be filtered as a student.
    const privilegedRoles = ['president', 'admin', 'developer', 'council', 'council_member', 'club_head', 'club_manager', 'mess_admin', 'mess-admin', 'hostel_complaints', 'hostel-complaints'];
    const isPrivileged = userRoles.some((r: string) => privilegedRoles.includes(r)) || privilegedRoles.includes(defaultRole);
    const isStudent = !isPrivileged && (userRoles.includes('student') || defaultRole === 'student' || defaultRole === 'me_user');

    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    try {
        // Try the primary query first
        const result = await nhost.graphql.request(PRIMARY_QUERY);
        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);

            console.warn('[get-dashboard-data] Primary query failed:', errorMessage);
            console.warn('[get-dashboard-data] Retrying with fallback query...');

            // Try the fallback query
            const fallbackResult = await nhost.graphql.request(FALLBACK_QUERY);
            const { data: fallbackData, error: fallbackError } = fallbackResult;

            if (fallbackError) {
                const fbError = Array.isArray(fallbackError)
                    ? fallbackError.map((e: any) => e?.message).join('; ')
                    : (fallbackError as any).message || String(fallbackError);
                console.error('[get-dashboard-data] Fallback also failed:', fbError);
                return NextResponse.json({ error: fbError }, { status: 500 });
            }

            return NextResponse.json(fallbackData ?? {}, { status: 200, headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
        }

        // If user is a student, hide the users list but keep ALL tickets.
        // The frontend (student dashboard) already filters tickets by the
        // user's live email from the Nhost session, so server-side filtering
        // is both redundant and broken (the cookie may lack the email field).
        if (isStudent && data) {
            data.users = [];
        }

        return NextResponse.json(data ?? {}, { status: 200, headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
    } catch (err: any) {
        console.error('[get-dashboard-data] Request threw exception:', err?.message);
        try {
            const fallbackResult = await nhost.graphql.request(FALLBACK_QUERY);
            const { data: fallbackData, error: fallbackError } = fallbackResult;

            if (fallbackError) {
                return NextResponse.json({ error: err.message }, { status: 500 });
            }

            if (isStudent && fallbackData) {
                (fallbackData as any).users = [];
            }
            return NextResponse.json(fallbackData ?? {}, { status: 200, headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
        } catch (innerErr: any) {
            console.error('[get-dashboard-data] Fallback also threw:', innerErr?.message);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }
}
