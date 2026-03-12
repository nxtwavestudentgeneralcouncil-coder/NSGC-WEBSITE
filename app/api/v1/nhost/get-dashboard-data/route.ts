import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const nhost = new NhostClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
    });

    const query = `
        query GetDashboardData {
            council_members {
                id
                name
                role
                email
                status
                image
            }
            elections {
                id
                title
                date
                description
                candidates {
                    id
                    name
                    image
                    votes
                }
            }
            achievements {
                id
                student_id
                title
                category
                achievement_date
                description
                image_url
                certificate_url
                verified
            }
            polls {
                id
                question
                options
                is_active
                start_date
                end_date
                created_by
            }
            surveys {
                id
                title
                description
                time
                link
                status
            }
            gallery_images {
                id
                src
                alt
                span
                added_by_role
                date_added
            }
            announcements {
                id
                title
                content
                category
                is_active
                created_by
                created_at
                expires_at
            }
            events {
                id
                title
                description
                event_date
                venue
                organizer_type
                image_url
                registration_link
            }
            clubs {
                id
                name
                slug
                description
                logo_url
                club_email
                category
                club_head_id
            }
        }
    `;

    try {
        const { data, error } = await nhost.graphql.request(query);

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error("GraphQL error:", errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json(data ?? {}, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
