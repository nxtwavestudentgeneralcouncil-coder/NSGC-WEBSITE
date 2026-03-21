import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation InsertClub($name: String!, $slug: String!, $description: String, $logo_url: String, $club_email: String, $category: String, $website: String, $lead: String) {
                insert_clubs_one(object: {
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

        const payload = {
            name: body.name,
            slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            description: body.description || '',
            logo_url: body.logo_url || null,
            club_email: body.club_email ? body.club_email.toLowerCase() : null,
            category: body.category || 'General',
            website: body.website || null,
            lead: body.lead || null
        };

        const result = await nhost.graphql.request({
            document: mutation,
            variables: payload
        });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
