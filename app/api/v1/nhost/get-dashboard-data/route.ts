import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

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
                id role
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
                id role
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
    }
`;

export async function GET() {
    const nhost = new NhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    try {
        // Try the primary query first
        const { data, error } = await nhost.graphql.request(PRIMARY_QUERY);

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);

            console.warn('[get-dashboard-data] Primary query failed:', errorMessage);
            console.warn('[get-dashboard-data] Retrying with fallback query...');

            // Try the fallback query
            const fallbackResult = await nhost.graphql.request(FALLBACK_QUERY);
            if (fallbackResult.error) {
                const fbError = Array.isArray(fallbackResult.error)
                    ? fallbackResult.error.map((e: any) => e?.message).join('; ')
                    : (fallbackResult.error as any).message || String(fallbackResult.error);
                console.error('[get-dashboard-data] Fallback also failed:', fbError);
                return NextResponse.json({ error: fbError }, { status: 500 });
            }

            return NextResponse.json(fallbackResult.data ?? {}, { status: 200 });
        }

        return NextResponse.json(data ?? {}, { status: 200 });
    } catch (err: any) {
        console.error('[get-dashboard-data] Request threw exception:', err?.message);
        try {
            const fallbackResult = await nhost.graphql.request(FALLBACK_QUERY);
            if (fallbackResult.error) {
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
            return NextResponse.json(fallbackResult.data ?? {}, { status: 200 });
        } catch (innerErr: any) {
            console.error('[get-dashboard-data] Fallback also threw:', innerErr?.message);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }
}
