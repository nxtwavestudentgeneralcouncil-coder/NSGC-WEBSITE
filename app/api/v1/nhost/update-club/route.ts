import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Missing club ID' }, { status: 400 });
        }

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isValidUUID(body.id)) {
            return NextResponse.json({ message: `Invalid club ID format: ${body.id}` }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        const mutation = `
            mutation UpdateClub($id: uuid!, $name: String, $slug: String, $description: String, $logo_url: String, $club_email: String, $category: String, $website: String, $lead: String) {
                update_clubs_by_pk(pk_columns: {id: $id}, _set: {
                    name: $name,
                    slug: $slug,
                    description: $description,
                    logo_url: $logo_url,
                    club_email: $club_email,
                    category: $category,
                    website: $website,
                    lead: $lead
                }) {
                    id
                    name
                    slug
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
                id: body.id,
                name: body.name,
                slug: body.slug,
                description: body.description,
                logo_url: body.logo_url,
                club_email: body.club_email ? body.club_email.toLowerCase() : null,
                category: body.category,
                website: body.website,
                lead: body.lead
            });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Try to trigger role sync in background
        if (body.club_email) {
            try {
                import('@/lib/role-sync').then(({ syncUserRoleByEmail }) => {
                    syncUserRoleByEmail(body.club_email.toLowerCase(), 'club_manager', ['club_head']).catch(err => {
                        console.error("[UpdateClub] role sync error:", err);
                    });
                });
            } catch (e) {
                console.error("[UpdateClub] failed to trigger role sync:", e);
            }
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
